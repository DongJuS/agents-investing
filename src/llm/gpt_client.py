"""
src/llm/gpt_client.py — OpenAI GPT 호출 래퍼
"""

from __future__ import annotations

import json
from typing import Any, Optional

from src.utils.config import get_settings
from src.utils.logging import get_logger
from src.utils.secret_validation import is_placeholder_secret

logger = get_logger(__name__)


class GPTClient:
    def __init__(self, model: str = "gpt-4o-mini") -> None:
        self.model = model
        settings = get_settings()
        self.api_key = settings.openai_api_key
        self._client: Optional[Any] = None

        if is_placeholder_secret(self.api_key):
            return

        try:
            from openai import AsyncOpenAI

            self._client = AsyncOpenAI(api_key=self.api_key)
        except Exception as e:
            logger.warning("OpenAI SDK 초기화 실패: %s", e)
            self._client = None

    @property
    def is_configured(self) -> bool:
        return self._client is not None

    async def ask(self, prompt: str, temperature: float = 0.2) -> str:
        if not self._client:
            raise RuntimeError("GPT client is not configured.")

        resp = await self._client.chat.completions.create(
            model=self.model,
            temperature=temperature,
            messages=[{"role": "user", "content": prompt}],
        )
        return (resp.choices[0].message.content or "").strip()

    async def ask_json(self, prompt: str) -> dict:
        text = await self.ask(prompt + "\n\nJSON 객체 하나만 출력하세요.")
        return json.loads(text)
