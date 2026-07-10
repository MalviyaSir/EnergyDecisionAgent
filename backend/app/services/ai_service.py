from __future__ import annotations

import logging
from typing import Any

from app.schemas.energy import ChatResponse, Dashboard, Recommendation, Room
from app.services.building_context_service import BuildingContextService
from app.services.energy_consultant_prompt_builder import EnergyConsultantPromptBuilder
from app.services.energy_consultant_response_formatter import EnergyConsultantResponseFormatter
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
    - answer() method maintains backward compatibility.
    - answer_with_context() uses building data for grounded analysis.
    """

    def __init__(self, *, settings: Settings | None = None) -> None:
        self._settings = settings

    def answer_with_context(
        self,
        message: str,
        rooms: list[Room],
        dashboard: Dashboard,
        recommendations: list[Recommendation],
    ) -> ChatResponse:
        """Answer with full building context for grounded analysis.

        This is the new primary method that uses building telemetry for
        grounded, data-backed responses. It implements the full Energy Manager
        workflow: Observe → Analyze → Reason → Prioritize → Recommend → Explain.

        Args:
            message: User question.
            rooms: Current room telemetry.
            dashboard: Building dashboard metrics.
            recommendations: Generated recommendations.

        Returns:
            Complete ChatResponse with all 10 required sections.
        """
        # Create grounded context from building data
        context = BuildingContextService.create_consultant_context(
            rooms=rooms,
            dashboard=dashboard,
            recommendations=recommendations,
            user_question=message,
        )

        # Detect user intent for goal-based prioritization
        user_intent = context.get("user_intent", "general_inquiry")

        # Generate fallback response (rule-based)
        fallback = self._generate_fallback_response(
            message=message,
            context=context,
            recommendations=recommendations,
        )

        # Get settings
        settings = self._settings
        if settings is None:
            from app.utils.settings import get_settings

            settings = get_settings()

        # Try OpenAI with failsafe
        client = OpenAIClient.from_env()
        if client is None:
            logger.info("OpenAI client not available; using rule-based fallback")
            return fallback

        # Build prompts with goal-based guidance
        system_prompt = EnergyConsultantPromptBuilder.build_system_prompt(user_intent)
        user_prompt = EnergyConsultantPromptBuilder.build_user_prompt(
            user_question=message, context=context, user_intent=user_intent
        )

        # Define response schema
        schema = self._get_response_schema()

        try:
            logger.debug("Calling OpenAI with user intent: %s", user_intent)
            payload = client.generate_json(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                response_schema=schema,
            )

            # Format and validate response with fallback
            response = EnergyConsultantResponseFormatter.format_response(
                llm_output=payload, recommendations=recommendations, fallback=fallback
            )

            logger.info("OpenAI consultant generated response successfully")
            return response

        except Exception as exc:  # noqa: BLE001
            logger.warning(
                "OpenAI consultant generation failed; using fallback. exc=%s", exc
            )
            return fallback

    def answer(
        self, message: str, recommendations: list[Recommendation]
    ) -> ChatResponse:
        """Legacy method for backward compatibility.

        This method is kept for existing clients. New clients should use
        answer_with_context() which provides grounded building analysis.

        Args:
            message: User question.
            recommendations: Current recommendations.

        Returns:
            ChatResponse (may use fallback without full building context).
        """
        top = (recommendations or [])[:5]

        fallback = self._fallback_response(
            message=message, recommendations=recommendations
        )

        settings = self._settings
        if settings is None:
            from app.utils.settings import get_settings

            settings = get_settings()

        client = OpenAIClient.from_env()
        if client is None:
            return fallback

        # Limited context (backward compatible)
        context: dict[str, Any] = {
            "user_question": message,
            "recommendations": [self._recommendation_for_context(r) for r in top],
        }

        system_prompt = EnergyConsultantPromptBuilder.build_system_prompt("general_inquiry")
        user_prompt = EnergyConsultantPromptBuilder.build_user_prompt(
            user_question=message, context=context, user_intent="general_inquiry"
        )

        schema = self._get_response_schema()

        try:
            payload = client.generate_json(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                response_schema=schema,
            )

            # Ensure backward-compatible fields exist
            payload.setdefault("answer", fallback.answer)
            payload.setdefault("suggested_actions", fallback.suggested_actions)

            return ChatResponse.model_validate(payload)
        except Exception as exc:  # noqa: BLE001
            logger.exception(
                "OpenAI consultant generation failed; using fallback. exc=%s", exc
            )
            return fallback

    def _get_response_schema(self) -> dict[str, Any]:
        """Get JSON schema for consultant response."""
        return {
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

    def _generate_fallback_response(
        self,
        *,
        message: str,
        context: dict[str, Any],
        recommendations: list[Recommendation],
    ) -> ChatResponse:
        """Generate rule-based fallback response using building context.

        This response is based on the consultant context and recommendations,
        not random data. It provides deterministic results when OpenAI fails.
        """
        return self._create_response_from_context(
            message=message, context=context, recommendations=recommendations
        )

    def _create_response_from_context(
        self,
        *,
        message: str,
        context: dict[str, Any],
        recommendations: list[Recommendation],
    ) -> ChatResponse:
        """Create response from building context data."""
        recs = recommendations or []
        top3 = recs[:3]
        top5 = recs[:5]

        # Extract key data from context
        building_status = context.get("building_status", {})
        health_summary = context.get("health_summary", {})
        energy_summary = context.get("energy_summary", {})
        alerts_summary = context.get("alerts_summary", {})
        anomalies = context.get("anomalies", [])
        user_intent = context.get("user_intent", "general_inquiry")

        # Build response sections
        summary = self._build_summary(building_status, top3, user_intent)
        root_cause = self._build_root_cause(top3, anomalies, alerts_summary)
        key_findings = self._build_key_findings(top3, building_status, health_summary)
        top_recommendations = [r.title for r in top3]

        # Extract savings and carbon data
        estimated_savings = ", ".join(
            [r.estimated_monthly_saving for r in top3 if r.estimated_monthly_saving]
        )
        if not estimated_savings:
            estimated_savings = energy_summary.get(
                "estimated_monthly_saving_inr", "Savings depend on implementation priority"
            )

        carbon_reduction = ", ".join(
            [r.estimated_carbon_reduction for r in top3 if r.estimated_carbon_reduction]
        )
        if not carbon_reduction:
            carbon_reduction = "Carbon reduction improves when high-impact recommendations are implemented"

        # Determine priority and confidence
        priority = self._determine_priority(top3, alerts_summary)
        confidence = self._determine_confidence(top3)

        # Build business impact
        business_impact = (
            top3[0].business_impact
            if top3
            else "Lower energy costs, improved efficiency, and better equipment reliability"
        )

        # Next action
        next_best_action = (
            top3[0].recommended_action
            if top3
            else "Review the highest-priority recommendations and implement the fastest ROI action"
        )

        # Backward compatible answer
        answer = self._create_answer_text(message=message, top3=top3)
        suggested_actions = [r.title for r in top3]

        return ChatResponse(
            answer=answer,
            suggested_actions=suggested_actions,
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

    def _build_summary(
        self, building_status: dict[str, Any], top3: list[Recommendation], user_intent: str
    ) -> str:
        """Build executive summary."""
        health_score = building_status.get("health_score", 0)
        efficiency_score = building_status.get("efficiency_score", 0)

        if user_intent == "cost_reduction":
            return f"Building efficiency is at {efficiency_score}%. Top opportunities: {', '.join([r.title for r in top3]) if top3 else 'Implement efficiency recommendations'}. Estimated monthly savings available."
        if user_intent == "health_assessment":
            return f"Building health score is {health_score}/100. {len(top3)} action items identified to improve operational reliability and efficiency."
        if user_intent == "sustainability":
            return "Carbon footprint reduction opportunities identified. Implementing top recommendations will improve environmental impact and energy sustainability."

        return f"Building currently at efficiency {efficiency_score}% with health score {health_score}/100. Top recommendation: {top3[0].title if top3 else 'Review recommendations'}"

    def _build_root_cause(
        self, top3: list[Recommendation], anomalies: list[dict[str, Any]], alerts_summary: dict[str, Any]
    ) -> str:
        """Build root cause analysis."""
        # Prioritize anomalies in root cause
        for anomaly in anomalies:
            if anomaly:
                return f"Primary driver: {anomaly.get('title', 'Anomaly detected')}. Root cause: {anomaly.get('root_cause', 'Abnormal pattern detected')}"

        # Use top recommendation reason
        if top3:
            top_rec = top3[0]
            critical_count = alerts_summary.get("critical_count", 0)
            if critical_count > 0:
                return f"Critical alert: {top_rec.title}. {top_rec.reason}"
            return f"Analysis based on telemetry: {top_rec.reason}"

        return "Root cause analysis based on current building telemetry and operational metrics."

    def _build_key_findings(
        self,
        top3: list[Recommendation],
        building_status: dict[str, Any],
        health_summary: dict[str, Any],
    ) -> list[str]:
        """Build key findings list."""
        findings = []

        # Add building status findings
        health_status = health_summary.get("health_status", "")
        if health_status:
            findings.append(f"Building Health Status: {health_status}")

        efficiency_score = building_status.get("efficiency_score", 0)
        if efficiency_score:
            findings.append(f"Energy Efficiency Score: {efficiency_score}/100")

        # Add recommendation-based findings
        for r in top3:
            if r.evidence:
                findings.append(f"{r.title}: {r.evidence[0]}")
            else:
                findings.append(f"{r.title}: {r.reason}")

        # Add consumption findings
        current_consumption = building_status.get("current_consumption_kw", 0)
        if current_consumption:
            findings.append(f"Current Building Consumption: {current_consumption} kW")

        return findings[:5]

    def _determine_priority(
        self, top3: list[Recommendation], alerts_summary: dict[str, Any]
    ) -> str:
        """Determine priority level."""
        if top3:
            priority_value = getattr(top3[0].priority, "value", None) or str(top3[0].priority)
            if priority_value in ["Critical", "High"]:
                return priority_value

        critical_count = alerts_summary.get("critical_count", 0)
        if critical_count > 0:
            return "Critical"

        return "High"

    def _determine_confidence(self, top3: list[Recommendation]) -> int:
        """Determine confidence percentage."""
        if top3:
            return int(getattr(top3[0], "confidence", 70))
        return 60

    def _create_answer_text(self, *, message: str, top3: list[Recommendation]) -> str:
        """Create natural language answer."""
        q = (message or "").lower()

        if any(word in q for word in ["bill", "cost", "expensive"]):
            return f"Your electricity bill is highest due to: {top3[0].title if top3 else 'energy waste'}. Implementing the top recommendation will provide the fastest bill reduction."

        if any(word in q for word in ["healthy", "health"]):
            return f"Building health depends on addressing: {top3[0].title if top3 else 'identified issues'}. Follow the action plan below to improve operational efficiency."

        if any(word in q for word in ["recommendation", "recommend", "first"]):
            return f"Start with: {top3[0].title if top3 else 'the highest-priority recommendation'}. {top3[0].reason if top3 else 'This addresses the most material efficiency opportunity.'}"

        if any(word in q for word in ["floor", "room", "area"]):
            affected_rooms = ", ".join([room for rec in top3 for room in rec.affected_rooms[:2]]) if top3 and any(rec.affected_rooms for rec in top3) else "identified areas"
            return f"Energy consumption is highest in: {affected_rooms}. Implementing recommendations will optimize these areas."

        return f"Based on current telemetry: {top3[0].reason if top3 else 'Review the recommendations above for optimization opportunities'}."

    def _fallback_response(
        self, *, message: str, recommendations: list[Recommendation]
    ) -> ChatResponse:
        """Legacy fallback for backward compatibility."""
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

    def generate_facility_manager_insights(self, context: dict[str, Any]) -> str | None:
        """Generate facility manager insights using AI if available.
        
        Args:
            context: Building context data with metrics and recommendations
        
        Returns:
            Professional insight string or None if AI unavailable
        """
        client = OpenAIClient.from_env()
        if not client:
            return None
        
        try:
            prompt = self._build_facility_manager_prompt(context)
            response = client.generate_text(
                system_prompt="You are an experienced facility manager with 20 years of building operations expertise. Provide concise, actionable insights.",
                user_message=prompt,
            )
            return response
        except Exception as e:
            logger.debug("Error generating AI insights: %s", e)
            return None

    def _build_facility_manager_prompt(self, context: dict[str, Any]) -> str:
        """Build prompt for facility manager insights."""
        return f"""
Based on the following building telemetry, provide 2-3 key operational insights from a facility manager perspective:

Building Health: {context.get('building_health_score', 'Unknown')}/100
Energy Efficiency: {context.get('energy_efficiency_score', 'Unknown')}/100
Current Consumption: {context.get('current_consumption', 'Unknown')} kW
Occupancy: {context.get('occupancy_percentage', 'Unknown')}%
Active Alerts: {context.get('active_alerts', 0)}
Critical Issues: {context.get('critical_alerts', 0)}
Anomalies: {context.get('anomalies', 0)}

Top Recommendations:
{', '.join(context.get('top_recommendations', [])[:3])}

Provide insights focused on:
1. What's working well that we should maintain
2. What needs immediate attention
3. One priority action for today

Keep it concise and actionable.
"""

