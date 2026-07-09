from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class OpenAIConfig:
    api_key: str
    model: str


class OpenAIClient:
    """Small wrapper around OpenAI calls.

    Keeps OpenAI SDK usage out of business logic.
    """

    def __init__(self, *, config: OpenAIConfig) -> None:
        self._config = config

    @classmethod
    def from_env(cls) -> OpenAIClient | None:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            return None

        model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        return cls(config=OpenAIConfig(api_key=api_key, model=model))

    def generate_json(
        self, *, system_prompt: str, user_prompt: str, response_schema: dict[str, Any]
    ) -> dict[str, Any]:
        """Generate a JSON object.

        response_schema is used to instruct the model to match the output shape.
        """
        # Local import to avoid dependency issues if OpenAI is not installed.
        from openai import OpenAI  # type: ignore

        client = OpenAI(api_key=self._config.api_key)

        # We use the Responses API because it supports JSON schema-like constraints.
        response = client.responses.create(
            model=self._config.model,
            input=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            text={
                "format": {
                    "type": "json_schema",
                    "json_schema": response_schema,
                }
            },
        )

        text = getattr(response, "output_text", None)
        if not text:
            # Fallback: try to extract any text content
            text = str(response)

        import json

        return json.loads(text)
