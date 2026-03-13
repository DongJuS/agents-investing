"""
src/services/model_config.py — LLM 모델/페르소나 역할 설정 서비스
"""

from __future__ import annotations

from src.db.queries import (
    list_model_role_configs,
    update_model_role_config,
    upsert_model_role_config,
)
from src.llm.claude_client import ClaudeClient
from src.llm.gemini_client import GeminiClient
from src.llm.gpt_client import GPTClient

SUPPORTED_MODEL_OPTIONS = [
    {
        "model": "claude-3-5-sonnet-latest",
        "provider": "claude",
        "label": "Claude 3.5 Sonnet",
        "description": "복합 추론과 합의 정리에 강한 기본 모델",
    },
    {
        "model": "gpt-4o-mini",
        "provider": "gpt",
        "label": "GPT-4o mini",
        "description": "빠른 응답과 반론 생성에 적합한 기본 모델",
    },
    {
        "model": "gemini-1.5-pro",
        "provider": "gemini",
        "label": "Gemini 1.5 Pro",
        "description": "대안 시나리오와 폭넓은 관점 점검에 적합한 기본 모델",
    },
]

DEFAULT_MODEL_ROLE_CONFIGS = [
    {
        "config_key": "strategy_a_predictor_1",
        "strategy_code": "A",
        "role": "predictor",
        "role_label": "Predictor 1",
        "agent_id": "predictor_1",
        "llm_model": "claude-3-5-sonnet-latest",
        "persona": "가치 투자형",
        "execution_order": 1,
    },
    {
        "config_key": "strategy_a_predictor_2",
        "strategy_code": "A",
        "role": "predictor",
        "role_label": "Predictor 2",
        "agent_id": "predictor_2",
        "llm_model": "claude-3-5-sonnet-latest",
        "persona": "기술적 분석형",
        "execution_order": 2,
    },
    {
        "config_key": "strategy_a_predictor_3",
        "strategy_code": "A",
        "role": "predictor",
        "role_label": "Predictor 3",
        "agent_id": "predictor_3",
        "llm_model": "gpt-4o-mini",
        "persona": "모멘텀형",
        "execution_order": 3,
    },
    {
        "config_key": "strategy_a_predictor_4",
        "strategy_code": "A",
        "role": "predictor",
        "role_label": "Predictor 4",
        "agent_id": "predictor_4",
        "llm_model": "gpt-4o-mini",
        "persona": "역추세형",
        "execution_order": 4,
    },
    {
        "config_key": "strategy_a_predictor_5",
        "strategy_code": "A",
        "role": "predictor",
        "role_label": "Predictor 5",
        "agent_id": "predictor_5",
        "llm_model": "gemini-1.5-pro",
        "persona": "거시경제형",
        "execution_order": 5,
    },
    {
        "config_key": "strategy_b_proposer",
        "strategy_code": "B",
        "role": "proposer",
        "role_label": "Proposer",
        "agent_id": "consensus_proposer",
        "llm_model": "claude-3-5-sonnet-latest",
        "persona": "핵심 매매 가설을 세우는 수석 분석가",
        "execution_order": 1,
    },
    {
        "config_key": "strategy_b_challenger_1",
        "strategy_code": "B",
        "role": "challenger",
        "role_label": "Challenger 1",
        "agent_id": "consensus_challenger_1",
        "llm_model": "gpt-4o-mini",
        "persona": "가설의 약점을 빠르게 파고드는 반론가",
        "execution_order": 2,
    },
    {
        "config_key": "strategy_b_challenger_2",
        "strategy_code": "B",
        "role": "challenger",
        "role_label": "Challenger 2",
        "agent_id": "consensus_challenger_2",
        "llm_model": "gemini-1.5-pro",
        "persona": "거시 변수와 대안을 점검하는 반론가",
        "execution_order": 3,
    },
    {
        "config_key": "strategy_b_synthesizer",
        "strategy_code": "B",
        "role": "synthesizer",
        "role_label": "Synthesizer",
        "agent_id": "consensus_synthesizer",
        "llm_model": "claude-3-5-sonnet-latest",
        "persona": "토론을 종합해 최종 결론을 내리는 조정자",
        "execution_order": 4,
    },
]

SUPPORTED_MODEL_VALUES = {item["model"] for item in SUPPORTED_MODEL_OPTIONS}


async def ensure_model_role_configs() -> list[dict]:
    rows = await list_model_role_configs()
    existing_keys = {row["config_key"] for row in rows}
    missing = [item for item in DEFAULT_MODEL_ROLE_CONFIGS if item["config_key"] not in existing_keys]
    for item in missing:
        await upsert_model_role_config(**item)
    return await list_model_role_configs()


async def get_strategy_a_profiles() -> list[dict]:
    rows = await ensure_model_role_configs()
    return [row for row in rows if row["strategy_code"] == "A"]


async def get_strategy_b_roles() -> list[dict]:
    rows = await ensure_model_role_configs()
    return [row for row in rows if row["strategy_code"] == "B"]


async def update_model_role_configs(items: list[dict]) -> list[dict]:
    allowed_keys = {item["config_key"] for item in DEFAULT_MODEL_ROLE_CONFIGS}
    for item in items:
        if item["config_key"] not in allowed_keys:
            raise ValueError(f"알 수 없는 config_key: {item['config_key']}")
        if item["llm_model"] not in SUPPORTED_MODEL_VALUES:
            raise ValueError(f"지원하지 않는 모델: {item['llm_model']}")
        persona = str(item["persona"]).strip()
        if not persona:
            raise ValueError("persona는 비워둘 수 없습니다.")
        await update_model_role_config(
            config_key=item["config_key"],
            llm_model=item["llm_model"],
            persona=persona,
        )
    return await ensure_model_role_configs()


def provider_name_for_model(model: str) -> str:
    text = model.lower()
    if "claude" in text:
        return "claude"
    if "gpt" in text:
        return "gpt"
    if "gemini" in text:
        return "gemini"
    raise ValueError(f"지원하지 않는 provider 모델명입니다: {model}")


def provider_status() -> list[dict]:
    claude = ClaudeClient(model="claude-3-5-sonnet-latest")
    gpt = GPTClient(model="gpt-4o-mini")
    gemini = GeminiClient(model="gemini-1.5-pro")
    return [
        {
            "provider": "claude",
            "default_model": "claude-3-5-sonnet-latest",
            "configured": claude.is_configured,
        },
        {
            "provider": "gpt",
            "default_model": "gpt-4o-mini",
            "configured": gpt.is_configured,
        },
        {
            "provider": "gemini",
            "default_model": "gemini-1.5-pro",
            "configured": gemini.is_configured,
        },
    ]
