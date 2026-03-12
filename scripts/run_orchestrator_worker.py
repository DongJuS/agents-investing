"""
scripts/run_orchestrator_worker.py — Docker/운영용 Orchestrator 루프 실행기

환경변수:
  ORCH_MODE=single|tournament|consensus|blend (기본: blend)
  ORCH_TICKERS=005930,000660 (기본: 비어있음 = Collector 기본 종목 사용)
  ORCH_INTERVAL_SECONDS=600 (기본: 600)
  ORCH_RUN_ONCE=false (true면 1회 사이클만 실행)
  ORCH_TOURNAMENT_ROLLING_DAYS=5 (선택)
  ORCH_TOURNAMENT_MIN_SAMPLES=3 (선택)
  ORCH_CONSENSUS_ROUNDS=2 (선택)
  ORCH_CONSENSUS_THRESHOLD=0.67 (선택)
"""

from __future__ import annotations

import asyncio
import json
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
load_dotenv(ROOT / ".env")

from src.agents.orchestrator import OrchestratorAgent
from src.utils.logging import get_logger, setup_logging

setup_logging()
logger = get_logger(__name__)


def _env_bool(name: str, default: bool = False) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "y", "on"}


def _parse_tickers(raw: str) -> list[str] | None:
    tickers = [t.strip() for t in raw.split(",") if t.strip()]
    return tickers or None


def _optional_int(name: str) -> int | None:
    raw = os.getenv(name)
    if raw is None or not raw.strip():
        return None
    try:
        return int(raw)
    except ValueError:
        logger.warning("%s 파싱 실패(%s), 무시합니다.", name, raw)
        return None


def _optional_float(name: str) -> float | None:
    raw = os.getenv(name)
    if raw is None or not raw.strip():
        return None
    try:
        return float(raw)
    except ValueError:
        logger.warning("%s 파싱 실패(%s), 무시합니다.", name, raw)
        return None


async def main_async() -> int:
    mode = os.getenv("ORCH_MODE", "blend").strip().lower()
    interval_seconds = int(os.getenv("ORCH_INTERVAL_SECONDS", "600"))
    run_once = _env_bool("ORCH_RUN_ONCE", default=False)
    tickers = _parse_tickers(os.getenv("ORCH_TICKERS", ""))
    tournament_rolling_days = _optional_int("ORCH_TOURNAMENT_ROLLING_DAYS")
    tournament_min_samples = _optional_int("ORCH_TOURNAMENT_MIN_SAMPLES")
    consensus_rounds = _optional_int("ORCH_CONSENSUS_ROUNDS")
    consensus_threshold = _optional_float("ORCH_CONSENSUS_THRESHOLD")

    if mode not in {"single", "tournament", "consensus", "blend"}:
        logger.warning("지원하지 않는 ORCH_MODE=%s, blend로 대체합니다.", mode)
        mode = "blend"

    agent = OrchestratorAgent(
        use_tournament=mode == "tournament",
        use_consensus=mode == "consensus",
        use_blend=mode == "blend",
        tournament_rolling_days=tournament_rolling_days,
        tournament_min_samples=tournament_min_samples,
        consensus_rounds=consensus_rounds,
        consensus_threshold=consensus_threshold,
    )

    logger.info(
        "Orchestrator worker 시작: mode=%s, interval=%ss, run_once=%s, tickers=%s, tournament_rolling_days=%s, tournament_min_samples=%s, consensus_rounds=%s, consensus_threshold=%s",
        mode,
        interval_seconds,
        run_once,
        tickers,
        tournament_rolling_days,
        tournament_min_samples,
        consensus_rounds,
        consensus_threshold,
    )

    if run_once:
        result = await agent.run_cycle(tickers=tickers)
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 0

    await agent.run_loop(interval_seconds=interval_seconds, tickers=tickers)
    return 0


def main() -> None:
    try:
        sys.exit(asyncio.run(main_async()))
    except KeyboardInterrupt:
        logger.info("Orchestrator worker 종료 신호 수신")
        sys.exit(0)


if __name__ == "__main__":
    main()
