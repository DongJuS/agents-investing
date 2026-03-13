from __future__ import annotations

from src.brokers.kis import KISPaperApiClient, KISPaperBroker
from src.brokers.paper import PaperBroker, PaperBrokerExecution
from src.utils.config import Settings, get_settings
from src.utils.logging import get_logger

logger = get_logger(__name__)


def build_paper_broker(settings: Settings | None = None):
    broker_settings = settings or get_settings()
    backend = broker_settings.paper_broker_backend.strip().lower()
    internal = PaperBroker()

    if backend == "internal":
        return internal

    if backend in {"kis", "kis_shadow"}:
        return KISPaperBroker(
            settings=broker_settings,
            execution_mode=backend,
            fallback_broker=internal,
            client=KISPaperApiClient(settings=broker_settings),
        )

    logger.warning("알 수 없는 PAPER_BROKER_BACKEND=%s, internal 브로커로 폴백합니다.", backend)
    return internal

__all__ = [
    "PaperBroker",
    "PaperBrokerExecution",
    "KISPaperApiClient",
    "KISPaperBroker",
    "build_paper_broker",
]
