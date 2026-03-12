"""
src/llm/gemini_client.py — Gemini 호출 래퍼
"""

from __future__ import annotations

import json
from typing import Any, Optional

from src.utils.config import get_settings
from src.utils.logging import get_logger
from src.utils.secret_validation import is_placeholder_secret

logger = get_logger(__name__)


class GeminiClient:
    def __init__(self, model: str = "gemini-1.5-pro") -> None:
        self.model = model
        settings = get_settings()
        self.api_key = settings.gemini_api_key
        self._model: Optional[Any] = None

        if is_placeholder_secret(self.api_key):
            return

        try:
            import google.generativeai as genai

            genai.configure(api_key=self.api_key)
            self._model = genai.GenerativeModel(self.model)
        except Exception as e:
            logger.warning("Gemini SDK 초기화 실패: %s", e)
            self._model = None

    @property
    def is_configured(self) -> bool:
        return self._model is not None

    async def ask(self, prompt: str) -> str:
        if not self._model:
            raise RuntimeError("Gemini client is not configured.")

        # Gemini SDK는 동기 호출이므로 스레드 오프로 실행
        import asyncio

        def _run() -> str:
            resp = self._model.generate_content(prompt)
            return getattr(resp, "text", "") or ""

        return (await asyncio.to_thread(_run)).strip()

    async def ask_json(self, prompt: str) -> dict:
        text = await self.ask(prompt + "\n\nJSON 객체 하나만 출력하세요.")
        return json.loads(text)
