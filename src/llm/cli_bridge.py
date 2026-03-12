"""
src/llm/cli_bridge.py — LLM CLI 실행 브릿지
"""

from __future__ import annotations

import asyncio
import shlex
import shutil


def build_cli_command(template: str, model: str) -> list[str]:
    """
    CLI 커맨드 템플릿을 토큰화합니다.
    - {model} 플레이스홀더를 현재 모델명으로 치환합니다.
    """
    rendered = (template or "").strip().replace("{model}", model)
    if not rendered:
        return []
    return shlex.split(rendered)


def is_cli_available(command: list[str]) -> bool:
    if not command:
        return False
    return shutil.which(command[0]) is not None


async def run_cli_prompt(command: list[str], prompt: str, timeout_seconds: int = 90) -> str:
    """
    CLI 명령을 실행하고 stdin으로 prompt를 전달한 뒤 stdout 텍스트를 반환합니다.
    """
    if not command:
        raise RuntimeError("CLI command is empty.")

    process = await asyncio.create_subprocess_exec(
        *command,
        stdin=asyncio.subprocess.PIPE,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )

    try:
        stdout, stderr = await asyncio.wait_for(
            process.communicate(input=prompt.encode("utf-8")),
            timeout=max(1, int(timeout_seconds)),
        )
    except asyncio.TimeoutError as exc:
        process.kill()
        await process.wait()
        raise RuntimeError(f"CLI timeout after {timeout_seconds}s: {' '.join(command)}") from exc

    if process.returncode != 0:
        err = stderr.decode("utf-8", errors="replace").strip()
        raise RuntimeError(
            f"CLI command failed (exit={process.returncode}): {' '.join(command)}; stderr={err}"
        )

    return stdout.decode("utf-8", errors="replace").strip()
