"""Building context aggregation service for the AI Consultant.

Summarizes current building state from telemetry without sending raw data to LLM.
Provides high-level building metrics for grounded AI analysis.
"""
from __future__ import annotations

import logging
from typing import Any

from app.schemas.energy import Dashboard, Recommendation, Room

logger = logging.getLogger(__name__)


class BuildingContextService:
    """Aggregates building state into consultant-ready context."""

    @staticmethod
    def create_consultant_context(
        *,
        rooms: list[Room],
        dashboard: Dashboard,
        recommendations: list[Recommendation],
        user_question: str,
    ) -> dict[str, Any]:
        """Create a grounded context summary for the AI consultant.

        This method:
        - Summarizes building state without raw sensor data
        - Prioritizes information based on user intent
        - Groups insights by category (anomalies, efficiency, health, etc.)
        - Never sends redundant or raw telemetry

        Args:
            rooms: Current room telemetry list.
            dashboard: Current building dashboard metrics.
            recommendations: Generated recommendations.
            user_question: User's question for intent detection.

        Returns:
            Structured context ready for consultant analysis.
        """
        context: dict[str, Any] = {
            "building_status": BuildingContextService._summarize_building(dashboard),
            "occupancy_summary": BuildingContextService._summarize_occupancy(rooms),
            "energy_summary": BuildingContextService._summarize_energy(rooms, dashboard),
            "health_summary": BuildingContextService._summarize_health(dashboard),
            "alerts_summary": BuildingContextService._summarize_alerts(recommendations),
            "recommendations": BuildingContextService._format_recommendations(recommendations),
            "user_intent": BuildingContextService._detect_intent(user_question),
            "anomalies": BuildingContextService._extract_anomalies(recommendations),
        }
        return context

    @staticmethod
    def _summarize_building(dashboard: Dashboard) -> dict[str, Any]:
        """Summarize overall building status."""
        return {
            "health_score": dashboard.building_health_score,
            "health_status": dashboard.building_health_status,
            "efficiency_score": dashboard.energy_efficiency_score,
            "efficiency_status": dashboard.energy_efficiency_status,
            "current_consumption_kw": dashboard.current_consumption,
            "predicted_daily_bill_inr": dashboard.predicted_today_bill,
            "predicted_monthly_bill_inr": dashboard.predicted_month_bill,
            "carbon_emission_today_kg": dashboard.carbon_emission,
            "occupancy_percentage": dashboard.occupancy_percentage,
        }

    @staticmethod
    def _summarize_occupancy(rooms: list[Room]) -> dict[str, Any]:
        """Summarize occupancy patterns."""
        occupied = [r for r in rooms if r.occupied]
        return {
            "total_rooms": len(rooms),
            "occupied_rooms": len(occupied),
            "occupancy_percentage": round((len(occupied) / len(rooms) * 100) if rooms else 0, 2),
            "average_occupancy_count": round(
                sum(r.occupancy_count for r in occupied) / len(occupied) if occupied else 0, 1
            ),
            "max_occupancy_count": max((r.occupancy_count for r in rooms), default=0),
        }

    @staticmethod
    def _summarize_energy(rooms: list[Room], dashboard: Dashboard) -> dict[str, Any]:
        """Summarize energy consumption patterns."""
        sorted_rooms = sorted(rooms, key=lambda r: r.current_power_kw, reverse=True)
        high_power_rooms = sorted_rooms[:3]

        return {
            "total_current_power_kw": round(sum(r.current_power_kw for r in rooms), 2),
            "total_daily_energy_kwh": round(sum(r.daily_energy_kwh for r in rooms), 2),
            "total_monthly_energy_kwh": round(sum(r.monthly_energy_kwh for r in rooms), 2),
            "highest_power_rooms": [
                {
                    "room_id": r.room_id,
                    "power_kw": r.current_power_kw,
                    "occupancy": r.occupancy_count,
                    "temperature_c": r.temperature_c,
                }
                for r in high_power_rooms
            ],
            "estimated_daily_saving_inr": dashboard.estimated_today_saving,
            "estimated_monthly_saving_inr": dashboard.estimated_monthly_saving,
        }

    @staticmethod
    def _summarize_health(dashboard: Dashboard) -> dict[str, Any]:
        """Summarize building health metrics."""
        return {
            "health_score": dashboard.building_health_score,
            "health_status": dashboard.building_health_status,
            "critical_alerts": dashboard.critical_alerts,
            "high_priority_actions": dashboard.high_priority_actions,
            "active_alerts": dashboard.active_alerts,
            "active_anomalies": dashboard.active_anomalies,
            "energy_score": dashboard.energy_score,
        }

    @staticmethod
    def _summarize_alerts(recommendations: list[Recommendation]) -> dict[str, Any]:
        """Summarize active alerts and issues."""
        critical = [r for r in recommendations if r.priority.value == "Critical"]
        high = [r for r in recommendations if r.priority.value == "High"]
        anomalies = [r for r in recommendations if "anomaly" in r.category.lower()]

        return {
            "total_recommendations": len(recommendations),
            "critical_count": len(critical),
            "high_priority_count": len(high),
            "anomaly_count": len(anomalies),
            "critical_issues": [r.title for r in critical[:3]],
            "high_priority_issues": [r.title for r in high[:3]],
        }

    @staticmethod
    def _format_recommendations(recommendations: list[Recommendation], limit: int = 5) -> list[dict[str, Any]]:
        """Format top recommendations for consultant context."""
        top = recommendations[:limit]
        return [
            {
                "title": r.title,
                "category": r.category,
                "priority": r.priority.value,
                "reason": r.reason,
                "confidence": r.confidence,
                "daily_saving_inr": r.estimated_daily_saving,
                "monthly_saving_inr": r.estimated_monthly_saving,
                "carbon_reduction_kg": r.estimated_carbon_reduction,
                "business_impact": r.business_impact,
                "recommended_action": r.recommended_action,
                "evidence": r.evidence[:2],  # Top 2 evidence points
            }
            for r in top
        ]

    @staticmethod
    def _extract_anomalies(recommendations: list[Recommendation]) -> list[dict[str, Any]]:
        """Extract anomalies from recommendations."""
        anomalies = [r for r in recommendations if "anomaly" in r.category.lower()]
        return [
            {
                "title": r.title,
                "root_cause": r.anomaly.root_cause if r.anomaly else r.reason,
                "severity": r.priority.value,
                "probability": r.anomaly.probability if r.anomaly else r.confidence,
                "recommended_resolution": r.anomaly.recommended_resolution if r.anomaly else r.recommended_action,
            }
            for r in anomalies[:3]
        ]

    @staticmethod
    def _detect_intent(user_question: str) -> str:
        """Detect user intent from question."""
        q = (user_question or "").lower()

        if any(word in q for word in ["bill", "cost", "expensive", "reduce electricity"]):
            return "cost_reduction"
        if any(word in q for word in ["healthy", "health", "status", "condition"]):
            return "health_assessment"
        if any(word in q for word in ["sustainability", "carbon", "green", "environment", "emissions"]):
            return "sustainability"
        if any(word in q for word in ["anomaly", "anomalies", "unusual", "abnormal", "strange"]):
            return "anomaly_analysis"
        if any(word in q for word in ["implement", "implement first", "priority", "urgent"]):
            return "priority_guidance"
        if any(word in q for word in ["floor", "room", "zone", "area"]):
            return "location_analysis"
        if any(word in q for word in ["recommendation", "recommend", "suggest"]):
            return "recommendation_analysis"

        return "general_inquiry"
