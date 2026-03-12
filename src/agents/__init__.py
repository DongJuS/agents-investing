"""src/agents package exports."""

from src.agents.dual_execution import (
    FAST_FLOW_AGENT_ID,
    SLOW_METICULOUS_AGENT_ID,
    DualExecutionCoordinator,
    DualExecutionResult,
    record_dual_execution_heartbeat,
)

__all__ = [
    "FAST_FLOW_AGENT_ID",
    "SLOW_METICULOUS_AGENT_ID",
    "DualExecutionCoordinator",
    "DualExecutionResult",
    "record_dual_execution_heartbeat",
]
