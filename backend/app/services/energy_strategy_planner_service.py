from __future__ import annotations

import logging
from typing import Any

from app.schemas.energy import (
    Dashboard,
    EnergyStrategyPlan,
    Recommendation,
    Room,
    SimulationRequest,
    StrategyAction,
)
from app.services.openai_client import OpenAIClient
from app.services.simulation_service import SimulationService
from app.utils.settings import Settings, get_settings

logger = logging.getLogger(__name__)


class EnergyStrategyPlannerService:
    """Generate a data-backed energy optimization roadmap for the existing chat flow."""

    def __init__(
        self,
        *,
        settings: Settings | None = None,
        simulation_service: SimulationService | None = None,
    ) -> None:
        self._settings = settings or get_settings()
        self._simulation_service = simulation_service or SimulationService(self._settings)

    def build_plan(
        self,
        *,
        message: str,
        rooms: list[Room],
        dashboard: Dashboard,
        recommendations: list[Recommendation],
    ) -> EnergyStrategyPlan:
        goal = self._infer_goal(message)
        simulation = self._build_simulation(rooms, goal)
        top_recommendations = sorted(
            recommendations,
            key=lambda item: self._priority_score(item),
            reverse=True,
        )[:5]

        current_status = self._build_current_status(dashboard, rooms, recommendations)
        target_goal = self._build_target_goal(goal, dashboard)
        strategy = self._build_strategy(goal, dashboard, rooms, top_recommendations, simulation)
        actions = self._build_action_plan(
            goal=goal,
            dashboard=dashboard,
            rooms=rooms,
            recommendations=top_recommendations,
            simulation=simulation,
        )

        savings_value = self._estimate_savings(goal, dashboard, simulation, actions)
        carbon_value = self._estimate_carbon_reduction(goal, dashboard, simulation, actions)
        timeline = self._estimate_timeline(goal, actions)
        roi = self._estimate_roi(goal, savings_value, actions)
        difficulty = self._estimate_difficulty(goal, actions)
        priority = self._estimate_priority(goal, dashboard, actions)
        confidence = self._estimate_confidence(goal, dashboard, recommendations, actions)

        openai_explanation = self._build_openai_strategy_explanation(
            goal=goal,
            current_status=current_status,
            strategy=strategy,
            actions=actions,
        )
        if openai_explanation:
            strategy = openai_explanation

        return EnergyStrategyPlan(
            current_status=current_status,
            target_goal=target_goal,
            optimization_strategy=strategy,
            prioritized_action_plan=actions,
            expected_savings=savings_value,
            expected_carbon_reduction=carbon_value,
            expected_timeline=timeline,
            roi=roi,
            difficulty=difficulty,
            priority=priority,
            confidence=confidence,
        )

    def _infer_goal(self, message: str) -> str:
        q = (message or "").strip().lower()
        if any(word in q for word in ["bill", "cost", "electricity", "tariff", "expense"]):
            return "Reduce Electricity Bill"
        if any(word in q for word in ["sustain", "carbon", "emission", "environment", "green"]):
            return "Reduce Carbon Emissions"
        if any(word in q for word in ["health", "comfort", "wellbeing", "reliability"]):
            return "Increase Building Health"
        if any(word in q for word in ["peak", "demand", "load", "capacity"]):
            return "Reduce Peak Demand"
        if any(word in q for word in ["efficiency", "optimiz", "waste", "energy"]):
            return "Improve Energy Efficiency"
        return "Improve Energy Efficiency"

    def _build_current_status(
        self,
        dashboard: Dashboard,
        rooms: list[Room],
        recommendations: list[Recommendation],
    ) -> str:
        occupancy = dashboard.occupancy_percentage
        health = dashboard.building_health_score
        efficiency = dashboard.energy_efficiency_score
        alerts = dashboard.active_alerts
        idle_rooms = sum(1 for room in rooms if not room.occupied and room.ac_status.value == "ON")
        return (
            f"Current building status is {health}/100 health, {efficiency}/100 efficiency, "
            f"{occupancy:.0f}% occupancy, with {alerts} active alerts and {idle_rooms} idle AC loads. "
            f"{len(recommendations)} optimization actions are currently available."
        )

    def _build_target_goal(self, goal: str, dashboard: Dashboard) -> str:
        if goal == "Reduce Electricity Bill":
            return "Lower energy spend by capturing the fastest, highest-confidence savings opportunities without compromising comfort."
        if goal == "Improve Sustainability":
            return "Improve operational sustainability by lowering waste, shifting demand, and increasing efficient energy use."
        if goal == "Increase Building Health":
            return "Improve building reliability and occupant comfort by reducing equipment stress and anomaly-driven waste."
        if goal == "Reduce Carbon Emissions":
            return "Reduce emissions by cutting avoidable energy use and prioritizing cleaner operation patterns."
        if goal == "Reduce Peak Demand":
            return "Lower peak demand by shaving non-essential load during high-consumption windows."
        return "Raise operating efficiency while preserving comfort and service continuity."

    def _build_strategy(
        self,
        goal: str,
        dashboard: Dashboard,
        rooms: list[Room],
        recommendations: list[Recommendation],
        simulation: Any,
    ) -> str:
        occupancy = dashboard.occupancy_percentage
        health = dashboard.building_health_score
        efficiency = dashboard.energy_efficiency_score
        trend_note = self._summarize_trend(rooms, dashboard)
        if goal == "Reduce Electricity Bill":
            return (
                f"Focus on the highest-savings, shortest-payback actions first. "
                f"The plan targets idle loads, HVAC tuning, and demand-side controls because the current profile shows {occupancy:.0f}% occupancy and {efficiency}/100 efficiency. "
                f"{trend_note}"
            )
        if goal == "Reduce Carbon Emissions":
            return (
                f"Prioritize lower-carbon operating modes and cleaner dispatch patterns. "
                f"The strategy concentrates on lighting, AC scheduling, and any available storage/solar influence to cut emissions while preserving service levels. "
                f"{trend_note}"
            )
        if goal == "Increase Building Health":
            return (
                f"Target the root causes of equipment stress and comfort drift. "
                f"This roadmap emphasizes anomaly remediation, HVAC discipline, and occupancy-aware controls because building health is currently {health}/100. "
                f"{trend_note}"
            )
        if goal == "Reduce Peak Demand":
            return (
                f"Use demand-shifting and load-shedding tactics to reduce the building’s highest-demand intervals. "
                f"The plan emphasizes battery use, EV scheduling, and non-critical load management around peak windows. "
                f"{trend_note}"
            )
        return (
            f"Create a balanced efficiency program that improves comfort, reduces waste, and stabilizes operations. "
            f"The plan uses the strongest recommendations and the current simulation baseline to guide implementation. {trend_note}"
        )

    def _build_action_plan(
        self,
        *,
        goal: str,
        dashboard: Dashboard,
        rooms: list[Room],
        recommendations: list[Recommendation],
        simulation: Any,
    ) -> list[StrategyAction]:
        actions: list[StrategyAction] = []
        idle_rooms = sum(1 for room in rooms if not room.occupied and room.ac_status.value == "ON")
        hot_rooms = sum(1 for room in rooms if room.temperature_c > 32)
        occupancy = dashboard.occupancy_percentage

        if idle_rooms > 0:
            actions.append(
                StrategyAction(
                    priority=1,
                    title="Eliminate Idle AC and Lighting Loads",
                    rationale="Unoccupied rooms with active AC or lights are creating avoidable energy waste and directly reducing efficiency.",
                    why="This is a high-confidence, low-friction action that cuts waste immediately and improves both cost and health scores.",
                    expected_savings="₹1,500–₹4,000/month",
                    expected_carbon_reduction="120–250 kg CO₂/year",
                    timeline="0–2 weeks",
                    difficulty="Low",
                    business_impact="High",
                    confidence=92,
                )
            )

        if hot_rooms > 0 or dashboard.building_health_score < 80:
            actions.append(
                StrategyAction(
                    priority=2,
                    title="Tune HVAC Scheduling and Setpoints",
                    rationale="High-temperature rooms and weak health indicators suggest the HVAC strategy is operating outside the most efficient envelope.",
                    why="Better HVAC discipline improves comfort, reduces mechanical stress, and usually delivers strong savings with minimal disruption.",
                    expected_savings="₹1,000–₹3,500/month",
                    expected_carbon_reduction="100–220 kg CO₂/year",
                    timeline="1–3 weeks",
                    difficulty="Medium",
                    business_impact="High",
                    confidence=88,
                )
            )

        if goal in {"Reduce Peak Demand", "Improve Sustainability", "Reduce Carbon Emissions"}:
            actions.append(
                StrategyAction(
                    priority=3,
                    title="Shift Peak-Driven Loads and Optimize Storage Use",
                    rationale="Peak-focused and sustainability goals benefit from moving discretionary loads away from high-demand windows and using storage intelligently.",
                    why="This reduces demand charges and lowers the carbon intensity of operation during peak intervals.",
                    expected_savings="₹800–₹2,500/month",
                    expected_carbon_reduction="80–180 kg CO₂/year",
                    timeline="2–6 weeks",
                    difficulty="Medium",
                    business_impact="High",
                    confidence=84,
                )
            )

        if occupancy < 85:
            actions.append(
                StrategyAction(
                    priority=4,
                    title="Align Controls to Occupancy Patterns",
                    rationale="Occupancy is below full utilization, so the building can benefit from tighter zone-based scheduling and automation.",
                    why="This reduces unnecessary conditioning and lighting while maintaining service quality during active periods.",
                    expected_savings="₹600–₹1,800/month",
                    expected_carbon_reduction="50–140 kg CO₂/year",
                    timeline="2–4 weeks",
                    difficulty="Medium",
                    business_impact="Medium",
                    confidence=86,
                )
            )

        for recommendation in recommendations[:3]:
            actions.append(
                StrategyAction(
                    priority=5 + len(actions),
                    title=recommendation.title,
                    rationale=recommendation.reason,
                    why=recommendation.business_impact or "This recommendation targets the most material operational opportunity identified from current telemetry.",
                    expected_savings=recommendation.estimated_monthly_saving or "₹500+/month",
                    expected_carbon_reduction=recommendation.estimated_carbon_reduction or "Low to moderate impact",
                    timeline="2–8 weeks",
                    difficulty=self._difficulty_from_priority(recommendation.priority),
                    business_impact=self._impact_label(recommendation.priority),
                    confidence=max(60, min(95, recommendation.confidence)),
                )
            )

        if not actions:
            actions.append(
                StrategyAction(
                    priority=1,
                    title="Review the Highest-Impact Recommendation",
                    rationale="No major anomalies were identified, but the building still has an efficiency opportunity that should be addressed first.",
                    why="A focused first action keeps momentum high and creates a measurable baseline for further optimization.",
                    expected_savings="₹500–₹1,500/month",
                    expected_carbon_reduction="40–100 kg CO₂/year",
                    timeline="1–2 weeks",
                    difficulty="Low",
                    business_impact="Medium",
                    confidence=75,
                )
            )

        return sorted(actions, key=lambda item: (item.priority, -self._action_score(item)), reverse=False)

    def _build_openai_strategy_explanation(
        self,
        *,
        goal: str,
        current_status: str,
        strategy: str,
        actions: list[StrategyAction],
    ) -> str | None:
        client = OpenAIClient.from_env()
        if client is None:
            return None

        top_actions = ", ".join(action.title for action in actions[:3])
        prompt = (
            "You are an experienced energy consultant. Write a concise executive strategy explanation "
            f"for the goal '{goal}'. Use the current status '{current_status}' and the strategy '{strategy}'. "
            f"Mention why these actions matter: {top_actions}. Keep it under 180 words."
        )
        try:
            return client.generate_text(system_prompt="You are a pragmatic energy consultant.", user_message=prompt)
        except Exception as exc:  # noqa: BLE001
            logger.warning("OpenAI strategy explanation failed; using deterministic plan. exc=%s", exc)
            return None

    def _build_simulation(self, rooms: list[Room], goal: str) -> Any:
        try:
            request = self._simulation_request_for_goal(goal)
            return self._simulation_service.simulate(rooms, request)
        except Exception as exc:  # noqa: BLE001
            logger.warning("Simulation-based planning fallback used due to error. exc=%s", exc)
            return None

    def _simulation_request_for_goal(self, goal: str) -> SimulationRequest:
        if goal == "Reduce Electricity Bill":
            return SimulationRequest(
                ac_setpoint_c=26,
                lighting_schedule_percent=80,
                occupancy_percent=90,
                electricity_tariff_per_kwh=8.5,
            )
        if goal == "Reduce Carbon Emissions":
            return SimulationRequest(
                ac_setpoint_c=25,
                lighting_schedule_percent=75,
                occupancy_percent=90,
                solar_capacity_kw=20,
                battery_capacity_kwh=40,
            )
        if goal == "Increase Building Health":
            return SimulationRequest(
                ac_setpoint_c=24,
                lighting_schedule_percent=85,
                occupancy_percent=92,
            )
        if goal == "Reduce Peak Demand":
            return SimulationRequest(
                ac_setpoint_c=25,
                lighting_schedule_percent=80,
                occupancy_percent=90,
                battery_capacity_kwh=50,
                ev_charging_load_kw=8,
            )
        return SimulationRequest(
            ac_setpoint_c=25,
            lighting_schedule_percent=80,
            occupancy_percent=90,
        )

    def _estimate_savings(self, goal: str, dashboard: Dashboard, simulation: Any, actions: list[StrategyAction]) -> str:
        if simulation is not None:
            amount = max(0.0, float(getattr(simulation, "monthly_savings_inr", 0.0)))
            if amount > 0:
                return f"₹{amount:,.0f}/month"
        base = 1200 if goal == "Reduce Electricity Bill" else 900
        return f"₹{base:,.0f}/month"

    def _estimate_carbon_reduction(self, goal: str, dashboard: Dashboard, simulation: Any, actions: list[StrategyAction]) -> str:
        if simulation is not None:
            carbon = max(0.0, float(getattr(simulation, "carbon_reduction_kg_co2", 0.0)))
            if carbon > 0:
                return f"{carbon:,.0f} kg CO₂/year"
        base = 220 if goal == "Reduce Carbon Emissions" else 160
        return f"{base:,.0f} kg CO₂/year"

    def _estimate_timeline(self, goal: str, actions: list[StrategyAction]) -> str:
        if any(action.difficulty == "Low" for action in actions):
            return "0–4 weeks"
        if any(action.business_impact == "High" for action in actions):
            return "2–8 weeks"
        return "4–12 weeks"

    def _estimate_roi(self, goal: str, savings_value: str, actions: list[StrategyAction]) -> str:
        if goal == "Reduce Electricity Bill":
            return "High (typically 10–18 months payback)"
        if goal == "Reduce Peak Demand":
            return "Medium to High"
        return "Moderate"

    def _estimate_difficulty(self, goal: str, actions: list[StrategyAction]) -> str:
        if any(action.difficulty == "Low" for action in actions):
            return "Low to Medium"
        if any(action.difficulty == "Medium" for action in actions):
            return "Medium"
        return "Medium to High"

    def _estimate_priority(self, goal: str, dashboard: Dashboard, actions: list[StrategyAction]) -> str:
        if dashboard.active_alerts > 0 or dashboard.building_health_score < 70:
            return "High"
        if goal == "Reduce Electricity Bill":
            return "High"
        return "Medium"

    def _estimate_confidence(self, goal: str, dashboard: Dashboard, recommendations: list[Recommendation], actions: list[StrategyAction]) -> int:
        base = 72
        if dashboard.active_alerts > 0:
            base += 8
        if any(action.confidence >= 88 for action in actions):
            base += 5
        if recommendations:
            base += 3
        return max(60, min(95, base))

    def _summarize_trend(self, rooms: list[Room], dashboard: Dashboard) -> str:
        if not rooms:
            return "Current telemetry is limited, so the plan prioritizes low-risk actions with clear operational signals."
        avg_temp = sum(room.temperature_c for room in rooms) / len(rooms)
        occupied_rooms = sum(1 for room in rooms if room.occupied)
        if avg_temp > 30 or dashboard.active_alerts > 0:
            return "The thermal and alert profile suggests a sustained efficiency opportunity tied to cooling and equipment behavior."
        if occupied_rooms / max(1, len(rooms)) > 0.8:
            return "Occupancy is high, so the plan focuses on protecting service levels while trimming waste during shoulder periods."
        return "The building is showing a stable but improvable operating profile, which supports phased optimization rather than abrupt changes."

    def _priority_score(self, recommendation: Recommendation) -> int:
        priority_map = {"Critical": 5, "High": 4, "Medium": 3, "Low": 2}
        return priority_map.get(getattr(recommendation.priority, "value", str(recommendation.priority)), 3) * 10 + recommendation.confidence

    def _action_score(self, action: StrategyAction) -> int:
        impact_map = {"High": 3, "Medium": 2, "Low": 1}
        difficulty_map = {"Low": 3, "Medium": 2, "High": 1}
        confidence = action.confidence
        impact = impact_map.get(action.business_impact, 2)
        difficulty = difficulty_map.get(action.difficulty, 2)
        return confidence + impact * 8 + difficulty * 2

    def _difficulty_from_priority(self, priority: Any) -> str:
        value = getattr(priority, "value", str(priority))
        if value in {"Critical", "High"}:
            return "Medium"
        return "Low"

    def _impact_label(self, priority: Any) -> str:
        value = getattr(priority, "value", str(priority))
        if value in {"Critical", "High"}:
            return "High"
        return "Medium"
