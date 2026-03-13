"""
src/api/routers/models.py — 모델/페르소나 관리 라우터
"""

from __future__ import annotations

from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from src.api.deps import get_admin_user
from src.services.model_config import (
    SUPPORTED_MODEL_OPTIONS,
    ensure_model_role_configs,
    provider_status,
    update_model_role_configs,
)

router = APIRouter()


class SupportedModelItem(BaseModel):
    model: str
    provider: str
    label: str
    description: str


class ProviderStatusItem(BaseModel):
    provider: str
    default_model: str
    configured: bool


class ModelRoleItem(BaseModel):
    config_key: str
    strategy_code: str
    role: str
    role_label: str
    agent_id: str
    llm_model: str
    persona: str
    execution_order: int
    updated_at: Optional[str] = None


class ModelConfigResponse(BaseModel):
    rule_based_fallback_allowed: bool
    supported_models: list[SupportedModelItem]
    provider_status: list[ProviderStatusItem]
    strategy_a: list[ModelRoleItem]
    strategy_b: list[ModelRoleItem]


class ModelRoleUpdateItem(BaseModel):
    config_key: str
    llm_model: str
    persona: str = Field(..., min_length=1, max_length=300)


class ModelConfigUpdateRequest(BaseModel):
    items: list[ModelRoleUpdateItem]


async def _build_response() -> ModelConfigResponse:
    rows = await ensure_model_role_configs()
    return ModelConfigResponse(
        rule_based_fallback_allowed=False,
        supported_models=[SupportedModelItem(**item) for item in SUPPORTED_MODEL_OPTIONS],
        provider_status=[ProviderStatusItem(**item) for item in provider_status()],
        strategy_a=[ModelRoleItem(**row) for row in rows if row["strategy_code"] == "A"],
        strategy_b=[ModelRoleItem(**row) for row in rows if row["strategy_code"] == "B"],
    )


@router.get("/config", response_model=ModelConfigResponse)
async def get_model_config(
    _: Annotated[dict, Depends(get_admin_user)],
) -> ModelConfigResponse:
    return await _build_response()


@router.put("/config", response_model=ModelConfigResponse)
async def update_model_config(
    body: ModelConfigUpdateRequest,
    _: Annotated[dict, Depends(get_admin_user)],
) -> ModelConfigResponse:
    try:
        await update_model_role_configs([item.model_dump() for item in body.items])
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc
    return await _build_response()
