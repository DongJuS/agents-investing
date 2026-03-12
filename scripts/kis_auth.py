"""
scripts/kis_auth.py — KIS Developers OAuth2 토큰 발급·갱신·저장

사용법:
    python scripts/kis_auth.py             # 토큰 발급 및 Redis 저장
    python scripts/kis_auth.py --check     # Redis에 저장된 토큰 상태 확인
    python scripts/kis_auth.py --revoke    # 토큰 폐기

KIS 토큰 특성:
    - 만료 시간: 발급 후 86400초 (24시간)
    - Redis TTL: 23시간 (만료 1시간 전 갱신 여유분)
    - 실거래/페이퍼 엔드포인트가 다름 — Settings.kis_base_url 자동 분기
"""

import argparse
import asyncio
import logging
import sys
from pathlib import Path

import httpx
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
load_dotenv(ROOT / ".env")

from src.utils.config import get_settings
from src.utils.logging import setup_logging
from src.utils.redis_client import (
    KEY_KIS_OAUTH_TOKEN,
    TTL_KIS_TOKEN,
    close_redis,
    get_redis,
)

setup_logging()
logger = logging.getLogger(__name__)

settings = get_settings()


async def issue_token() -> dict:
    """KIS Developers OAuth2 토큰을 발급하고 Redis에 저장합니다."""
    if not settings.kis_app_key or not settings.kis_app_secret:
        logger.error("KIS_APP_KEY, KIS_APP_SECRET 환경변수가 설정되지 않았습니다.")
        sys.exit(1)

    url = f"{settings.kis_base_url}/oauth2/tokenP"
    payload = {
        "grant_type": "client_credentials",
        "appkey": settings.kis_app_key,
        "appsecret": settings.kis_app_secret,
    }

    mode = "페이퍼" if settings.kis_is_paper_trading else "실거래"
    logger.info("KIS 토큰 발급 요청 [%s 모드]: %s", mode, url)

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.post(url, json=payload)
        resp.raise_for_status()
        data = resp.json()

    if data.get("rt_cd") != "0":
        logger.error("KIS 토큰 발급 실패: %s", data)
        raise RuntimeError(f"KIS 토큰 발급 오류: {data.get('msg1', '알 수 없는 오류')}")

    token_info = {
        "access_token": data["access_token"],
        "token_type": data.get("token_type", "Bearer"),
        "expires_in": data.get("expires_in", 86400),
        "issued_at": int(asyncio.get_event_loop().time()),
        "is_paper": settings.kis_is_paper_trading,
    }

    # Redis에 저장 (TTL 23시간)
    import json

    redis = await get_redis()
    await redis.set(KEY_KIS_OAUTH_TOKEN, json.dumps(token_info), ex=TTL_KIS_TOKEN)
    logger.info(
        "✅ KIS 토큰 발급 완료 — Redis TTL: %d시간, 만료: %d초 후",
        TTL_KIS_TOKEN // 3600,
        token_info["expires_in"],
    )

    return token_info


async def check_token() -> None:
    """Redis에 저장된 KIS 토큰 상태를 출력합니다."""
    import json

    redis = await get_redis()
    raw = await redis.get(KEY_KIS_OAUTH_TOKEN)

    if not raw:
        logger.warning("Redis에 KIS 토큰이 없습니다. 토큰을 발급하세요.")
        return

    token_info = json.loads(raw)
    ttl = await redis.ttl(KEY_KIS_OAUTH_TOKEN)
    access_token_preview = token_info["access_token"][:20] + "..."

    logger.info("─── KIS 토큰 상태 ──────────────────")
    logger.info("  모드    : %s", "페이퍼" if token_info.get("is_paper") else "실거래")
    logger.info("  토큰 앞부분: %s", access_token_preview)
    logger.info("  남은 TTL: %d분 (%d초)", ttl // 60, ttl)
    if ttl < 3600:
        logger.warning("  ⚠️  토큰이 1시간 내에 만료됩니다. 갱신을 권장합니다.")


async def revoke_token() -> None:
    """발급된 KIS 토큰을 폐기하고 Redis에서 삭제합니다."""
    import json

    redis = await get_redis()
    raw = await redis.get(KEY_KIS_OAUTH_TOKEN)

    if not raw:
        logger.info("Redis에 저장된 토큰이 없습니다.")
        return

    token_info = json.loads(raw)

    url = f"{settings.kis_base_url}/oauth2/revokeP"
    payload = {
        "appkey": settings.kis_app_key,
        "appsecret": settings.kis_app_secret,
        "token": token_info["access_token"],
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
    except Exception as e:
        logger.warning("KIS 토큰 폐기 API 오류 (계속 진행): %s", e)

    await redis.delete(KEY_KIS_OAUTH_TOKEN)
    logger.info("✅ KIS 토큰이 폐기되었습니다.")


async def get_stored_token() -> str | None:
    """
    Redis에서 저장된 KIS Access Token 문자열을 반환합니다.
    에이전트 코드에서 직접 호출하는 헬퍼 함수입니다.

    Returns:
        Access Token 문자열, 없거나 만료되면 None
    """
    import json

    redis = await get_redis()
    raw = await redis.get(KEY_KIS_OAUTH_TOKEN)

    if not raw:
        return None

    token_info = json.loads(raw)
    return token_info.get("access_token")


async def main_async(args: argparse.Namespace) -> None:
    try:
        if args.check:
            await check_token()
        elif args.revoke:
            await revoke_token()
        else:
            await issue_token()
    finally:
        await close_redis()


def main() -> None:
    parser = argparse.ArgumentParser(description="KIS Developers OAuth2 토큰 관리")
    parser.add_argument("--check", action="store_true", help="저장된 토큰 상태 확인")
    parser.add_argument("--revoke", action="store_true", help="토큰 폐기")
    args = parser.parse_args()

    asyncio.run(main_async(args))


if __name__ == "__main__":
    main()
