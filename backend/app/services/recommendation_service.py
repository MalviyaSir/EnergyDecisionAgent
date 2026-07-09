import random

from app.schemas.energy import DeviceStatus, Priority, Recommendation, Room
from app.utils.settings import Settings


class RecommendationService:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    def generate(self, rooms: list[Room]) -> list[Recommendation]:
        recommendations: list[Recommendation] = []
        total_occupied = sum(1 for room in rooms if room.occupied)
        occupancy_percentage = (total_occupied / len(rooms)) * 100 if rooms else 0

        for room in rooms:
            recommendations.extend(self._room_rules(room))

        if occupancy_percentage > 90:
            recommendations.append(
                Recommendation(
                    title="Building load balancing recommended",
                    description="Occupancy exceeds 90%, so HVAC and plug loads should be balanced across floors.",
                    priority=Priority.HIGH,
                    confidence=88,
                    estimated_saving=self._saving(900, 1800),
                    category="Load Management",
                )
            )

        return sorted(
            recommendations,
            key=lambda item: (self._priority_rank(item.priority), item.confidence),
            reverse=True,
        )

    def active_alert_count(self, rooms: list[Room]) -> int:
        return sum(1 for room in rooms if room.current_power_kw > self._settings.high_power_threshold_kw)

    def _room_rules(self, room: Room) -> list[Recommendation]:
        results: list[Recommendation] = []

        if not room.occupied and room.ac_status == DeviceStatus.ON:
            results.append(
                Recommendation(
                    title=f"Turn OFF AC in {room.room_id}",
                    description="AC running without occupancy.",
                    priority=Priority.HIGH,
                    confidence=95,
                    estimated_saving=self._saving(250, 650),
                    category="HVAC",
                    room_id=room.room_id,
                )
            )

        if not room.occupied and room.light_status == DeviceStatus.ON:
            results.append(
                Recommendation(
                    title=f"Switch OFF lights in {room.room_id}",
                    description="Lights are ON while the room is unoccupied.",
                    priority=Priority.MEDIUM,
                    confidence=92,
                    estimated_saving=self._saving(80, 220),
                    category="Lighting",
                    room_id=room.room_id,
                )
            )

        if room.temperature_c > 35:
            results.append(
                Recommendation(
                    title=f"Adjust AC setpoint in {room.room_id}",
                    description="Temperature is above 35°C. Increase cooling efficiency by setting AC to 24°C.",
                    priority=Priority.HIGH,
                    confidence=87,
                    estimated_saving=self._saving(180, 420),
                    category="HVAC",
                    room_id=room.room_id,
                )
            )

        if room.current_power_kw > self._settings.high_power_threshold_kw:
            results.append(
                Recommendation(
                    title=f"Investigate anomaly in {room.room_id}",
                    description=f"Power consumption is {room.current_power_kw} kW, above the configured anomaly threshold.",
                    priority=Priority.CRITICAL,
                    confidence=91,
                    estimated_saving=self._saving(300, 900),
                    category="Anomaly",
                    room_id=room.room_id,
                )
            )

        if room.occupancy_count >= 16:
            results.append(
                Recommendation(
                    title=f"Balance occupancy load from {room.room_id}",
                    description="Room occupancy is close to capacity and may create local cooling and plug-load spikes.",
                    priority=Priority.MEDIUM,
                    confidence=82,
                    estimated_saving=self._saving(120, 360),
                    category="Load Management",
                    room_id=room.room_id,
                )
            )

        return results

    def _saving(self, minimum: int, maximum: int) -> str:
        amount = random.randint(minimum, maximum)
        return f"{self._settings.currency_symbol}{amount}/day"

    def _priority_rank(self, priority: Priority) -> int:
        return {
            Priority.CRITICAL: 4,
            Priority.HIGH: 3,
            Priority.MEDIUM: 2,
            Priority.LOW: 1,
        }[priority]
