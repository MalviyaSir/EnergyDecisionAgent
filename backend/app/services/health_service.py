from app.schemas.energy import DeviceStatus, Recommendation, Room
from app.utils.calculations import priority_rank


class HealthService:
    """Reusable scoring service for building and energy health."""

    def building_health(self, rooms: list[Room], recommendations: list[Recommendation]) -> tuple[int, str]:
        average_power = self._average_power(rooms)
        occupancy_efficiency = self._occupancy_efficiency(rooms)
        hvac_efficiency = self._idle_device_efficiency(rooms, "ac_status")
        lighting_efficiency = self._idle_device_efficiency(rooms, "light_status")
        anomaly_penalty = sum(1 for item in recommendations if item.category == "Anomaly") * 4
        pending_penalty = min(18, len(recommendations) // 3)
        consumption_penalty = max(0, average_power - 3.6) * 4

        score = (
            occupancy_efficiency * 0.28
            + hvac_efficiency * 0.24
            + lighting_efficiency * 0.18
            + max(0, 100 - consumption_penalty) * 0.18
            + max(0, 100 - anomaly_penalty - pending_penalty) * 0.12
        )
        normalized = int(max(0, min(100, round(score))))
        return normalized, self._building_label(normalized)

    def energy_efficiency(self, rooms: list[Room], recommendations: list[Recommendation]) -> tuple[int, str]:
        average_power = self._average_power(rooms)
        idle_ac = sum(1 for room in rooms if not room.occupied and room.ac_status == DeviceStatus.ON)
        idle_lights = sum(1 for room in rooms if not room.occupied and room.light_status == DeviceStatus.ON)
        critical_actions = sum(1 for item in recommendations if priority_rank(item.priority) >= 4)
        hot_rooms = sum(1 for room in rooms if room.temperature_c > 35)

        score = 100 - average_power * 3.5 - idle_ac * 2.2 - idle_lights * 1.3 - critical_actions * 3.5 - hot_rooms * 1.5
        normalized = int(max(0, min(100, round(score))))
        return normalized, self._efficiency_label(normalized)

    def _average_power(self, rooms: list[Room]) -> float:
        if not rooms:
            return 0
        return sum(room.current_power_kw for room in rooms) / len(rooms)

    def _occupancy_efficiency(self, rooms: list[Room]) -> float:
        if not rooms:
            return 100

        occupied_rooms = sum(1 for room in rooms if room.occupied)
        powered_empty_rooms = sum(
            1
            for room in rooms
            if not room.occupied and (room.ac_status == DeviceStatus.ON or room.light_status == DeviceStatus.ON)
        )
        occupied_ratio = occupied_rooms / len(rooms)
        waste_ratio = powered_empty_rooms / len(rooms)
        return max(0, min(100, 70 + occupied_ratio * 25 - waste_ratio * 45))

    def _idle_device_efficiency(self, rooms: list[Room], field_name: str) -> float:
        empty_rooms = [room for room in rooms if not room.occupied]
        if not empty_rooms:
            return 100

        idle_on = sum(1 for room in empty_rooms if getattr(room, field_name) == DeviceStatus.ON)
        return max(0, 100 - (idle_on / len(empty_rooms)) * 100)

    def _building_label(self, score: int) -> str:
        if score >= 90:
            return "Excellent"
        if score >= 75:
            return "Good"
        if score >= 55:
            return "Average"
        if score >= 35:
            return "Poor"
        return "Critical"

    def _efficiency_label(self, score: int) -> str:
        if score >= 85:
            return "Excellent"
        if score >= 68:
            return "Good"
        return "Needs Improvement"
