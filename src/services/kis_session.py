"""
src/services/kis_session.py — KIS OAuth 토큰 저장/발급 헬퍼
"""

from __future__ import annotations

import json

import httpx

from src.utils.config import Settings, get_settings
from src.utils.redis_client import KEY_KIS_OAUTH_TOKEN, TTL_KIS_TOKEN, get_redis


async def issue_kis_token(settings: Settings | None = None) -> dict:
    active_settings = settings or get_settings()
    if not active_settings.kis_app_key or not active_settings.kis_app_secret:
        raise RuntimeError("KIS_APP_KEY 또는 KIS_APP_SECRET 이 설정되지 않았습니다.")

    url = f"{active_settings.kis_base_url}/oauth2/tokenP"
    payload = {
        "grant_type": "client_credentials",
        "appkey": active_settings.kis_app_key,
        "appsecret": active_settings.kis_app_secret,
    }

    async with httpx.AsyncClient(timeout=active_settings.kis_request_timeout_seconds) as client:
        response = await client.post(url, json=payload)
        response.raise_for_status()
        data = response.json()

    if data.get("rt_cd") not in {None, "0"}:
        raise RuntimeError(f"KIS 토큰 발급 오류: {data.get('msg1', '알 수 없는 오류')}")

    token_info = {
        "access_token": data["access_token"],
        "token_type": data.get("token_type", "Bearer"),
        "expires_in": data.get("expires_in", 86400),
        "is_paper": active_settings.kis_is_paper_trading,
    }

    redis = await get_redis()
    await redis.set(KEY_KIS_OAUTH_TOKEN, json.dumps(token_info), ex=TTL_KIS_TOKEN)
    return token_info


async def get_stored_kis_token() -> str | None:
    redis = await get_redis()
    raw = await redis.get(KEY_KIS_OAUTH_TOKEN)
    if not raw:
        return None

    token_info = json.loads(raw)
    return token_info.get("access_token")


async def revoke_kis_token(settings: Settings | None = None) -> None:
    active_settings = settings or get_settings()
    redis = await get_redis()
    raw = await redis.get(KEY_KIS_OAUTH_TOKEN)
    if not raw:
        return

    token_info = json.loads(raw)
    url = f"{active_settings.kis_base_url}/oauth2/revokeP"
    payload = {
        "appkey": active_settings.kis_app_key,
        "appsecret": active_settings.kis_app_secret,
        "token": token_info["access_token"],
    }

    async with httpx.AsyncClient(timeout=active_settings.kis_request_timeout_seconds) as client:
        try:
            response = await client.post(url, json=payload)
            response.raise_for_status()
        except httpx.HTTPError:
            pass

    await redis.delete(KEY_KIS_OAUTH_TOKEN)
