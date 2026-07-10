"""Response formatter for AI Building Energy Consultant.

Structures and validates consultant responses to match the required format.
Ensures all 10 sections are properly formatted and grounded in data.
"""
from __future__ import annotations

import json
import logging
from typing import Any

from app.schemas.energy import ChatResponse, Recommendation

logger = logging.getLogger(__name__)


class EnergyConsultantResponseFormatter:
    """Formats and validates consultant responses."""

    @staticmethod
    def format_response(
        llm_output: dict[str, Any],
        recommendations: list[Recommendation],
        fallback: ChatResponse | None = None,
    ) -> ChatResponse:
        """Format and validate LLM output as ChatResponse.

        Args:
            llm_output: Raw output from LLM.
            recommendations: Current recommendations for fallback context.
            fallback: Fallback response if LLM output is invalid.

        Returns:
            Validated ChatResponse with all required fields.
        """
        try:
            # Ensure all required fields exist
            response_dict = EnergyConsultantResponseFormatter._ensure_fields(
                llm_output, recommendations, fallback
            )

            # Validate and normalize each field
            response_dict = EnergyConsultantResponseFormatter._normalize_response(response_dict)

            # Create and return ChatResponse
            return ChatResponse.model_validate(response_dict)

        except Exception as exc:
            logger.exception("Response formatting failed: %s", exc)
            if fallback:
                return fallback
            raise

    @staticmethod
    def _ensure_fields(
        llm_output: dict[str, Any],
        recommendations: list[Recommendation],
        fallback: ChatResponse | None = None,
    ) -> dict[str, Any]:
        """Ensure all required fields exist with sensible defaults."""
        result = llm_output.copy() if llm_output else {}

        # Backward-compatible fields
        result.setdefault("answer", result.get("answer", ""))
        result.setdefault("suggested_actions", result.get("suggested_actions", []))

        # New consultant fields
        result.setdefault("summary", "")
        result.setdefault("root_cause", "")
        result.setdefault("key_findings", [])
        result.setdefault("top_recommendations", [])
        result.setdefault("estimated_savings", "")
        result.setdefault("carbon_reduction", "")
        result.setdefault("business_impact", "")
        result.setdefault("priority", "High")
        result.setdefault("confidence", 70)
        result.setdefault("next_best_action", "")

        # If any critical field is empty and we have fallback, use it
        if fallback and (not result["answer"] or not result["summary"]):
            return EnergyConsultantResponseFormatter._merge_with_fallback(result, fallback)

        return result

    @staticmethod
    def _merge_with_fallback(llm_output: dict[str, Any], fallback: ChatResponse) -> dict[str, Any]:
        """Merge LLM output with fallback response."""
        result = llm_output.copy()

        # Use fallback for critical empty fields
        if not result.get("answer"):
            result["answer"] = fallback.answer

        if not result.get("summary"):
            result["summary"] = fallback.summary

        if not result.get("root_cause"):
            result["root_cause"] = fallback.root_cause

        if not result.get("key_findings") or len(result["key_findings"]) == 0:
            result["key_findings"] = fallback.key_findings

        if not result.get("top_recommendations") or len(result["top_recommendations"]) == 0:
            result["top_recommendations"] = fallback.top_recommendations

        if not result.get("estimated_savings"):
            result["estimated_savings"] = fallback.estimated_savings

        if not result.get("carbon_reduction"):
            result["carbon_reduction"] = fallback.carbon_reduction

        if not result.get("business_impact"):
            result["business_impact"] = fallback.business_impact

        if not result.get("next_best_action"):
            result["next_best_action"] = fallback.next_best_action

        if not result.get("suggested_actions") or len(result["suggested_actions"]) == 0:
            result["suggested_actions"] = fallback.suggested_actions

        return result

    @staticmethod
    def _normalize_response(response_dict: dict[str, Any]) -> dict[str, Any]:
        """Normalize and validate response fields."""
        result = response_dict.copy()

        # Normalize string fields
        result["answer"] = EnergyConsultantResponseFormatter._normalize_string(
            result.get("answer", ""), max_length=500
        )
        result["summary"] = EnergyConsultantResponseFormatter._normalize_string(
            result.get("summary", ""), max_length=300
        )
        result["root_cause"] = EnergyConsultantResponseFormatter._normalize_string(
            result.get("root_cause", ""), max_length=300
        )
        result["estimated_savings"] = EnergyConsultantResponseFormatter._normalize_string(
            result.get("estimated_savings", ""), max_length=200
        )
        result["carbon_reduction"] = EnergyConsultantResponseFormatter._normalize_string(
            result.get("carbon_reduction", ""), max_length=200
        )
        result["business_impact"] = EnergyConsultantResponseFormatter._normalize_string(
            result.get("business_impact", ""), max_length=300
        )
        result["next_best_action"] = EnergyConsultantResponseFormatter._normalize_string(
            result.get("next_best_action", ""), max_length=200
        )

        # Normalize list fields
        result["key_findings"] = EnergyConsultantResponseFormatter._normalize_list(
            result.get("key_findings", []), max_items=5, max_item_length=200
        )
        result["top_recommendations"] = EnergyConsultantResponseFormatter._normalize_list(
            result.get("top_recommendations", []), max_items=5, max_item_length=200
        )
        result["suggested_actions"] = EnergyConsultantResponseFormatter._normalize_list(
            result.get("suggested_actions", []), max_items=5, max_item_length=150
        )

        # Normalize priority
        valid_priorities = ["Critical", "High", "Medium", "Low"]
        priority = result.get("priority", "High")
        if isinstance(priority, str) and priority in valid_priorities:
            result["priority"] = priority
        else:
            result["priority"] = "High"

        # Normalize confidence
        try:
            confidence = int(result.get("confidence", 70))
            result["confidence"] = max(0, min(100, confidence))
        except (ValueError, TypeError):
            result["confidence"] = 70

        return result

    @staticmethod
    def _normalize_string(value: Any, max_length: int = 1000) -> str:
        """Normalize a string value."""
        if not value:
            return ""

        if not isinstance(value, str):
            value = str(value)

        # Clean up whitespace
        value = value.strip()

        # Truncate if too long
        if len(value) > max_length:
            value = value[: max_length - 3] + "..."

        return value

    @staticmethod
    def _normalize_list(value: Any, max_items: int = 10, max_item_length: int = 500) -> list[str]:
        """Normalize a list value."""
        if not value:
            return []

        if not isinstance(value, list):
            if isinstance(value, str):
                # Try to parse JSON array
                try:
                    value = json.loads(value)
                except (json.JSONDecodeError, ValueError):
                    return [value]
            else:
                return []

        # Filter and normalize items
        result = []
        for item in value[:max_items]:
            normalized = EnergyConsultantResponseFormatter._normalize_string(item, max_item_length)
            if normalized:
                result.append(normalized)

        return result

    @staticmethod
    def create_comprehensive_response(
        summary: str,
        root_cause: str,
        key_findings: list[str],
        top_recommendations: list[str],
        estimated_savings: str,
        carbon_reduction: str,
        business_impact: str,
        priority: str,
        confidence: int,
        next_best_action: str,
        answer: str = "",
        suggested_actions: list[str] | None = None,
    ) -> ChatResponse:
        """Create a comprehensive ChatResponse directly.

        Args:
            summary: Executive summary (section 1)
            root_cause: Root cause analysis (section 3)
            key_findings: Key findings list (section 4)
            top_recommendations: Top recommendations list (section 5)
            estimated_savings: Estimated savings (section 6)
            carbon_reduction: Carbon reduction (section 7)
            business_impact: Business impact (section 8)
            priority: Priority level (section 8)
            confidence: Confidence percentage (section 8)
            next_best_action: Next action (section 9)
            answer: Direct answer to user question (for backward compatibility)
            suggested_actions: Suggested actions (for backward compatibility)

        Returns:
            Complete ChatResponse matching all 10 required sections.
        """
        if answer is None:
            answer = summary

        if suggested_actions is None:
            suggested_actions = top_recommendations[:3]

        return ChatResponse(
            answer=answer,
            suggested_actions=suggested_actions,
            summary=summary,
            root_cause=root_cause,
            key_findings=key_findings,
            top_recommendations=top_recommendations,
            estimated_savings=estimated_savings,
            carbon_reduction=carbon_reduction,
            business_impact=business_impact,
            priority=priority,
            confidence=confidence,
            next_best_action=next_best_action,
        )
