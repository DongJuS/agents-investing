"""
src/api/routers/portfolio.py — 포트폴리오 조회 및 설정 라우터
"""

from typing import Annotated, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field

from src.api.deps import get_admin_user, get_current_user
from src.utils.db_client import execute, fetch, fetchrow

router = APIRouter()


class PositionItem(BaseModel):
    ticker: str
    name: str
    quantity: int
    avg_price: int
    current_price: int
    unrealized_pnl: int
    weight_pct: float


class PortfolioResponse(BaseModel):
    total_value: int
    total_pnl: int
    total_pnl_pct: float
    is_paper: bool
    positions: list[PositionItem]


class PerformanceResponse(BaseModel):
    period: str
    return_pct: float
    max_drawdown_pct: float
    sharpe_ratio: Optional[float] = None
    win_rate: float
    total_trades: int
    kospi_benchmark_pct: Optional[float] = None


class PortfolioConfigRequest(BaseModel):
    strategy_blend_ratio: float = Field(ge=0.0, le=1.0)
    max_position_pct: int = Field(ge=1, le=100)
    daily_loss_limit_pct: int = Field(ge=1, le=100)


class TradingModeRequest(BaseModel):
    is_paper: bool
    confirmation_code: str


@router.get("/positions", response_model=PortfolioResponse)
async def get_positions(
    _: Annotated[dict, Depends(get_current_user)],
) -> PortfolioResponse:
    """현재 보유 포지션과 포트폴리오 요약을 반환합니다."""
    rows = await fetch(
        """
        SELECT ticker, name, quantity, avg_price, current_price, is_paper
        FROM portfolio_positions
        WHERE quantity > 0
        ORDER BY (quantity * current_price) DESC
        """
    )

    config = await fetchrow("SELECT is_paper_trading FROM portfolio_config LIMIT 1")
    is_paper = config["is_paper_trading"] if config else True

    total_value = sum(r["quantity"] * r["current_price"] for r in rows)
    total_cost = sum(r["quantity"] * r["avg_price"] for r in rows)
    total_pnl = total_value - total_cost
    total_pnl_pct = (total_pnl / total_cost * 100) if total_cost > 0 else 0.0

    positions = [
        PositionItem(
            ticker=r["ticker"],
            name=r["name"],
            quantity=r["quantity"],
            avg_price=r["avg_price"],
            current_price=r["current_price"],
            unrealized_pnl=r["quantity"] * (r["current_price"] - r["avg_price"]),
            weight_pct=round(
                r["quantity"] * r["current_price"] / total_value * 100, 2
            ) if total_value > 0 else 0.0,
        )
        for r in rows
    ]

    return PortfolioResponse(
        total_value=total_value,
        total_pnl=total_pnl,
        total_pnl_pct=round(total_pnl_pct, 2),
        is_paper=is_paper,
        positions=positions,
    )


@router.get("/history")
async def get_trade_history(
    _: Annotated[dict, Depends(get_current_user)],
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    from_date: Optional[str] = Query(default=None, alias="from"),
    to_date: Optional[str] = Query(default=None, alias="to"),
    ticker: Optional[str] = Query(default=None),
) -> dict:
    """거래 이력을 조회합니다."""
    params: list = []
    where_clauses: list[str] = []

    if ticker:
        params.append(ticker)
        where_clauses.append(f"ticker = ${len(params)}")
    if from_date:
        params.append(from_date)
        where_clauses.append(f"executed_at >= ${len(params)}::date")
    if to_date:
        params.append(to_date)
        where_clauses.append(f"executed_at < (${len(params)}::date + interval '1 day')")

    where = ("WHERE " + " AND ".join(where_clauses)) if where_clauses else ""
    offset = (page - 1) * per_page
    params += [per_page, offset]

    rows = await fetch(
        f"""
        SELECT ticker, name, side, quantity, price, amount, signal_source,
               agent_id, is_paper, circuit_breaker,
               to_char(executed_at AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD"T"HH24:MI:SS+09:00') AS executed_at
        FROM trade_history
        {where}
        ORDER BY executed_at DESC
        LIMIT ${len(params) - 1} OFFSET ${len(params)}
        """,
        *params,
    )

    return {
        "data": [dict(r) for r in rows],
        "meta": {"page": page, "per_page": per_page},
    }


@router.get("/performance", response_model=PerformanceResponse)
async def get_performance(
    _: Annotated[dict, Depends(get_current_user)],
    period: str = Query(
        default="monthly", pattern="^(daily|weekly|monthly|all)$"
    ),
) -> PerformanceResponse:
    """성과 지표 (수익률, MDD, Sharpe 등)를 반환합니다."""
    # 거래 이력 기반 집계 (간략 버전 — Phase 5에서 정밀화)
    period_days_map = {"daily": 1, "weekly": 7, "monthly": 30, "all": 99999}
    days = period_days_map[period]

    rows = await fetch(
        """
        SELECT side, price, quantity, amount
        FROM trade_history
        WHERE executed_at >= NOW() - ($1 || ' days')::interval
        ORDER BY executed_at
        """,
        days,
    )

    total_trades = len(rows)
    buy_total = sum(r["amount"] for r in rows if r["side"] == "BUY")
    sell_total = sum(r["amount"] for r in rows if r["side"] == "SELL")
    pnl = sell_total - buy_total

    return_pct = (pnl / buy_total * 100) if buy_total > 0 else 0.0
    win_trades = sum(1 for r in rows if r["side"] == "SELL")
    win_rate = (win_trades / total_trades) if total_trades > 0 else 0.0

    return PerformanceResponse(
        period=period,
        return_pct=round(return_pct, 2),
        max_drawdown_pct=0.0,   # Phase 5에서 정밀 구현
        sharpe_ratio=None,       # Phase 5에서 정밀 구현
        win_rate=round(win_rate, 2),
        total_trades=total_trades,
        kospi_benchmark_pct=None,
    )


@router.post("/config")
async def update_config(
    body: PortfolioConfigRequest,
    _: Annotated[dict, Depends(get_admin_user)],
) -> dict:
    """전략 블렌드 비율 및 리스크 한도를 업데이트합니다."""
    await execute(
        """
        UPDATE portfolio_config
        SET strategy_blend_ratio = $1,
            max_position_pct = $2,
            daily_loss_limit_pct = $3,
            updated_at = NOW()
        """,
        body.strategy_blend_ratio,
        body.max_position_pct,
        body.daily_loss_limit_pct,
    )
    return {"message": "포트폴리오 설정이 업데이트되었습니다.", "config": body.model_dump()}


@router.post("/trading-mode")
async def update_trading_mode(
    body: TradingModeRequest,
    _: Annotated[dict, Depends(get_admin_user)],
) -> dict:
    """페이퍼/실거래 모드를 전환합니다 (관리자 전용)."""
    CONFIRMATION_CODE = "CONFIRM_REAL_TRADING_2026"

    if not body.is_paper and body.confirmation_code != CONFIRMATION_CODE:
        return {
            "error": "실거래 전환을 위해 올바른 확인 코드가 필요합니다.",
            "hint": "관리자 매뉴얼을 확인하세요.",
        }

    await execute(
        "UPDATE portfolio_config SET is_paper_trading = $1, updated_at = NOW()",
        body.is_paper,
    )

    mode = "페이퍼 트레이딩" if body.is_paper else "실거래"
    return {"message": f"트레이딩 모드가 '{mode}'으로 변경되었습니다."}
