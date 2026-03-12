"""
src/agents/strategy_b_consensus.py — Strategy B Consensus/Debate MVP

- Proposer / Challenger / Synthesizer 구조를 단일 실행기로 단순화
- debate_transcripts 저장 + strategy B predictions 기록
"""

from __future__ import annotations

import argparse
import asyncio
from dataclasses import dataclass
from datetime import date, datetime
import json
import sys
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
load_dotenv(ROOT / ".env")

from src.db.models import PredictionSignal
from src.db.queries import fetch_recent_ohlcv, insert_debate_transcript, insert_prediction
from src.llm.claude_client import ClaudeClient
from src.llm.gemini_client import GeminiClient
from src.llm.gpt_client import GPTClient
from src.utils.logging import get_logger, setup_logging

setup_logging()
logger = get_logger(__name__)


@dataclass
class DebateResult:
    signal: str
    confidence: float
    proposer: str
    challenger1: str
    challenger2: str
    synthesizer: str
    consensus_reached: bool
    no_consensus_reason: str | None = None


class StrategyBConsensus:
    def __init__(self) -> None:
        self.claude = ClaudeClient(model="claude-3-5-sonnet-latest")
        self.gpt = GPTClient(model="gpt-4o-mini")
        self.gemini = GeminiClient(model="gemini-1.5-pro")

    @staticmethod
    def _rule_signal(candles: list[dict]) -> tuple[str, float, str]:
        if not candles:
            return "HOLD", 0.5, "데이터 부족"
        closes = [int(c["close"]) for c in candles[:20]]
        latest = closes[0]
        avg5 = sum(closes[:5]) / min(5, len(closes))
        avg20 = sum(closes) / len(closes)
        if avg5 > avg20 * 1.01:
            return "BUY", 0.62, f"단기 평균({avg5:.1f})이 장기 평균({avg20:.1f}) 상회"
        if avg5 < avg20 * 0.99:
            return "SELL", 0.61, f"단기 평균({avg5:.1f})이 장기 평균({avg20:.1f}) 하회"
        return "HOLD", 0.55, f"평균 근접 구간(현재가 {latest})"

    async def _propose(self, ticker: str, candles: list[dict]) -> dict[str, Any]:
        fallback_signal, fallback_conf, fallback_reason = self._rule_signal(candles)
        if not self.claude.is_configured:
            return {
                "signal": fallback_signal,
                "confidence": fallback_conf,
                "argument": f"[fallback] {fallback_reason}",
            }

        compact = [
            {"c": int(c["close"]), "v": int(c["volume"]), "ts": str(c["timestamp_kst"])}
            for c in candles[:20]
        ]
        prompt = f"""
티커 {ticker}의 최근 데이터: {json.dumps(compact, ensure_ascii=False)}
BUY/SELL/HOLD 중 하나를 선택하고 JSON으로 답해라:
{{
  "signal": "BUY|SELL|HOLD",
  "confidence": 0.0~1.0,
  "argument": "핵심 근거 한 문단"
}}
"""
        try:
            data = await self.claude.ask_json(prompt)
            signal = str(data.get("signal", "HOLD")).upper()
            if signal not in {"BUY", "SELL", "HOLD"}:
                signal = "HOLD"
            confidence = float(data.get("confidence", fallback_conf))
            return {
                "signal": signal,
                "confidence": confidence,
                "argument": data.get("argument", fallback_reason),
            }
        except Exception as e:
            logger.warning("proposer 실패 [%s]: %s", ticker, e)
            return {
                "signal": fallback_signal,
                "confidence": fallback_conf,
                "argument": f"[fallback] {fallback_reason}",
            }

    async def _challenge(self, role: str, ticker: str, proposer: dict[str, Any], use_client: str) -> str:
        prompt = f"""
역할: {role}
티커: {ticker}
Proposer 주장: {json.dumps(proposer, ensure_ascii=False)}
반론을 2~3문장으로 작성해라.
"""

        try:
            if use_client == "gpt" and self.gpt.is_configured:
                return await self.gpt.ask(prompt)
            if use_client == "gemini" and self.gemini.is_configured:
                return await self.gemini.ask(prompt)
        except Exception as e:
            logger.warning("%s challenger 실패 [%s]: %s", use_client, ticker, e)

        return f"[fallback-{role}] proposer 신호({proposer['signal']})는 변동성 및 리스크 요인을 추가 검토해야 함."

    async def _synthesize(
        self,
        ticker: str,
        proposer: dict[str, Any],
        challenger1: str,
        challenger2: str,
    ) -> DebateResult:
        fallback_signal = proposer["signal"]
        fallback_conf = float(proposer.get("confidence", 0.55))
        fallback_consensus = fallback_conf >= 0.57

        if self.claude.is_configured:
            prompt = f"""
티커: {ticker}
proposer: {json.dumps(proposer, ensure_ascii=False)}
challenger1: {challenger1}
challenger2: {challenger2}

최종 결론을 JSON으로 출력:
{{
  "final_signal": "BUY|SELL|HOLD",
  "confidence": 0.0~1.0,
  "consensus_reached": true/false,
  "summary": "종합 근거"
}}
"""
            try:
                data = await self.claude.ask_json(prompt)
                signal = str(data.get("final_signal", fallback_signal)).upper()
                if signal not in {"BUY", "SELL", "HOLD"}:
                    signal = "HOLD"
                conf = float(data.get("confidence", fallback_conf))
                consensus = bool(data.get("consensus_reached", fallback_consensus))
                summary = data.get("summary", "종합 판단")
                return DebateResult(
                    signal=signal,
                    confidence=conf,
                    proposer=proposer["argument"],
                    challenger1=challenger1,
                    challenger2=challenger2,
                    synthesizer=summary,
                    consensus_reached=consensus,
                    no_consensus_reason=None if consensus else "consensus_not_reached",
                )
            except Exception as e:
                logger.warning("synthesizer 실패 [%s]: %s", ticker, e)

        signal = fallback_signal if fallback_consensus else "HOLD"
        summary = "fallback 합의 결과"
        return DebateResult(
            signal=signal,
            confidence=fallback_conf,
            proposer=proposer["argument"],
            challenger1=challenger1,
            challenger2=challenger2,
            synthesizer=summary,
            consensus_reached=fallback_consensus,
            no_consensus_reason=None if fallback_consensus else "fallback_no_consensus",
        )

    async def run_for_ticker(self, ticker: str) -> PredictionSignal:
        started = datetime.utcnow()
        candles = await fetch_recent_ohlcv(ticker=ticker, days=30)
        proposer = await self._propose(ticker=ticker, candles=candles)
        challenger1 = await self._challenge("Challenger1", ticker, proposer, use_client="gpt")
        challenger2 = await self._challenge("Challenger2", ticker, proposer, use_client="gemini")
        synthesis = await self._synthesize(ticker, proposer, challenger1, challenger2)

        duration = int((datetime.utcnow() - started).total_seconds())
        transcript_id = await insert_debate_transcript(
            trading_date=date.today(),
            ticker=ticker,
            rounds=1,
            consensus_reached=synthesis.consensus_reached,
            final_signal=synthesis.signal,
            confidence=synthesis.confidence,
            proposer_content=synthesis.proposer,
            challenger1_content=synthesis.challenger1,
            challenger2_content=synthesis.challenger2,
            synthesizer_content=synthesis.synthesizer,
            no_consensus_reason=synthesis.no_consensus_reason,
            duration_seconds=duration,
        )

        signal = PredictionSignal(
            agent_id="consensus_synthesizer",
            llm_model="claude-3-5-sonnet-latest",
            strategy="B",
            ticker=ticker,
            signal=synthesis.signal if synthesis.consensus_reached else "HOLD",
            confidence=synthesis.confidence,
            target_price=None,
            stop_loss=None,
            reasoning_summary=synthesis.synthesizer,
            debate_transcript_id=transcript_id,
            trading_date=date.today(),
        )
        await insert_prediction(signal)
        return signal

    async def run(self, tickers: list[str]) -> list[PredictionSignal]:
        tasks = [self.run_for_ticker(t) for t in tickers]
        return await asyncio.gather(*tasks)


async def _main_async(args: argparse.Namespace) -> None:
    tickers = [t.strip() for t in args.tickers.split(",") if t.strip()]
    runner = StrategyBConsensus()
    results = await runner.run(tickers)
    print([r.model_dump() for r in results])


def main() -> None:
    parser = argparse.ArgumentParser(description="Strategy B Consensus Runner")
    parser.add_argument("--tickers", required=True, help="쉼표 구분 티커 목록")
    args = parser.parse_args()
    asyncio.run(_main_async(args))


if __name__ == "__main__":
    main()
