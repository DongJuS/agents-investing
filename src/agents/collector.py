"""
src/agents/collector.py — CollectorAgent MVP

- FinanceDataReader로 일봉 데이터를 수집해 PostgreSQL에 upsert
- 최신 가격을 Redis 캐시에 반영
- data_ready 이벤트 발행 + heartbeat 기록
"""

from __future__ import annotations

import argparse
import asyncio
from datetime import datetime, timedelta
import json
import sys
from pathlib import Path
from zoneinfo import ZoneInfo

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
load_dotenv(ROOT / ".env")

from src.db.models import AgentHeartbeatRecord, MarketDataPoint
from src.db.queries import insert_heartbeat, upsert_market_data
from src.utils.logging import get_logger, setup_logging
from src.utils.redis_client import (
    KEY_LATEST_TICKS,
    TOPIC_MARKET_DATA,
    publish_message,
    set_heartbeat,
    get_redis,
)

setup_logging()
logger = get_logger(__name__)

KST = ZoneInfo("Asia/Seoul")


class CollectorAgent:
    def __init__(self, agent_id: str = "collector_agent") -> None:
        self.agent_id = agent_id

    @staticmethod
    def _load_fdr():
        import FinanceDataReader as fdr

        return fdr

    def _resolve_tickers(self, requested: list[str] | None, limit: int = 20) -> list[tuple[str, str, str]]:
        fdr = self._load_fdr()
        listing = fdr.StockListing("KRX")

        selected: list[tuple[str, str, str]] = []
        for _, row in listing.iterrows():
            ticker = str(row.get("Code", "")).strip()
            name = str(row.get("Name", ticker)).strip()
            market = str(row.get("Market", "")).strip().upper()
            if market not in {"KOSPI", "KOSDAQ"}:
                continue
            if requested and ticker not in requested:
                continue
            selected.append((ticker, name, market))
            if len(selected) >= limit and not requested:
                break

        if requested:
            # 요청 티커가 listing에 없으면 UNKNOWN으로라도 포함해 수집 시도
            missing = [t for t in requested if t not in {x[0] for x in selected}]
            selected.extend((t, t, "KOSPI") for t in missing)
        return selected

    def _fetch_latest_daily(self, ticker: str, name: str, market: str, lookback_days: int) -> MarketDataPoint | None:
        fdr = self._load_fdr()
        start_date = (datetime.now(KST) - timedelta(days=lookback_days)).date().isoformat()
        df = fdr.DataReader(ticker, start_date)
        if df is None or df.empty:
            return None

        row = df.iloc[-1]
        index = df.index[-1]
        trade_date = index.date() if hasattr(index, "date") else datetime.now(KST).date()
        ts = datetime(
            trade_date.year,
            trade_date.month,
            trade_date.day,
            15,
            30,
            tzinfo=KST,
        )

        change_raw = row.get("Change")
        change_pct = float(change_raw * 100.0) if change_raw is not None else None

        return MarketDataPoint(
            ticker=ticker,
            name=name,
            market=market if market in {"KOSPI", "KOSDAQ"} else "KOSPI",
            timestamp_kst=ts,
            interval="daily",
            open=int(row.get("Open", 0)),
            high=int(row.get("High", 0)),
            low=int(row.get("Low", 0)),
            close=int(row.get("Close", 0)),
            volume=int(row.get("Volume", 0)),
            change_pct=change_pct,
        )

    async def collect_daily_bars(
        self,
        tickers: list[str] | None = None,
        lookback_days: int = 7,
    ) -> list[MarketDataPoint]:
        selected = await asyncio.to_thread(self._resolve_tickers, tickers)
        points: list[MarketDataPoint] = []

        for ticker, name, market in selected:
            try:
                point = await asyncio.to_thread(
                    self._fetch_latest_daily,
                    ticker,
                    name,
                    market,
                    lookback_days,
                )
                if point:
                    points.append(point)
            except Exception as e:
                logger.warning("수집 실패 [%s]: %s", ticker, e)

        saved = await upsert_market_data(points)

        redis = await get_redis()
        for point in points:
            payload = {
                "ticker": point.ticker,
                "name": point.name,
                "current_price": point.close,
                "change_pct": point.change_pct,
                "volume": point.volume,
                "updated_at": point.timestamp_kst.isoformat(),
            }
            await redis.set(
                KEY_LATEST_TICKS.format(ticker=point.ticker),
                json.dumps(payload, ensure_ascii=False),
                ex=60,
            )

        await publish_message(
            TOPIC_MARKET_DATA,
            json.dumps(
                {
                    "type": "data_ready",
                    "agent_id": self.agent_id,
                    "count": saved,
                    "tickers": [p.ticker for p in points[:20]],
                    "timestamp_utc": datetime.utcnow().isoformat() + "Z",
                },
                ensure_ascii=False,
            ),
        )

        await set_heartbeat(self.agent_id)
        await insert_heartbeat(
            AgentHeartbeatRecord(
                agent_id=self.agent_id,
                status="healthy",
                last_action=f"일봉 수집 완료 ({saved}건)",
                metrics={"collected_count": saved},
            )
        )

        logger.info("CollectorAgent 일봉 수집 완료: %d건", saved)
        return points

    async def collect_realtime_ticks(
        self,
        tickers: list[str],
        cycles: int = 3,
        interval_seconds: int = 30,
    ) -> None:
        """
        MVP 폴백 모드:
        - KIS WebSocket 본연동 전, 짧은 주기로 최신 가격 스냅샷을 재수집해 tick 캐시를 갱신합니다.
        """
        for cycle in range(1, cycles + 1):
            await self.collect_daily_bars(tickers=tickers, lookback_days=2)
            logger.info("실시간 폴백 사이클 %d/%d 완료", cycle, cycles)
            if cycle < cycles:
                await asyncio.sleep(interval_seconds)


async def _main_async(args: argparse.Namespace) -> None:
    agent = CollectorAgent()
    tickers = args.tickers.split(",") if args.tickers else None

    if args.realtime and tickers:
        await agent.collect_realtime_ticks(
            tickers=tickers,
            cycles=args.cycles,
            interval_seconds=args.interval_seconds,
        )
    else:
        await agent.collect_daily_bars(tickers=tickers, lookback_days=args.lookback_days)


def main() -> None:
    parser = argparse.ArgumentParser(description="CollectorAgent MVP")
    parser.add_argument("--tickers", default="", help="쉼표 구분 티커 목록 (예: 005930,000660)")
    parser.add_argument("--lookback-days", type=int, default=7, help="일봉 수집 lookback 기간")
    parser.add_argument("--realtime", action="store_true", help="폴백 실시간 스냅샷 모드")
    parser.add_argument("--cycles", type=int, default=3, help="realtime 모드 반복 횟수")
    parser.add_argument("--interval-seconds", type=int, default=30, help="realtime 모드 주기(초)")
    args = parser.parse_args()
    asyncio.run(_main_async(args))


if __name__ == "__main__":
    main()
