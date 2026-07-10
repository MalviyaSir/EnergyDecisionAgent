from app.schemas.energy import SimulationRequest, WhatIfAnalysis


class WhatIfAnalysisService:
    """Generates AI-powered analysis and recommendations for what-if scenarios."""

    def analyze(
        self,
        request: SimulationRequest,
        monthly_savings: float,
        annual_savings: float,
        carbon_reduction: float,
        efficiency_improvement: float,
        health_improvement: float,
        peak_load_reduction: float,
        roi_percent: float,
    ) -> WhatIfAnalysis:
        """Generate comprehensive AI analysis for the what-if scenario."""
        
        benefits = self._extract_benefits(
            monthly_savings,
            annual_savings,
            carbon_reduction,
            efficiency_improvement,
            health_improvement,
            peak_load_reduction,
            roi_percent,
        )
        
        trade_offs = self._extract_tradeoffs(request)
        risks = self._extract_risks(request)
        recommendations = self._generate_recommendations(request, monthly_savings, benefits, risks)
        confidence = self._calculate_confidence(request, monthly_savings)
        summary = self._generate_summary(request, benefits, monthly_savings, confidence)
        
        return WhatIfAnalysis(
            executive_summary=summary,
            benefits=benefits,
            trade_offs=trade_offs,
            risks=risks,
            recommendations=recommendations,
            confidence_score=confidence,
        )

    def _extract_benefits(
        self,
        monthly_savings: float,
        annual_savings: float,
        carbon_reduction: float,
        efficiency_improvement: float,
        health_improvement: float,
        peak_load_reduction: float,
        roi_percent: float,
    ) -> list[str]:
        """Extract key benefits from the scenario."""
        benefits = []

        if monthly_savings > 1000:
            benefits.append(f"Significant monthly cost savings of ₹{monthly_savings:,.0f}")
        elif monthly_savings > 500:
            benefits.append(f"Substantial monthly cost savings of ₹{monthly_savings:,.0f}")
        elif monthly_savings > 0:
            benefits.append(f"Monthly cost savings of ₹{monthly_savings:,.0f}")

        if annual_savings > 0:
            benefits.append(f"Annual savings of ₹{annual_savings:,.0f}")

        if carbon_reduction > 500:
            benefits.append(f"Significant carbon emission reduction of {carbon_reduction:,.0f} kg CO₂/year")
        elif carbon_reduction > 100:
            benefits.append(f"Carbon footprint reduction of {carbon_reduction:,.0f} kg CO₂/year")

        if efficiency_improvement > 15:
            benefits.append(f"Energy efficiency improvement of {efficiency_improvement:.1f}%")
        elif efficiency_improvement > 5:
            benefits.append(f"Notable energy efficiency improvement of {efficiency_improvement:.1f}%")

        if health_improvement > 10:
            benefits.append(f"Building health improvement of {health_improvement:.1f}%")

        if peak_load_reduction > 10:
            benefits.append(f"Peak load reduction of {peak_load_reduction:.1f}%")

        if roi_percent > 100:
            benefits.append(f"Strong ROI of {roi_percent:.1f}% within 12 months")
        elif roi_percent > 0:
            benefits.append(f"Positive ROI of {roi_percent:.1f}% within 12 months")

        return benefits if benefits else ["Implementation delivers measurable benefits"]

    def _extract_tradeoffs(self, request: SimulationRequest) -> list[str]:
        """Identify trade-offs and potential conflicts in the scenario."""
        trade_offs = []

        if request.ac_setpoint_c > 26:
            trade_offs.append("Higher temperature setpoint may reduce occupant comfort in certain areas")

        if request.lighting_schedule_percent < 80:
            trade_offs.append("Reduced lighting could impact productivity and visibility")

        if request.occupancy_percent < 100:
            trade_offs.append("Lower occupancy assumptions may not apply during peak hours")

        if request.ev_charging_load_kw > 50:
            trade_offs.append("High EV charging load may require grid coordination during peak hours")

        if request.solar_capacity_kw > 0 and request.battery_capacity_kwh < 20:
            trade_offs.append("High solar generation with low battery capacity may result in energy waste")

        if request.working_hours_end - request.working_hours_start < 8:
            trade_offs.append("Shortened working hours may require changes to operational procedures")

        return trade_offs if trade_offs else ["No significant trade-offs identified"]

    def _extract_risks(self, request: SimulationRequest) -> list[str]:
        """Identify potential risks in the scenario."""
        risks = []

        if request.ac_setpoint_c > 28:
            risks.append("Very high temperature setpoint (>28°C) poses moderate comfort risk")

        if request.occupancy_percent < 50:
            risks.append("Very low occupancy assumption may invalidate energy projections")

        if request.lighting_schedule_percent < 60:
            risks.append("Aggressive lighting reduction may impact safety and security")

        if request.battery_capacity_kwh > 500 and request.solar_capacity_kw < 50:
            risks.append("High battery capacity without sufficient solar generation may increase costs")

        if request.ev_charging_load_kw > 100:
            risks.append("Very high EV charging load may strain electrical infrastructure")

        if request.working_hours_start >= request.working_hours_end:
            risks.append("Invalid working hours configuration")

        return risks if risks else ["Risk assessment shows low implementation risk"]

    def _generate_recommendations(
        self,
        request: SimulationRequest,
        monthly_savings: float,
        benefits: list[str],
        risks: list[str],
    ) -> list[str]:
        """Generate actionable recommendations based on scenario analysis."""
        recommendations = []

        if monthly_savings > 2000:
            recommendations.append("Highly recommended: Implement this scenario immediately for maximum ROI")
        elif monthly_savings > 1000:
            recommendations.append("Recommended: This scenario offers strong financial benefits")
        elif monthly_savings > 500:
            recommendations.append("Consider: This scenario provides moderate savings with acceptable trade-offs")
        else:
            recommendations.append("Evaluate: This scenario requires careful cost-benefit analysis")

        if request.ac_setpoint_c > 26:
            recommendations.append("Conduct thermal comfort survey before raising temperature setpoint above 26°C")

        if request.solar_capacity_kw > 0:
            recommendations.append("Implement real-time solar monitoring dashboard")

        if request.battery_capacity_kwh > 0:
            recommendations.append("Set up automated battery charging/discharging schedules aligned with tariff rates")

        if request.ev_charging_load_kw > 0:
            recommendations.append("Shift EV charging to off-peak hours (typically 22:00-06:00)")

        if request.occupancy_percent < 80:
            recommendations.append("Validate occupancy assumptions with actual building schedules")

        recommendations.append("Schedule quarterly reviews to track actual vs. projected savings")

        return recommendations

    def _calculate_confidence(self, request: SimulationRequest, monthly_savings: float) -> int:
        """Calculate confidence score for the scenario."""
        confidence = 75  # Base confidence

        # Increase confidence for conservative scenarios
        if request.ac_setpoint_c <= 24:
            confidence += 5
        elif request.ac_setpoint_c > 27:
            confidence -= 10

        if request.occupancy_percent >= 80:
            confidence += 5
        elif request.occupancy_percent < 50:
            confidence -= 10

        if request.lighting_schedule_percent >= 90:
            confidence += 5
        elif request.lighting_schedule_percent < 70:
            confidence -= 5

        if request.electricity_tariff_per_kwh > 0:
            confidence += 5

        # Decrease confidence for extreme scenarios
        if request.solar_capacity_kw > 500 or request.battery_capacity_kwh > 1000:
            confidence -= 10

        if request.ev_charging_load_kw > 100:
            confidence -= 5

        # Clamp confidence between 40-95
        return max(40, min(95, confidence))

    def _generate_summary(
        self,
        request: SimulationRequest,
        benefits: list[str],
        monthly_savings: float,
        confidence: int,
    ) -> str:
        """Generate executive summary of the scenario."""
        main_benefit = benefits[0] if benefits else "Implementation delivers energy optimization"

        temperature_text = ""
        if request.ac_setpoint_c > 24:
            temperature_text = f" with AC setpoint increased to {request.ac_setpoint_c}°C"
        elif request.ac_setpoint_c < 24:
            temperature_text = f" with AC setpoint reduced to {request.ac_setpoint_c}°C"

        occupancy_text = ""
        if request.occupancy_percent < 100:
            occupancy_text = f" based on {request.occupancy_percent}% occupancy levels"

        tariff_text = ""
        if abs(request.electricity_tariff_per_kwh - 8.5) > 0.5:
            tariff_text = f" with electricity tariff of ₹{request.electricity_tariff_per_kwh}/kWh"

        return (
            f"{main_benefit}{temperature_text}{occupancy_text}{tariff_text}. "
            f"Analysis confidence: {confidence}%. "
            f"Recommended for implementation with validation of key assumptions."
        )
