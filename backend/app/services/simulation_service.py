from app.schemas.energy import (
    DeviceStatus,
    Room,
    SimulationRequest,
    SimulationResult,
    WhatIfComparison,
)
from app.services.whatif_analysis_service import WhatIfAnalysisService
from app.utils.settings import Settings


class SimulationService:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._analysis_service = WhatIfAnalysisService()

    def simulate(self, rooms: list[Room], request: SimulationRequest) -> SimulationResult:
        """Run comprehensive what-if simulation with AI analysis."""
        
        # Calculate current state metrics from actual room data
        current_state = self._calculate_current_state(rooms)
        
        # Calculate proposed state based on what-if parameters
        proposed_state = self._calculate_proposed_state(rooms, request, current_state)
        
        # Calculate impact metrics
        monthly_savings = current_state["monthly_bill"] - proposed_state["monthly_bill"]
        annual_savings = monthly_savings * 12
        daily_savings = monthly_savings / 30
        carbon_reduction = (current_state["energy_kwh"] - proposed_state["energy_kwh"]) * 0.85  # kg CO2
        energy_improvement = ((current_state["energy_kwh"] - proposed_state["energy_kwh"]) / current_state["energy_kwh"] * 100) if current_state["energy_kwh"] > 0 else 0
        health_improvement = min(15, max(0, (proposed_state["health_score"] - current_state["health_score"]) / 10))
        peak_reduction = current_state["peak_load"] - proposed_state["peak_load"]
        peak_reduction_percent = (peak_reduction / current_state["peak_load"] * 100) if current_state["peak_load"] > 0 else 0
        roi = (annual_savings / 50000) * 100 if annual_savings > 0 else 0  # Assuming 50k implementation cost
        
        # Generate AI analysis
        analysis = self._analysis_service.analyze(
            request,
            monthly_savings,
            annual_savings,
            carbon_reduction,
            energy_improvement,
            health_improvement,
            peak_reduction,
            roi,
        )
        
        # Build comparison data
        comparisons = self._build_comparisons(current_state, proposed_state, energy_improvement)
        
        # Generate actions considered
        actions = self._generate_actions(request, rooms)
        
        # Build legacy backward-compatible response
        legacy_daily_saving = (current_state["daily_bill"]) * 0.3  # Rough estimate
        legacy_monthly_saving = legacy_daily_saving * 30
        
        return SimulationResult(
            # Current state
            current_energy_usage_kwh=current_state["energy_kwh"],
            current_monthly_bill_inr=current_state["monthly_bill"],
            current_comfort_score=int(current_state["comfort_score"]),
            current_efficiency_score=int(current_state["efficiency_score"]),
            current_health_score=int(current_state["health_score"]),
            
            # Proposed state
            predicted_energy_usage_kwh=proposed_state["energy_kwh"],
            predicted_monthly_bill_inr=proposed_state["monthly_bill"],
            predicted_comfort_score=int(proposed_state["comfort_score"]),
            predicted_efficiency_score=int(proposed_state["efficiency_score"]),
            predicted_health_score=int(proposed_state["health_score"]),
            
            # Impact metrics
            monthly_savings_inr=max(0, monthly_savings),
            annual_savings_inr=max(0, annual_savings),
            carbon_reduction_kg_co2=max(0, carbon_reduction),
            energy_efficiency_improvement_percent=max(0, energy_improvement),
            building_health_improvement_percent=max(0, health_improvement),
            peak_load_reduction_kw=max(0, peak_reduction),
            roi_percent=max(0, roi),
            peak_load_reduction_percent=max(0, peak_reduction_percent),
            daily_savings_inr=max(0, daily_savings),
            
            # Analysis
            analysis=analysis,
            comparisons=comparisons,
            actions_considered=actions,
            
            # Backward-compatible fields
            estimated_daily_saving_inr=max(0, legacy_daily_saving),
            estimated_monthly_saving_inr=max(0, legacy_monthly_saving),
        )

    def _calculate_current_state(self, rooms: list[Room]) -> dict:
        """Calculate current building state metrics."""
        total_rooms = len(rooms)
        occupied_rooms = sum(1 for r in rooms if r.occupied)
        
        total_energy_kwh = sum(r.daily_energy_kwh for r in rooms)
        total_power_kw = sum(r.current_power_kw for r in rooms)
        avg_temp = sum(r.temperature_c for r in rooms) / total_rooms if total_rooms > 0 else 25
        peak_load = max((r.current_power_kw for r in rooms), default=0)
        
        # Calculate metrics
        monthly_bill = total_energy_kwh * self._settings.tariff_per_kwh
        comfort_score = max(0, min(100, 100 - (avg_temp - 22) * 3))  # Optimal temp is 22C
        efficiency_score = max(0, min(100, 100 - (total_power_kw / (total_rooms * 2)) * 10))
        health_score = max(0, min(100, 80 + (occupied_rooms / total_rooms * 20)))
        
        return {
            "energy_kwh": total_energy_kwh,
            "power_kw": total_power_kw,
            "peak_load": peak_load,
            "avg_temp": avg_temp,
            "occupied_rooms": occupied_rooms,
            "total_rooms": total_rooms,
            "monthly_bill": monthly_bill,
            "daily_bill": monthly_bill / 30,
            "comfort_score": comfort_score,
            "efficiency_score": efficiency_score,
            "health_score": health_score,
        }

    def _calculate_proposed_state(self, rooms: list[Room], request: SimulationRequest, current: dict) -> dict:
        """Calculate proposed state based on what-if parameters."""
        proposed = current.copy()
        
        # Energy savings from various measures
        energy_savings_kwh = 0.0
        
        # 1. AC setpoint adjustment
        ac_delta = (24 - request.ac_setpoint_c) * 0.05  # 5% per degree difference
        energy_savings_kwh += current["energy_kwh"] * max(-0.3, min(0.3, ac_delta))
        
        # 2. Lighting reduction
        lighting_reduction = (100 - request.lighting_schedule_percent) / 100
        energy_savings_kwh += current["energy_kwh"] * lighting_reduction * 0.25  # Lighting is ~25% of load
        
        # 3. Occupancy reduction
        occupancy_reduction = (100 - request.occupancy_percent) / 100
        energy_savings_kwh += current["energy_kwh"] * occupancy_reduction * 0.4
        
        # 4. Solar generation (reduces consumption)
        solar_generation = request.solar_capacity_kw * 4  # Avg 4 hours peak equivalent
        energy_savings_kwh += solar_generation
        
        # 5. EV charging load (increases consumption)
        ev_load_daily = request.ev_charging_load_kw * 3  # Assume 3 hours daily charging
        energy_savings_kwh -= ev_load_daily
        
        # Update energy and bill
        proposed["energy_kwh"] = max(1, current["energy_kwh"] - energy_savings_kwh)
        proposed["monthly_bill"] = proposed["energy_kwh"] * request.electricity_tariff_per_kwh
        
        # Comfort score adjustments
        comfort_adjustment = 0
        if request.ac_setpoint_c > 26:
            comfort_adjustment -= 15
        elif request.ac_setpoint_c < 20:
            comfort_adjustment -= 10
        if request.lighting_schedule_percent < 70:
            comfort_adjustment -= 10
        
        proposed["comfort_score"] = max(0, min(100, current["comfort_score"] + comfort_adjustment))
        
        # Efficiency score improvement
        efficiency_improvement = (current["energy_kwh"] - proposed["energy_kwh"]) / current["energy_kwh"] * 100 if current["energy_kwh"] > 0 else 0
        proposed["efficiency_score"] = min(100, current["efficiency_score"] + efficiency_improvement * 0.5)
        
        # Health score improvement
        health_adjustment = min(10, efficiency_improvement * 0.1)
        proposed["health_score"] = min(100, current["health_score"] + health_adjustment)
        
        # Peak load reduction
        peak_reduction = request.solar_capacity_kw * 0.7  # Solar reduces peak
        proposed["peak_load"] = max(5, current["peak_load"] - peak_reduction)
        
        return proposed

    def _build_comparisons(self, current: dict, proposed: dict, energy_improvement: float) -> list[WhatIfComparison]:
        """Build comparison data for UI display."""
        comparisons = [
            WhatIfComparison(
                metric="Monthly Energy Consumption",
                current_value=current["energy_kwh"],
                proposed_value=proposed["energy_kwh"],
                improvement_percent=max(0, (current["energy_kwh"] - proposed["energy_kwh"]) / current["energy_kwh"] * 100),
                unit="kWh",
            ),
            WhatIfComparison(
                metric="Monthly Electricity Bill",
                current_value=current["monthly_bill"],
                proposed_value=proposed["monthly_bill"],
                improvement_percent=max(0, (current["monthly_bill"] - proposed["monthly_bill"]) / current["monthly_bill"] * 100),
                unit="₹",
            ),
            WhatIfComparison(
                metric="Comfort Score",
                current_value=current["comfort_score"],
                proposed_value=proposed["comfort_score"],
                improvement_percent=(proposed["comfort_score"] - current["comfort_score"]),
                unit="points",
            ),
            WhatIfComparison(
                metric="Energy Efficiency",
                current_value=current["efficiency_score"],
                proposed_value=proposed["efficiency_score"],
                improvement_percent=max(0, proposed["efficiency_score"] - current["efficiency_score"]),
                unit="score",
            ),
            WhatIfComparison(
                metric="Building Health",
                current_value=current["health_score"],
                proposed_value=proposed["health_score"],
                improvement_percent=max(0, proposed["health_score"] - current["health_score"]),
                unit="score",
            ),
            WhatIfComparison(
                metric="Peak Load",
                current_value=current["peak_load"],
                proposed_value=proposed["peak_load"],
                improvement_percent=max(0, (current["peak_load"] - proposed["peak_load"]) / current["peak_load"] * 100),
                unit="kW",
            ),
        ]
        return comparisons

    def _generate_actions(self, request: SimulationRequest, rooms: list[Room]) -> list[str]:
        """Generate list of actions considered in the scenario."""
        actions = []

        if request.turn_off_idle_ac:
            idle_ac_rooms = [room for room in rooms if not room.occupied and room.ac_status == DeviceStatus.ON]
            actions.append(f"Turn off idle AC in {len(idle_ac_rooms)} rooms")

        if request.turn_off_idle_lights:
            idle_light_rooms = [room for room in rooms if not room.occupied and room.light_status == DeviceStatus.ON]
            actions.append(f"Turn off idle lights in {len(idle_light_rooms)} rooms")

        if request.ac_setpoint_c != 24:
            direction = "increase" if request.ac_setpoint_c > 24 else "decrease"
            actions.append(f"{direction.capitalize()} AC setpoint to {request.ac_setpoint_c}°C")

        if request.lighting_schedule_percent < 100:
            actions.append(f"Reduce lighting schedule to {request.lighting_schedule_percent}%")

        if request.occupancy_percent < 100:
            actions.append(f"Adjust operations for {request.occupancy_percent}% occupancy")

        if request.working_hours_end - request.working_hours_start < 24:
            actions.append(f"Optimize for working hours {request.working_hours_start:02d}:00-{request.working_hours_end:02d}:00")

        if request.electricity_tariff_per_kwh != 8.5:
            actions.append(f"Apply dynamic tariff of ₹{request.electricity_tariff_per_kwh}/kWh")

        if request.solar_capacity_kw > 0:
            actions.append(f"Deploy {request.solar_capacity_kw} kW solar capacity")

        if request.battery_capacity_kwh > 0:
            actions.append(f"Install {request.battery_capacity_kwh} kWh battery storage")

        if request.ev_charging_load_kw > 0:
            actions.append(f"Manage {request.ev_charging_load_kw} kW EV charging load")

        return actions

