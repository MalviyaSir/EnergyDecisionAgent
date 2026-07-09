from __future__ import annotations

import logging
from typing import Any

from app.prompts.energy_consultant import build_system_prompt, build_user_prompt
from app.schemas.energy import ChatResponse, Recommendation

from app.services.openai_client import OpenAIClient
from app.utils.settings import Settings


logger = logging.getLogger(__name__)


class AIService:
    """AI Building Energy Consultant.

    Backward compatibility:
    - Existing fields: answer, suggested_actions
    - Enhanced fields: summary, root_cause, key_findings, top_recommendations,
      estimated_savings, carbon_reduction, business_impact, priority,
      confidence, next_best_action

    Notes:
    - When OpenAI is unavailable, responses are deterministically generated
      from current telemetry and rule-based recommendations (no random data).
    """

    def __init__(self, *, settings: Settings | None = None) -> None:
        self._settings = settings

    def answer(
        self, message: str, recommendations: list[Recommendation]
    ) -> ChatResponse:
        # This endpoint currently passes only recommendations.
        # We will still ground the response using recommendation content.
        # Telemetry grounding is already embedded in recommendations.evidence.
        top = (recommendations or [])[:5]
        suggested_actions = [r.title for r in (recommendations or [])[:3]]

        fallback = self._fallback_response(
            message=message, recommendations=recommendations
        )

        settings = self._settings
        if settings is None:
            # Avoid importing get_settings here to keep constructor flexible.
            # ai_service is instantiated in app.main without args.
            from app.utils.settings import get_settings

            settings = get_settings()

        client = OpenAIClient.from_env()
        if client is None:
            return fallback

        # Grounded context for the LLM.
        context: dict[str, Any] = {
            "user_question": message,
            "recommendations": [self._recommendation_for_context(r) for r in top],
        }

        system_prompt = build_system_prompt()
        user_prompt = build_user_prompt(user_question=message, context=context)

        schema = {
            "type": "object",
            "properties": {
                "summary": {"type": "string"},
                "root_cause": {"type": "string"},
                "key_findings": {"type": "array", "items": {"type": "string"}},
                "top_recommendations": {"type": "array", "items": {"type": "string"}},
                "estimated_savings": {"type": "string"},
                "carbon_reduction": {"type": "string"},
                "business_impact": {"type": "string"},
                "priority": {
                    "type": "string",
                    "enum": ["Critical", "High", "Medium", "Low"],
                },
                "confidence": {"type": "integer", "minimum": 0, "maximum": 100},
                "next_best_action": {"type": "string"},
                # Backward compatible fields
                "answer": {"type": "string"},
                "suggested_actions": {"type": "array", "items": {"type": "string"}},
            },
            "required": [
                "answer",
                "suggested_actions",
                "summary",
                "root_cause",
                "key_findings",
                "top_recommendations",
                "estimated_savings",
                "carbon_reduction",
                "business_impact",
                "priority",
                "confidence",
                "next_best_action",
            ],
            "additionalProperties": False,
        }

        try:
            payload = client.generate_json(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                response_schema=schema,
            )

            # Ensure backward-compatible fields exist even if model omits them.
            payload.setdefault("answer", fallback.answer)
            payload.setdefault("suggested_actions", fallback.suggested_actions)

            return ChatResponse.model_validate(payload)
        except Exception as exc:  # noqa: BLE001
            logger.exception(
                "OpenAI consultant generation failed; using fallback. exc=%s", exc
            )
            return fallback

    def _fallback_response(
        self, *, message: str, recommendations: list[Recommendation]
    ) -> ChatResponse:

        recs = recommendations or []
        top3 = recs[:3]

        # Deterministically compute from available recommendation fields.
        top_recommendations = [r.title for r in top3]
        key_findings: list[str] = []
        for r in top3:
            # Use evidence first; it is grounded telemetry.
            if r.evidence:
                key_findings.append(f"{r.title}: {r.evidence[0]}")
            else:
                key_findings.append(f"{r.title}: {r.reason}")

        # Root cause: focus on top anomaly/load-management signals.
        root_cause = "Based on current telemetry, the most material drivers are the highest-priority recommendations derived from live room states and anomaly rules."
        for r in top3:
            if r.category.lower() in {"anomaly", "hvac", "lighting", "load management"}:
                root_cause = f"Top driver: {r.title}. {r.reason}"
                break

        # Priority: pick the highest urgency among top3.
        priority = "High"
        if top3:
            priority = getattr(top3[0].priority, "value", None) or str(top3[0].priority)

        # Confidence: use top recommendation confidence when available.
        confidence = int(getattr(top3[0], "confidence", 70)) if top3 else 55

        estimated_savings = ", ".join(
            [
                getattr(r, "estimated_monthly_saving", "")
                for r in top3
                if r.estimated_monthly_saving
            ]
        )
        estimated_savings = (
            estimated_savings
            or "Estimated monthly savings depend on which actions are implemented first."
        )

        carbon_reduction = ", ".join(
            [
                getattr(r, "estimated_carbon_reduction", "")
                for r in top3
                if r.estimated_carbon_reduction
            ]
        )
        carbon_reduction = (
            carbon_reduction
            or "Carbon reduction is expected to improve when high-energy anomalies and idle loads are addressed."
        )

        business_impact = (
            top3[0].business_impact
            if top3
            else "Lower electricity waste, improved efficiency, and more reliable equipment operation."
        )

        next_best_action = (
            top3[0].recommended_action
            if top3
            else "Implement the highest-impact recommendation first and re-check telemetry after 24 hours."
        )

        # Backward compatible answer.
        answer = self._fallback_answer_text(message=message, top3=top3)

        summary = "Use the top-ranked recommendation(s) to reduce avoidable electricity consumption and bring building energy health back toward optimal."

        return ChatResponse(
            answer=answer,
            suggested_actions=[r.title for r in top3],
            summary=summary,
            root_cause=root_cause,
            key_findings=key_findings[:5],
            top_recommendations=top_recommendations,
            estimated_savings=estimated_savings,
            carbon_reduction=carbon_reduction,
            business_impact=business_impact,
            priority=priority,
            confidence=confidence,
            next_best_action=next_best_action,
        )

    def _fallback_answer_text(self, *, message: str, top3: list[Recommendation]) -> str:
        q = (message or "").lower()
        if "healthy" in q or "health" in q:
            return "Building health depends on how effectively idle loads and anomaly conditions are corrected. Follow the highest-priority action below to improve energy efficiency and reduce waste."
        if "bill" in q or "electricity" in q or "cost" in q:
            return "Today’s electricity bill is most affected by the highest-impact waste signals in the current telemetry. Implement the top-ranked recommendation first for the fastest bill reduction."
        if "floor" in q:
            # Rooms are not passed to AIService here; recommendations already reference impacted rooms.
            return "Energy by floor can be inferred from the affected rooms listed in the top recommendations. Implement the top recommendation to reduce the highest-consuming floor/rooms."
        return "Start with the top-ranked recommendation(s). These are derived from live room telemetry and explainable anomaly/loading rules, so you can see exactly what is driving the energy waste."

    def _recommendation_for_context(self, r: Recommendation) -> dict[str, Any]:
        return {
            "title": r.title,
            "category": r.category,
            "priority": getattr(r.priority, "value", str(r.priority)),
            "confidence": r.confidence,
            "estimated_daily_saving": r.estimated_daily_saving,
            "estimated_monthly_saving": r.estimated_monthly_saving,
            "estimated_carbon_reduction": r.estimated_carbon_reduction,
            "business_impact": r.business_impact,
            "recommended_action": r.recommended_action,
            "evidence": r.evidence,
            "anomaly": None
            if r.anomaly is None
            else {
                "root_cause": r.anomaly.root_cause,
                "severity": getattr(
                    r.anomaly.severity, "value", str(r.anomaly.severity)
                ),
                "probability": r.anomaly.probability,
                "recommended_resolution": r.anomaly.recommended_resolution,
            },
        }
