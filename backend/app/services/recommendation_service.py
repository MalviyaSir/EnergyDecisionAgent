from datetime import UTC, datetime

from app.schemas.energy import AnomalyExplanation, DeviceStatus, Priority, Recommendation, Room
from app.utils.calculations import (
    carbon_reduction_text,
    estimate_daily_saving_kwh,
    inr_per_day,
    inr_per_month,
    parse_money_amount,
    priority_score,
    saving_inr_from_kwh,
)
from app.utils.settings import Settings


class RecommendationService:
    """Explainable rule-based AI Decision Engine for live energy telemetry."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    def generate(self, rooms: list[Room]) -> list[Recommendation]:
        recommendations: list[Recommendation] = []
        total_occupied = sum(1 for room in rooms if room.occupied)
        occupancy_percentage = (total_occupied / len(rooms)) * 100 if rooms else 0

        for room in rooms:
            recommendations.extend(self._room_rules(room))

        if occupancy_percentage > 90:
            recommendations.append(self._building_load_balancing_recommendation(rooms, occupancy_percentage))

        return sorted(
            recommendations,
            key=lambda item: (
                item.priority_score,
                parse_money_amount(item.estimated_daily_saving),
                item.confidence,
            ),
            reverse=True,
        )

    def active_alert_count(self, rooms: list[Room]) -> int:
        return sum(1 for room in rooms if room.current_power_kw > self._settings.high_power_threshold_kw)

    def _room_rules(self, room: Room) -> list[Recommendation]:
        results: list[Recommendation] = []

        if not room.occupied and room.ac_status == DeviceStatus.ON:
            results.append(
                self._build_recommendation(
                    rule_id="idle-ac",
                    room=room,
                    title=f"Turn OFF AC in {room.room_id}",
                    category="HVAC",
                    priority=Priority.HIGH,
                    reason=f"Room {room.room_id} has remained unoccupied for {room.occupancy_state_minutes} minutes while AC is ON.",
                    evidence=[
                        "Occupancy = False",
                        "AC Status = ON",
                        f"Current Power = {room.current_power_kw} kW",
                        f"Temperature = {room.temperature_c}°C",
                    ],
                    confidence=95,
                    business_impact="Reduce unnecessary HVAC cost, lower electricity bill, and increase equipment life.",
                    recommended_action="Turn OFF AC immediately.",
                    ai_explanation=(
                        "The room has been empty while the air conditioner continues operating. "
                        "This indicates unnecessary energy consumption. Turning it off immediately is expected "
                        "to reduce electricity usage without affecting occupant comfort."
                    ),
                )
            )

        if not room.occupied and room.light_status == DeviceStatus.ON:
            results.append(
                self._build_recommendation(
                    rule_id="idle-lighting",
                    room=room,
                    title=f"Switch OFF lights in {room.room_id}",
                    category="Lighting",
                    priority=Priority.MEDIUM,
                    reason=f"Room {room.room_id} has no occupants, but lights are still ON.",
                    evidence=[
                        "Occupancy = False",
                        "Light Status = ON",
                        f"Current Power = {room.current_power_kw} kW",
                        f"Unoccupied Duration = {room.occupancy_state_minutes} minutes",
                    ],
                    confidence=92,
                    business_impact="Reduce lighting waste and improve electricity cost control.",
                    recommended_action="Switch OFF lights after occupancy ends.",
                    ai_explanation=(
                        "Lighting is active in an empty room. This creates avoidable energy draw, especially "
                        "when repeated across many rooms. Switching the lights off preserves service quality "
                        "while reducing consumption."
                    ),
                )
            )

        if room.temperature_c > 35:
            results.append(
                self._build_recommendation(
                    rule_id="high-temperature",
                    room=room,
                    title=f"Optimize cooling in {room.room_id}",
                    category="HVAC",
                    priority=Priority.HIGH,
                    reason=f"Room {room.room_id} temperature is {room.temperature_c}°C, above the 35°C comfort threshold.",
                    evidence=[
                        f"Temperature = {room.temperature_c}°C",
                        f"Humidity = {room.humidity_percent}%",
                        f"AC Status = {room.ac_status}",
                        f"Occupancy Count = {room.occupancy_count}",
                    ],
                    confidence=88,
                    business_impact="Improve occupant comfort while avoiding inefficient cooling behavior.",
                    recommended_action="Increase thermostat control discipline and target 24°C.",
                    ai_explanation=(
                        "The room is operating above the acceptable temperature threshold. A controlled setpoint "
                        "around 24°C can stabilize comfort and reduce inefficient high-load cooling cycles."
                    ),
                )
            )

        if room.current_power_kw > self._settings.high_power_threshold_kw:
            severity = Priority.CRITICAL if room.current_power_kw > self._settings.high_power_threshold_kw * 1.2 else Priority.HIGH
            results.append(
                self._build_recommendation(
                    rule_id="power-anomaly",
                    room=room,
                    title=f"Investigate power anomaly in {room.room_id}",
                    category="Anomaly",
                    priority=severity,
                    reason=(
                        f"Room {room.room_id} is drawing {room.current_power_kw} kW, above the "
                        f"{self._settings.high_power_threshold_kw} kW anomaly threshold."
                    ),
                    evidence=[
                        f"Current Power = {room.current_power_kw} kW",
                        f"Threshold = {self._settings.high_power_threshold_kw} kW",
                        f"AC Status = {room.ac_status}",
                        f"Fan Status = {room.fan_status}",
                        f"Occupancy Count = {room.occupancy_count}",
                    ],
                    confidence=91,
                    business_impact="Reduce electricity bill, prevent equipment stress, and improve operational reliability.",
                    recommended_action="Inspect HVAC, plug loads, and controls for abnormal operation.",
                    ai_explanation=(
                        "The room is consuming materially more power than the configured safe operating threshold. "
                        "This pattern can indicate stuck equipment, unusual plug load, or HVAC overuse and should "
                        "be investigated promptly."
                    ),
                    anomaly=AnomalyExplanation(
                        root_cause="Power draw exceeds expected operating threshold for the current room telemetry.",
                        severity=severity,
                        probability=93 if severity == Priority.CRITICAL else 88,
                        recommended_resolution="Check HVAC relay state, plug loads, and recent room activity; reset or isolate abnormal equipment.",
                    ),
                    anomaly_factor=5,
                )
            )

        if room.occupancy_count >= 16:
            results.append(
                self._build_recommendation(
                    rule_id="high-occupancy",
                    room=room,
                    title=f"Balance occupancy load from {room.room_id}",
                    category="Load Management",
                    priority=Priority.MEDIUM,
                    reason=f"Room {room.room_id} has {room.occupancy_count} occupants, creating concentrated cooling and plug-load demand.",
                    evidence=[
                        f"Occupancy Count = {room.occupancy_count}",
                        f"Current Power = {room.current_power_kw} kW",
                        f"Temperature = {room.temperature_c}°C",
                    ],
                    confidence=86,
                    business_impact="Reduce local peak demand and improve comfort across occupied areas.",
                    recommended_action="Redistribute usage to nearby rooms or reduce non-essential plug loads.",
                    ai_explanation=(
                        "High occupancy can drive localized cooling, lighting, and equipment load. Balancing the "
                        "load across nearby rooms reduces peak stress without disrupting activity."
                    ),
                )
            )

        return results

    def _build_recommendation(
        self,
        *,
        rule_id: str,
        room: Room,
        title: str,
        category: str,
        priority: Priority,
        reason: str,
        evidence: list[str],
        confidence: int,
        business_impact: str,
        recommended_action: str,
        ai_explanation: str,
        anomaly: AnomalyExplanation | None = None,
        anomaly_factor: int = 0,
    ) -> Recommendation:
        daily_saving_kwh = estimate_daily_saving_kwh(room, category)
        daily_saving_inr = saving_inr_from_kwh(daily_saving_kwh, self._settings)
        score = priority_score(priority, confidence, daily_saving_inr, anomaly_factor)
        generated_at = datetime.now(UTC).isoformat()

        return Recommendation(
            id=f"rec-{rule_id}-{room.room_id}",
            title=title,
            category=category,
            priority=priority,
            reason=reason,
            evidence=evidence,
            confidence=confidence,
            estimated_daily_saving=inr_per_day(daily_saving_inr, self._settings),
            estimated_monthly_saving=inr_per_month(daily_saving_inr * 30, self._settings),
            estimated_carbon_reduction=carbon_reduction_text(daily_saving_kwh, self._settings),
            urgency=priority,
            business_impact=business_impact,
            recommended_action=recommended_action,
            affected_rooms=[room.room_id],
            generated_at=generated_at,
            status="Open",
            priority_score=score,
            ai_explanation=ai_explanation,
            anomaly=anomaly,
            description=reason,
            estimated_saving=inr_per_day(daily_saving_inr, self._settings),
            room_id=room.room_id,
        )

    def _building_load_balancing_recommendation(self, rooms: list[Room], occupancy_percentage: float) -> Recommendation:
        daily_saving_kwh = min(max(len(rooms) * 0.18, 8), 28)
        daily_saving_inr = saving_inr_from_kwh(daily_saving_kwh, self._settings)
        affected_rooms = [room.room_id for room in rooms if room.occupied and room.occupancy_count >= 12][:12]
        confidence = 89
        priority = Priority.HIGH

        return Recommendation(
            id="rec-building-load-balancing",
            title="Building load balancing recommended",
            category="Load Management",
            priority=priority,
            reason=f"Building occupancy is {occupancy_percentage:.1f}%, which can create peak HVAC and plug-load pressure.",
            evidence=[
                f"Occupied Rooms = {sum(1 for room in rooms if room.occupied)}",
                f"Total Rooms = {len(rooms)}",
                f"Occupancy Percentage = {occupancy_percentage:.1f}%",
            ],
            confidence=confidence,
            estimated_daily_saving=inr_per_day(daily_saving_inr, self._settings),
            estimated_monthly_saving=inr_per_month(daily_saving_inr * 30, self._settings),
            estimated_carbon_reduction=carbon_reduction_text(daily_saving_kwh, self._settings),
            urgency=priority,
            business_impact="Reduce peak demand, stabilize comfort, and avoid inefficient clustered equipment loads.",
            recommended_action="Balance occupants and non-essential loads across available floors.",
            affected_rooms=affected_rooms,
            generated_at=datetime.now(UTC).isoformat(),
            status="Open",
            priority_score=priority_score(priority, confidence, daily_saving_inr),
            ai_explanation=(
                "The building is near full occupancy, which increases simultaneous HVAC, lighting, and plug-load demand. "
                "Distributing load across available space reduces localized peaks and improves efficiency."
            ),
            description="Occupancy exceeds 90%, so HVAC and plug loads should be balanced across floors.",
            estimated_saving=inr_per_day(daily_saving_inr, self._settings),
            room_id=None,
        )
