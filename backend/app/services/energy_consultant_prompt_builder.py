"""Enhanced prompt builder for AI Building Energy Consultant.

Builds context-aware prompts based on user intent and goal-based prioritization.
Ensures grounded analysis with no random or invented data.
"""
from __future__ import annotations

from typing import Any


class EnergyConsultantPromptBuilder:
    """Builds consultant prompts with goal-based prioritization."""

    @staticmethod
    def build_system_prompt(user_intent: str = "general_inquiry") -> str:
        """Build system prompt for the consultant role.

        Args:
            user_intent: Detected user intent for behavior shaping.

        Returns:
            System prompt for the AI consultant.
        """
        base_prompt = (
            "You are an experienced commercial building Energy Manager and AI Building Energy Consultant. "
            "You have 15+ years of expertise in energy optimization, HVAC systems, and building operations.\n\n"
            "Your analysis method:\n"
            "1. OBSERVE current building telemetry and state\n"
            "2. ANALYZE patterns and efficiency metrics\n"
            "3. REASON about root causes and interdependencies\n"
            "4. PRIORITIZE actions based on impact and confidence\n"
            "5. RECOMMEND concrete next steps\n"
            "6. EXPLAIN the reasoning behind every conclusion\n\n"
            "CRITICAL RULES:\n"
            "- Ground EVERY claim in the provided telemetry and recommendations.\n"
            "- NEVER invent data, use randomness, or assume missing values.\n"
            "- If a metric is not directly available, explain what IS available and provide the closest grounded analysis.\n"
            "- Always cite evidence from the provided data.\n"
            "- Provide confidence levels reflecting how directly the data supports each conclusion.\n"
            "- Be specific about room IDs, metrics, and time periods.\n"
        )

        # Add intent-specific guidance
        intent_guidance = EnergyConsultantPromptBuilder._get_intent_guidance(user_intent)
        if intent_guidance:
            base_prompt += f"\n{intent_guidance}"

        return base_prompt

    @staticmethod
    def build_user_prompt(
        user_question: str,
        context: dict[str, Any],
        user_intent: str = "general_inquiry",
    ) -> str:
        """Build user prompt with grounded context.

        Args:
            user_question: User's original question.
            context: Building context from BuildingContextService.
            user_intent: Detected user intent for prioritization.

        Returns:
            Complete user prompt with context and instructions.
        """
        prompt = (
            "=== USER QUESTION ===\n"
            f"{user_question}\n\n"
            "=== CURRENT BUILDING CONTEXT (JSON) ===\n"
        )

        # Include context in priority order based on intent
        context_order = EnergyConsultantPromptBuilder._get_context_order(user_intent)
        ordered_context = {}
        for key in context_order:
            if key in context:
                ordered_context[key] = context[key]

        # Add remaining context keys not in priority order
        for key, value in context.items():
            if key not in ordered_context:
                ordered_context[key] = value

        import json

        prompt += json.dumps(ordered_context, indent=2)

        prompt += "\n\n=== ANALYSIS INSTRUCTIONS ===\n"
        prompt += EnergyConsultantPromptBuilder._get_analysis_instructions(user_intent)

        prompt += "\n=== OUTPUT REQUIREMENTS ===\n"
        prompt += (
            "You MUST return a valid JSON object with ALL these fields:\n"
            "- summary: 1-2 sentence executive summary of key finding\n"
            "- root_cause: Grounded analysis of why this situation exists (from evidence)\n"
            "- key_findings: Array of 3-5 specific observations backed by data\n"
            "- top_recommendations: Array of 3-5 ranked action titles\n"
            "- estimated_savings: Total daily + monthly savings in INR (or 'N/A' if not applicable)\n"
            "- carbon_reduction: Total carbon reduction potential in kg CO2/day (or 'N/A' if not applicable)\n"
            "- business_impact: Description of business/operational benefits\n"
            "- priority: One of [Critical, High, Medium, Low] - highest urgency among recommendations\n"
            "- confidence: Integer 0-100 reflecting data support strength\n"
            "- next_best_action: Single concrete action to implement NOW\n"
            "- answer: 2-3 sentence answer directly addressing the user's question\n"
            "- suggested_actions: Array of 2-3 immediate actions the user can take\n"
        )

        return prompt

    @staticmethod
    def _get_intent_guidance(intent: str) -> str:
        """Get intent-specific guidance for prioritization."""
        if intent == "cost_reduction":
            return (
                "PRIORITIZATION FOR COST REDUCTION:\n"
                "1. Highest Daily/Monthly Savings Potential\n"
                "2. Lowest Occupant Comfort Impact\n"
                "3. Highest Confidence (data-backed)\n"
                "4. Immediate ROI (quick payback)\n"
                "Focus on eliminating waste: idle loads, high-power anomalies, and inefficient equipment."
            )
        if intent == "health_assessment":
            return (
                "PRIORITIZATION FOR HEALTH ASSESSMENT:\n"
                "1. Critical Alerts and Failures\n"
                "2. Equipment Health Issues\n"
                "3. Anomalies and Unusual Patterns\n"
                "4. Occupant Safety/Comfort Risks\n"
                "Assess overall building condition and immediate health risks."
            )
        if intent == "sustainability":
            return (
                "PRIORITIZATION FOR SUSTAINABILITY:\n"
                "1. Carbon Reduction Potential\n"
                "2. Energy Efficiency Improvements\n"
                "3. Renewable Utilization Opportunities\n"
                "4. Long-term Environmental Impact\n"
                "Focus on sustainable practices and reducing environmental footprint."
            )
        if intent == "anomaly_analysis":
            return (
                "PRIORITIZATION FOR ANOMALY ANALYSIS:\n"
                "1. Highest Severity Anomalies\n"
                "2. Most Likely Root Causes (high probability)\n"
                "3. Potential Equipment Failures\n"
                "4. Immediate Operational Risks\n"
                "Diagnose unusual patterns and determine corrective actions."
            )
        if intent == "priority_guidance":
            return (
                "PRIORITIZATION FOR IMPLEMENTATION PRIORITY:\n"
                "1. Critical/High Severity Issues\n"
                "2. Immediate ROI and Cost Savings\n"
                "3. Implementation Complexity (simpler first)\n"
                "4. Cascading Benefits (fixes that enable others)\n"
                "Provide a clear implementation roadmap."
            )

        return ""

    @staticmethod
    def _get_context_order(intent: str) -> list[str]:
        """Get context field priority order based on intent."""
        base_order = [
            "building_status",
            "alerts_summary",
            "health_summary",
            "recommendations",
            "energy_summary",
            "anomalies",
            "occupancy_summary",
            "user_intent",
        ]

        if intent == "cost_reduction":
            return [
                "energy_summary",
                "recommendations",
                "building_status",
                "alerts_summary",
                "occupancy_summary",
                "user_intent",
            ]
        if intent == "health_assessment":
            return [
                "health_summary",
                "alerts_summary",
                "anomalies",
                "building_status",
                "recommendations",
                "user_intent",
            ]
        if intent == "sustainability":
            return [
                "energy_summary",
                "building_status",
                "recommendations",
                "health_summary",
                "user_intent",
            ]
        if intent == "anomaly_analysis":
            return [
                "anomalies",
                "alerts_summary",
                "recommendations",
                "building_status",
                "user_intent",
            ]

        return base_order

    @staticmethod
    def _get_analysis_instructions(intent: str) -> str:
        """Get intent-specific analysis instructions."""
        instructions = (
            "1. READ the provided context carefully.\n"
            "2. EXTRACT relevant data points and metrics.\n"
            "3. ANALYZE patterns: What stands out? What's abnormal? What's working well?\n"
            "4. REASON about cause-and-effect relationships.\n"
            "5. GROUND every claim in evidence from the data.\n"
            "6. CITE specific rooms, metrics, and values.\n"
            "7. EXPLAIN the logic behind your conclusions.\n"
            "8. AVOID generalizations; be specific and data-driven.\n"
        )

        if intent == "cost_reduction":
            instructions += (
                "9. FOCUS on financial impact: daily and monthly savings.\n"
                "10. PRIORITIZE actions by ROI and implementation speed.\n"
                "11. CONSIDER occupant comfort: low-impact changes first.\n"
                "12. QUANTIFY benefits: how much will the user save?\n"
            )
        elif intent == "health_assessment":
            instructions += (
                "9. ASSESS overall building health condition.\n"
                "10. IDENTIFY critical issues requiring immediate attention.\n"
                "11. EVALUATE equipment status and reliability.\n"
                "12. RATE building health on scale 0-100.\n"
            )
        elif intent == "sustainability":
            instructions += (
                "9. CALCULATE carbon footprint and reduction potential.\n"
                "10. ASSESS environmental impact of recommendations.\n"
                "11. IDENTIFY renewable opportunities.\n"
                "12. PRIORITIZE sustainability-first solutions.\n"
            )
        elif intent == "anomaly_analysis":
            instructions += (
                "9. IDENTIFY all anomalies in the data.\n"
                "10. DETERMINE root causes for each anomaly.\n"
                "11. ASSESS severity and impact.\n"
                "12. RECOMMEND diagnostic and corrective steps.\n"
            )

        return instructions
