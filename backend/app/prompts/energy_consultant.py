"""Legacy prompt builder (deprecated).

NOTE: This module is deprecated. Use EnergyConsultantPromptBuilder from
app.services.energy_consultant_prompt_builder instead.

The new prompt builder supports:
- Goal-based prioritization (cost reduction, health, sustainability, etc.)
- Building context awareness
- Enhanced reasoning for Energy Manager role
- Intent detection and adaptive guidance

For backward compatibility, these functions are kept but may not be used
in new code paths. Legacy code using these directly will still work.
"""
from __future__ import annotations

from typing import Any


def build_system_prompt() -> str:
    # Prompts are kept separate from business logic.
    return (
        "You are an AI Building Energy Consultant for a building monitoring system. "
        "You must ground every claim in the provided telemetry and recommendations. "
        "Do NOT invent data, do NOT use randomness, and do NOT assume missing values. "
        "If a requested metric is not directly available, explain what is available and answer "
        "with the closest grounded analysis from the provided data."
    )


def build_user_prompt(*, user_question: str, context: dict[str, Any]) -> str:
    # Context should already be sanitized/structured by business logic.
    return (
        "User question:\n"
        f"{user_question}\n\n"
        "Grounded context (JSON):\n"
        f"{context}\n\n"
        "Instructions:\n"
        "- Produce a JSON object matching the required output schema exactly.\n"
        "- Every field must be derived from the grounded context.\n"
        "- For 'priority' choose one of: Critical, High, Medium, Low.\n"
        "- 'confidence' must be an integer 0-100 reflecting how directly the provided data supports the conclusion.\n"
        "- 'next_best_action' must be a single concrete action tied to the top recommendation/anomaly.\n"
    )

