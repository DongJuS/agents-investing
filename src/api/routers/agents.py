"""
src/api/routers/agents.py — 에이전트 상태 및 관리 라우터
"""

from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel

from src.api.deps import get_admin_user, get_current_user
from src.utils.db_client import fetch, fetchrow
from src.utils.redis_client import check_heartbeat

router = APIRouter()

AGENT_IDS = [
    "collector_agent",
    "predictor_1",
    "predictor_2",
    "predictor_3",
    "predictor_4",
    "predictor_5",
    "portfolio_manager_agent",
    "notifier_agent",
    "orchestrator_agent",
]


class AgentMetrics(BaseModel):
    api_latency_ms: Optional[int] = None
    error_count_last_hour: int = 0


class AgentStatusItem(BaseModel):
    agent_id: str
    status: str
    is_alive: bool
    last_action: Optional[str] = None
    metrics: Optional[AgentMetrics] = None
    updated_at: Optional[str] = None


class AgentsStatusResponse(BaseModel):
    agents: list[AgentStatusItem]


@router.get("/status", response_model=AgentsStatusResponse)
async def get_agents_status(
    _: Annotated[dict, Depends(get_current_user)],
) -> AgentsStatusResponse:
    """모든 에이전트의 최신 헬스 상태를 반환합니다."""
    # DB에서 각 에이전트의 최신 헬스비트 조회
    rows = await fetch(
        """
        SELECT DISTINCT ON (agent_id)
            agent_id, status, last_action, metrics,
            to_char(recorded_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS updated_at
        FROM agent_heartbeats
        ORDER BY agent_id, recorded_at DESC
        """
    )

    db_status: dict[str, dict] = {r["agent_id"]: dict(r) for r in rows}

    items: list[AgentStatusItem] = []
    for agent_id in AGENT_IDS:
        is_alive = await check_heartbeat(agent_id)
        db_row = db_status.get(agent_id)

        items.append(
            AgentStatusItem(
                agent_id=agent_id,
                status=db_row["status"] if db_row else ("healthy" if is_alive else "dead"),
                is_alive=is_alive,
                last_action=db_row["last_action"] if db_row else None,
                metrics=AgentMetrics(**(db_row["metrics"] or {})) if db_row and db_row["metrics"] else None,
                updated_at=db_row["updated_at"] if db_row else None,
            )
        )

    return AgentsStatusResponse(agents=items)


@router.get("/{agent_id}/logs")
async def get_agent_logs(
    agent_id: str,
    _: Annotated[dict, Depends(get_current_user)],
    limit: int = Query(default=50, ge=1, le=200),
    level: Optional[str] = Query(default=None, pattern="^(INFO|WARNING|ERROR)$"),
) -> dict:
    """특정 에이전트의 최근 헬스비트 로그를 반환합니다."""
    if agent_id not in AGENT_IDS:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"에이전트 '{agent_id}'를 찾을 수 없습니다.",
        )

    query = """
        SELECT
            agent_id, status, last_action, metrics,
            to_char(recorded_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS recorded_at
        FROM agent_heartbeats
        WHERE agent_id = $1
        ORDER BY recorded_at DESC
        LIMIT $2
    """
    rows = await fetch(query, agent_id, limit)
    return {"agent_id": agent_id, "logs": [dict(r) for r in rows]}


@router.post("/{agent_id}/restart")
async def restart_agent(
    agent_id: str,
    _: Annotated[dict, Depends(get_admin_user)],
) -> dict:
    """에이전트 재시작 신호를 발행합니다 (관리자 전용)."""
    if agent_id not in AGENT_IDS:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"에이전트 '{agent_id}'를 찾을 수 없습니다.",
        )

    import json
    from src.utils.redis_client import publish_message, TOPIC_ALERTS

    await publish_message(
        TOPIC_ALERTS,
        json.dumps(
            {
                "type": "restart_request",
                "agent_id": agent_id,
                "requested_by": "admin",
            }
        ),
    )

    return {"message": f"'{agent_id}' 재시작 신호가 발행되었습니다."}
