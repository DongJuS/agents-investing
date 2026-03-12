"""
src/agents/blending.py — Strategy A/B 블렌딩 공통 로직
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class BlendResult:
    combined_signal: str
    combined_confidence: float
    conflict: bool


def blend_strategy_signals(
    strategy_a_signal: str | None,
    strategy_a_confidence: float | None,
    strategy_b_signal: str | None,
    strategy_b_confidence: float | None,
    blend_ratio: float,
) -> BlendResult:
    """
    전략 A/B 신호를 결합합니다.
    - blend_ratio는 B 전략 가중치(0.0~1.0)
    """
    ratio = max(0.0, min(1.0, float(blend_ratio)))

    sig_a = (strategy_a_signal or "HOLD").upper()
    sig_b = (strategy_b_signal or "HOLD").upper()
    if sig_a not in {"BUY", "SELL", "HOLD"}:
        sig_a = "HOLD"
    if sig_b not in {"BUY", "SELL", "HOLD"}:
        sig_b = "HOLD"

    conflict = sig_a != sig_b and not (sig_a == "HOLD" or sig_b == "HOLD")
    if sig_a == sig_b:
        combined = sig_a
    elif conflict:
        combined = "HOLD"
    else:
        combined = sig_b if sig_b != "HOLD" else sig_a

    conf_a = float(strategy_a_confidence or 0.0)
    conf_b = float(strategy_b_confidence or 0.0)
    combined_conf = conf_a * (1 - ratio) + conf_b * ratio

    return BlendResult(
        combined_signal=combined,
        combined_confidence=round(combined_conf, 3),
        conflict=conflict,
    )
