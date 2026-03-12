"""
src/api/routers/market.py — 시장 데이터 조회 라우터
"""

from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel

from src.api.deps import get_current_user
from src.utils.db_client import fetch, fetchrow
from src.utils.redis_client import KEY_LATEST_TICKS, get_redis

router = APIRouter()


class OHLCVItem(BaseModel):
    timestamp_kst: str
    open: int
    high: int
    low: int
    close: int
    volume: int
    change_pct: Optional[float] = None


class OHLCVResponse(BaseModel):
    ticker: str
    name: str
    data: list[OHLCVItem]


class QuoteResponse(BaseModel):
    ticker: str
    name: str
    current_price: int
    change: Optional[int] = None
    change_pct: Optional[float] = None
    volume: Optional[int] = None
    updated_at: Optional[str] = None


class IndexResponse(BaseModel):
    kospi: dict
    kosdaq: dict


@router.get("/tickers")
async def list_tickers(
    _: Annotated[dict, Depends(get_current_user)],
    market: Optional[str] = Query(default=None, pattern="^(KOSPI|KOSDAQ)$"),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
) -> dict:
    """추적 중인 종목 목록을 반환합니다."""
    offset = (page - 1) * per_page

    base_query = "FROM market_data"
    params: list = [per_page, offset]
    where = ""

    if market:
        where = " WHERE market = $3"
        params.append(market)

    rows = await fetch(
        f"""
        SELECT DISTINCT ON (ticker) ticker, name, market
        {base_query}{where}
        ORDER BY ticker
        LIMIT $1 OFFSET $2
        """,
        *params,
    )

    return {
        "data": [dict(r) for r in rows],
        "meta": {"page": page, "per_page": per_page, "total": len(rows)},
    }


@router.get("/ohlcv/{ticker}", response_model=OHLCVResponse)
async def get_ohlcv(
    ticker: str,
    _: Annotated[dict, Depends(get_current_user)],
    from_date: Optional[str] = Query(default=None, alias="from"),
    to_date: Optional[str] = Query(default=None, alias="to"),
    interval: str = Query(default="daily", pattern="^(daily|tick)$"),
) -> OHLCVResponse:
    """특정 종목의 OHLCV 이력을 반환합니다."""
    params: list = [ticker, interval]
    where_extra = ""

    if from_date:
        params.append(from_date)
        where_extra += f" AND timestamp_kst >= ${len(params)}::date"
    if to_date:
        params.append(to_date)
        where_extra += f" AND timestamp_kst < (${len(params)}::date + interval '1 day')"

    rows = await fetch(
        f"""
        SELECT
            to_char(timestamp_kst AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD"T"HH24:MI:SS+09:00') AS timestamp_kst,
            open, high, low, close, volume,
            COALESCE(change_pct, 0)::float AS change_pct
        FROM market_data
        WHERE ticker = $1 AND interval = $2 {where_extra}
        ORDER BY timestamp_kst DESC
        LIMIT 200
        """,
        *params,
    )

    # 종목 이름 조회
    meta = await fetchrow(
        "SELECT name FROM market_data WHERE ticker = $1 LIMIT 1", ticker
    )
    if not meta:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"종목 '{ticker}'를 찾을 수 없습니다.",
        )

    return OHLCVResponse(
        ticker=ticker,
        name=meta["name"],
        data=[OHLCVItem(**dict(r)) for r in rows],
    )


@router.get("/quote/{ticker}", response_model=QuoteResponse)
async def get_quote(
    ticker: str,
    _: Annotated[dict, Depends(get_current_user)],
) -> QuoteResponse:
    """종목 최신 실시간 시세를 반환합니다. Redis 캐시를 우선 확인합니다."""
    import json

    # Redis에서 최신 틱 캐시 확인
    redis = await get_redis()
    cached = await redis.get(KEY_LATEST_TICKS.format(ticker=ticker))
    if cached:
        data = json.loads(cached)
        return QuoteResponse(**data)

    # DB에서 최신 종가 조회 (fallback)
    row = await fetchrow(
        """
        SELECT
            ticker, name, close AS current_price, change_pct,
            volume,
            to_char(timestamp_kst AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD"T"HH24:MI:SS+09:00') AS updated_at
        FROM market_data
        WHERE ticker = $1
        ORDER BY timestamp_kst DESC
        LIMIT 1
        """,
        ticker,
    )

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"종목 '{ticker}'의 시세 데이터가 없습니다.",
        )

    return QuoteResponse(
        ticker=row["ticker"],
        name=row["name"],
        current_price=row["current_price"],
        change_pct=float(row["change_pct"]) if row["change_pct"] else None,
        volume=row["volume"],
        updated_at=row["updated_at"],
    )


@router.get("/index", response_model=IndexResponse)
async def get_index(
    _: Annotated[dict, Depends(get_current_user)],
) -> IndexResponse:
    """KOSPI/KOSDAQ 지수 현황을 반환합니다."""
    import json

    redis = await get_redis()
    cached = await redis.get("redis:cache:market_index")
    if cached:
        return IndexResponse(**json.loads(cached))

    # 최신 데이터가 없으면 기본값 반환
    return IndexResponse(
        kospi={"value": 0.0, "change_pct": 0.0, "note": "데이터 수집 전"},
        kosdaq={"value": 0.0, "change_pct": 0.0, "note": "데이터 수집 전"},
    )
