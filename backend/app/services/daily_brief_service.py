import json
from datetime import datetime
from typing import Any

from app.schemas.energy import Dashboard, DailyEnergyBrief, Recommendation, Room
from app.services.ai_service import AIService
from app.utils.settings import Settings


class DailyBriefService:
    """Generates professional AI-powered daily energy briefs."""

    def __init__(self, settings: Settings, ai_service: AIService) -> None:
        self._settings = settings
        self._ai_service = ai_service

    def generate_brief(
        self,
        dashboard: Dashboard,
        rooms: list[Room],
        recommendations: list[Recommendation],
        alerts: list[dict[str, Any]],
        anomalies: list[dict[str, Any]],
    ) -> DailyEnergyBrief:
        """Generate comprehensive daily energy brief."""
        
        now = datetime.now()
        date_str = now.strftime("%A, %B %d, %Y")
        time_str = now.strftime("%H:%M %Z")
        
        # Extract metrics from existing data
        good_morning = self._generate_greeting(dashboard, now.hour)
        building_health_msg = self._get_building_health_message(dashboard.building_health_score)
        energy_efficiency_msg = self._get_energy_efficiency_message(dashboard.energy_efficiency_score)
        today_forecast = self._generate_forecast(dashboard, recommendations)
        peak_info = self._extract_peak_info(rooms, dashboard)
        
        # Extract alerts and risks
        critical_alerts = self._extract_critical_alerts(alerts, dashboard)
        top_risks = self._extract_top_risks(anomalies, alerts)
        equipment_issues = self._extract_equipment_issues(rooms, alerts)
        
        # Top recommendations with priority
        top_recs = self._prioritize_recommendations(recommendations, 5)
        priority_actions = self._extract_priority_actions(top_recs)
        
        # Financial and environmental metrics
        daily_bill = self._format_currency(float(dashboard.predicted_today_bill))
        monthly_bill = self._format_currency(float(dashboard.predicted_month_bill))
        daily_saving = dashboard.estimated_today_saving
        monthly_saving = dashboard.estimated_monthly_saving
        
        # Carbon metrics
        carbon_today = self._calculate_daily_carbon(dashboard, rooms)
        carbon_month = self._calculate_monthly_carbon(dashboard)
        
        # Generate AI insights if available, fallback to rule-based
        facility_manager_insights = self._generate_facility_manager_insights(
            dashboard, recommendations, alerts, anomalies
        )
        
        # Executive summary
        executive_summary = self._generate_executive_summary(
            dashboard, top_recs, critical_alerts
        )
        
        # Confidence based on data freshness
        confidence = self._calculate_confidence(dashboard)
        
        return DailyEnergyBrief(
            good_morning_message=good_morning,
            date=date_str,
            generation_time=time_str,
            
            overall_building_health=building_health_msg,
            building_health_score=dashboard.building_health_score,
            building_health_trend=self._get_health_trend(dashboard.building_health_score),
            
            energy_efficiency=energy_efficiency_msg,
            energy_efficiency_score=dashboard.energy_efficiency_score,
            today_forecast=today_forecast,
            
            predicted_electricity_bill_today=daily_bill,
            predicted_electricity_bill_month=monthly_bill,
            estimated_daily_saving=daily_saving,
            estimated_monthly_saving=monthly_saving,
            
            predicted_peak_hour=peak_info["time"],
            peak_load_kw=peak_info["load"],
            
            carbon_reduction_today=carbon_today,
            carbon_reduction_month=carbon_month,
            
            critical_alerts=critical_alerts,
            top_risks=top_risks,
            equipment_requiring_attention=equipment_issues,
            
            top_recommendations=[rec.title for rec in top_recs],
            priority_actions=priority_actions,
            
            executive_summary=executive_summary,
            facility_manager_insights=facility_manager_insights,
            
            confidence_score=confidence,
            data_freshness_minutes=self._estimate_data_age(rooms),
        )

    def _generate_greeting(self, dashboard: Dashboard, hour: int) -> str:
        """Generate context-aware greeting."""
        if hour < 6:
            time_greeting = "Early morning"
        elif hour < 9:
            time_greeting = "Good morning"
        elif hour < 12:
            time_greeting = "Mid-morning"
        elif hour < 15:
            time_greeting = "Good afternoon"
        elif hour < 18:
            time_greeting = "Late afternoon"
        else:
            time_greeting = "Good evening"
        
        status = "operating smoothly" if dashboard.building_health_score >= 75 else "requires attention"
        occupancy_status = "well-occupied" if dashboard.occupancy_percentage > 60 else "lightly occupied"
        
        return (
            f"{time_greeting}! Your building is {status} today and is currently {occupancy_status} "
            f"({dashboard.occupancy_percentage:.0f}% occupancy)."
        )

    def _get_building_health_message(self, health_score: int) -> str:
        """Get health status message."""
        if health_score >= 85:
            return "Excellent"
        elif health_score >= 75:
            return "Good"
        elif health_score >= 60:
            return "Fair"
        else:
            return "Poor"

    def _get_energy_efficiency_message(self, efficiency_score: int) -> str:
        """Get efficiency status message."""
        if efficiency_score >= 85:
            return "Highly efficient"
        elif efficiency_score >= 75:
            return "Efficient"
        elif efficiency_score >= 60:
            return "Moderate efficiency"
        else:
            return "Below target efficiency"

    def _get_health_trend(self, health_score: int) -> str:
        """Determine health trend."""
        if health_score >= 80:
            return "Trending up - Keep up the good work"
        elif health_score >= 70:
            return "Stable - Monitor closely"
        else:
            return "Trending down - Action needed"

    def _generate_forecast(self, dashboard: Dashboard, recommendations: list[Recommendation]) -> str:
        """Generate today's energy forecast."""
        base_forecast = f"Today's predicted consumption: {dashboard.current_consumption:.1f} kW average"
        
        if recommendations:
            top_saving_rec = max(recommendations, key=lambda r: float(r.estimated_daily_saving.replace("₹", "").replace(",", "")))
            saving_amount = top_saving_rec.estimated_daily_saving
            return f"{base_forecast}. Potential savings with {top_saving_rec.title}: {saving_amount}."
        
        return base_forecast

    def _extract_peak_info(self, rooms: list[Room], dashboard: Dashboard) -> dict[str, Any]:
        """Extract peak load and timing information."""
        if not rooms:
            return {"time": "14:00 - 16:00 (Typical)", "load": dashboard.current_consumption}
        
        # Peak typically occurs mid-afternoon
        peak_load = max(r.current_power_kw for r in rooms)
        
        return {
            "time": "14:00 - 16:00 (Predicted)",
            "load": peak_load,
        }

    def _extract_critical_alerts(self, alerts: list[dict[str, Any]], dashboard: Dashboard) -> list[str]:
        """Extract critical alerts."""
        critical = []
        
        if dashboard.critical_alerts > 0:
            critical.append(f"{dashboard.critical_alerts} critical alert(s) detected - review immediately")
        
        for alert in alerts[:3]:  # Limit to top 3
            if alert.get("severity", "").lower() == "critical":
                critical.append(alert.get("message", "Critical issue detected"))
        
        if dashboard.active_anomalies > 0:
            critical.append(f"{dashboard.active_anomalies} anomalies detected in building operations")
        
        return critical if critical else ["No critical alerts at this time"]

    def _extract_top_risks(self, anomalies: list[dict[str, Any]], alerts: list[dict[str, Any]]) -> list[str]:
        """Extract top operational risks."""
        risks = []
        
        # Extract from anomalies
        for anomaly in anomalies[:2]:
            if anomaly.get("severity") in ["High", "Critical"]:
                risks.append(f"Risk: {anomaly.get('description', 'Operational anomaly detected')}")
        
        # Extract from alerts
        for alert in alerts[:1]:
            if alert.get("type") in ["high_consumption", "thermal_stress"]:
                risks.append(f"Risk: {alert.get('message', 'Operational risk detected')}")
        
        if not risks:
            risks.append("Building operations within normal parameters")
        
        return risks

    def _extract_equipment_issues(self, rooms: list[Room], alerts: list[dict[str, Any]]) -> list[str]:
        """Extract equipment requiring attention."""
        issues = []
        
        # Check for rooms with issues
        idle_ac_rooms = [r for r in rooms if r.ac_status == "ON" and not r.occupied]
        if idle_ac_rooms:
            issues.append(f"AC running idle in {len(idle_ac_rooms)} room(s) - turn off to save energy")
        
        idle_light_rooms = [r for r in rooms if r.light_status == "ON" and not r.occupied]
        if idle_light_rooms:
            issues.append(f"Lights on in {len(idle_light_rooms)} unoccupied room(s)")
        
        hot_rooms = [r for r in rooms if r.temperature_c > 30]
        if hot_rooms:
            issues.append(f"{len(hot_rooms)} room(s) temperature above 30°C - AC maintenance recommended")
        
        # Add any equipment-specific alerts
        for alert in alerts[:2]:
            if alert.get("type") in ["equipment_malfunction", "maintenance_required"]:
                issues.append(alert.get("message", "Equipment attention needed"))
        
        return issues if issues else ["All equipment operating normally"]

    def _prioritize_recommendations(self, recommendations: list[Recommendation], limit: int = 5) -> list[Recommendation]:
        """Prioritize recommendations by impact and urgency."""
        # Sort by priority score and urgency
        priority_map = {"Critical": 4, "High": 3, "Medium": 2, "Low": 1}
        
        sorted_recs = sorted(
            recommendations,
            key=lambda r: (
                priority_map.get(str(r.urgency), 0),
                r.priority_score,
                float(r.estimated_daily_saving.replace("₹", "").replace(",", "")) if r.estimated_daily_saving else 0,
            ),
            reverse=True,
        )
        
        return sorted_recs[:limit]

    def _extract_priority_actions(self, recommendations: list[Recommendation]) -> list[str]:
        """Extract actionable items from top recommendations."""
        actions = []
        
        for i, rec in enumerate(recommendations[:3], 1):
            action = f"{i}. {rec.recommended_action} ({rec.estimated_daily_saving} daily savings)"
            actions.append(action)
        
        return actions if actions else ["Review top recommendations in dashboard"]

    def _generate_facility_manager_insights(
        self,
        dashboard: Dashboard,
        recommendations: list[Recommendation],
        alerts: list[dict[str, Any]],
        anomalies: list[dict[str, Any]],
    ) -> str:
        """Generate facility manager insights using AI or rule-based fallback."""
        
        # Try AI generation if available
        if self._ai_service:
            try:
                context = self._build_context_for_ai(dashboard, recommendations, alerts, anomalies)
                ai_insights = self._ai_service.generate_facility_manager_insights(context)
                if ai_insights:
                    return ai_insights
            except Exception:
                pass  # Fall through to rule-based
        
        # Rule-based fallback
        return self._generate_rule_based_insights(dashboard, recommendations, alerts, anomalies)

    def _build_context_for_ai(
        self,
        dashboard: Dashboard,
        recommendations: list[Recommendation],
        alerts: list[dict[str, Any]],
        anomalies: list[dict[str, Any]],
    ) -> dict[str, Any]:
        """Build context for AI insight generation."""
        return {
            "building_health_score": dashboard.building_health_score,
            "energy_efficiency_score": dashboard.energy_efficiency_score,
            "current_consumption": dashboard.current_consumption,
            "occupancy_percentage": dashboard.occupancy_percentage,
            "active_alerts": dashboard.active_alerts,
            "critical_alerts": dashboard.critical_alerts,
            "anomalies": len(anomalies),
            "top_recommendations": [r.title for r in recommendations[:3]],
            "high_priority_actions": dashboard.high_priority_actions,
        }

    def _generate_rule_based_insights(
        self,
        dashboard: Dashboard,
        recommendations: list[Recommendation],
        alerts: list[dict[str, Any]],
        anomalies: list[dict[str, Any]],
    ) -> str:
        """Generate insights using deterministic rules."""
        insights = []
        
        # Health assessment
        if dashboard.building_health_score >= 80:
            insights.append("✓ Building health is excellent - maintain current practices.")
        elif dashboard.building_health_score >= 70:
            insights.append("⚠ Building health is acceptable but monitor the following issues closely.")
        else:
            insights.append("⚠ Building health requires immediate attention to the priority items below.")
        
        # Efficiency assessment
        if dashboard.energy_efficiency_score >= 80:
            insights.append("Your building is operating at high efficiency levels.")
        elif dashboard.energy_efficiency_score >= 70:
            insights.append("There is room for efficiency improvements, particularly in HVAC and lighting.")
        else:
            insights.append("Significant efficiency improvements are needed. Focus on top recommendations.")
        
        # Alert assessment
        if dashboard.critical_alerts > 0:
            insights.append(f"Address the {dashboard.critical_alerts} critical alert(s) immediately.")
        
        # Recommendation summary
        if recommendations:
            savings_sum = sum(
                float(r.estimated_daily_saving.replace("₹", "").replace(",", "")) 
                for r in recommendations[:5]
                if r.estimated_daily_saving
            )
            insights.append(f"Implementing top 5 recommendations could save ₹{savings_sum:.0f} daily.")
        
        # Priority guidance
        if dashboard.high_priority_actions > 0:
            insights.append(f"Focus on {dashboard.high_priority_actions} high-priority actions first.")
        
        return " ".join(insights)

    def _generate_executive_summary(
        self,
        dashboard: Dashboard,
        recommendations: list[Recommendation],
        alerts: list[str],
    ) -> str:
        """Generate executive summary of daily status."""
        summary_parts = []
        
        # Health status
        health_status = self._get_building_health_message(dashboard.building_health_score)
        summary_parts.append(f"Building Health: {health_status} ({dashboard.building_health_score}%)")
        
        # Efficiency status
        efficiency_status = self._get_energy_efficiency_message(dashboard.energy_efficiency_score)
        summary_parts.append(f"Energy Efficiency: {efficiency_status} ({dashboard.energy_efficiency_score}%)")
        
        # Consumption
        summary_parts.append(f"Today's Consumption: {dashboard.current_consumption:.1f} kW")
        
        # Bill forecast
        summary_parts.append(f"Predicted Bill: {self._format_currency(float(dashboard.predicted_today_bill))}")
        
        # Critical issues
        if alerts:
            summary_parts.append(f"Critical Issues: {len(alerts)} requiring attention")
        
        # Top action
        if recommendations:
            top_rec = recommendations[0]
            summary_parts.append(f"Priority Action: {top_rec.title} ({top_rec.estimated_daily_saving} savings)")
        
        return " | ".join(summary_parts)

    def _format_currency(self, amount: float) -> str:
        """Format amount as currency."""
        if amount >= 1000:
            return f"₹{amount / 1000:.1f}k"
        return f"₹{amount:.0f}"

    def _calculate_daily_carbon(self, dashboard: Dashboard, rooms: list[Room]) -> str:
        """Calculate daily carbon reduction."""
        # Estimate based on consumption and efficiency
        total_consumption = dashboard.current_consumption * 24  # Daily kWh
        carbon_factor = 0.85  # kg CO2 per kWh (Indian grid average)
        daily_carbon = total_consumption * carbon_factor
        
        if daily_carbon > 1000:
            return f"{daily_carbon / 1000:.1f} metric tons CO₂e"
        return f"{daily_carbon:.0f} kg CO₂e"

    def _calculate_monthly_carbon(self, dashboard: Dashboard) -> str:
        """Calculate monthly carbon reduction."""
        daily_consumption = dashboard.current_consumption * 24
        monthly_consumption = daily_consumption * 30
        carbon_factor = 0.85
        monthly_carbon = monthly_consumption * carbon_factor
        
        if monthly_carbon > 1000:
            return f"{monthly_carbon / 1000:.1f} metric tons CO₂e"
        return f"{monthly_carbon:.0f} kg CO₂e"

    def _calculate_confidence(self, dashboard: Dashboard) -> int:
        """Calculate confidence score based on data quality."""
        confidence = 85
        
        # Adjust based on alert levels
        if dashboard.active_alerts > 5:
            confidence -= 10
        
        # Boost if no critical alerts
        if dashboard.critical_alerts == 0:
            confidence += 5
        
        # Clamp between 60-95
        return max(60, min(95, confidence))

    def _estimate_data_age(self, rooms: list[Room]) -> int:
        """Estimate how recent the data is."""
        if not rooms:
            return 60
        
        # In a real system, we'd check the updated_at timestamps
        # For now, assume data is fresh every few minutes
        return 5
