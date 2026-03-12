"""
src/utils/performance.py — 거래 이력 성과 계산 유틸
"""

from __future__ import annotations


def compute_trade_performance(rows: list[dict]) -> dict:
    """체결 이력에서 실현손익 기반 성과 지표를 계산합니다."""
    positions: dict[str, dict] = {}
    realized_pnl = 0.0
    invested_capital = 0.0
    sell_returns: list[float] = []
    equity_curve: list[float] = [0.0]
    win_sells = 0
    sell_count = 0

    for row in rows:
        ticker = str(row["ticker"])
        side = str(row["side"]).upper()
        qty = int(row["quantity"])
        price = float(row["price"])
        pos = positions.setdefault(ticker, {"qty": 0, "avg_cost": 0.0})

        if side == "BUY":
            prev_qty = int(pos["qty"])
            new_qty = prev_qty + qty
            if new_qty <= 0:
                pos["qty"] = 0
                pos["avg_cost"] = 0.0
                continue
            pos["avg_cost"] = ((prev_qty * float(pos["avg_cost"])) + (qty * price)) / new_qty
            pos["qty"] = new_qty
            invested_capital += qty * price
            continue

        if side != "SELL":
            continue

        held_qty = int(pos["qty"])
        if held_qty <= 0:
            # 매칭할 포지션이 없으면 성과 계산에서 제외
            continue

        matched_qty = min(held_qty, qty)
        cost_basis = matched_qty * float(pos["avg_cost"])
        proceeds = matched_qty * price
        trade_pnl = proceeds - cost_basis
        realized_pnl += trade_pnl
        equity_curve.append(realized_pnl)
        sell_count += 1
        if trade_pnl > 0:
            win_sells += 1
        if cost_basis > 0:
            sell_returns.append(trade_pnl / cost_basis)

        remaining_qty = held_qty - matched_qty
        pos["qty"] = remaining_qty
        if remaining_qty == 0:
            pos["avg_cost"] = 0.0

    return_pct = (realized_pnl / invested_capital * 100) if invested_capital > 0 else 0.0
    win_rate = (win_sells / sell_count) if sell_count > 0 else 0.0

    peak = 0.0
    max_drawdown_pct = 0.0
    for value in equity_curve:
        if value > peak:
            peak = value
        base = peak if peak > 0 else 1.0
        drawdown_pct = ((value - peak) / base) * 100
        if drawdown_pct < max_drawdown_pct:
            max_drawdown_pct = drawdown_pct

    sharpe_ratio = None
    if len(sell_returns) >= 2:
        mean_ret = sum(sell_returns) / len(sell_returns)
        variance = sum((r - mean_ret) ** 2 for r in sell_returns) / (len(sell_returns) - 1)
        std_dev = variance ** 0.5
        if std_dev > 0:
            sharpe_ratio = (mean_ret / std_dev) * (len(sell_returns) ** 0.5)

    return {
        "return_pct": round(return_pct, 2),
        "max_drawdown_pct": round(max_drawdown_pct, 2),
        "sharpe_ratio": round(sharpe_ratio, 3) if sharpe_ratio is not None else None,
        "win_rate": round(win_rate, 2),
        "total_trades": len(rows),
        "realized_pnl": int(round(realized_pnl)),
        "invested_capital": int(round(invested_capital)),
        "sell_count": sell_count,
    }
