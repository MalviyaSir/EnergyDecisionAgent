from app.schemas.energy import AnalyticsSummary, Dashboard, Room
from app.services.recommendation_service import RecommendationService
from app.utils.settings import Settings


class AnalyticsService:
    def __init__(self, settings: Settings, recommendation_service: RecommendationService) -> None:
        self._settings = settings
        self._recommendation_service = recommendation_service

    def dashboard(self, rooms: list[Room]) -> Dashboard:
        total_power = sum(room.current_power_kw for room in rooms)
        daily_energy = sum(room.daily_energy_kwh for room in rooms)
        monthly_energy = sum(room.monthly_energy_kwh for room in rooms)
        occupied_rooms = sum(1 for room in rooms if room.occupied)
        occupancy_percentage = (occupied_rooms / len(rooms)) * 100 if rooms else 0
        active_alerts = self._recommendation_service.active_alert_count(rooms)
        energy_score = self._energy_score(rooms, active_alerts)

        return Dashboard(
            current_consumption=round(total_power, 2),
            predicted_today_bill=round(daily_energy * self._settings.tariff_per_kwh, 2),
            predicted_month_bill=round(monthly_energy * self._settings.tariff_per_kwh, 2),
            occupancy_percentage=round(occupancy_percentage, 2),
            carbon_emission=round(daily_energy * self._settings.carbon_kg_per_kwh, 2),
            energy_score=energy_score,
            active_alerts=active_alerts,
        )

    def summary(self, rooms: list[Room]) -> AnalyticsSummary:
        occupied_rooms = sum(1 for room in rooms if room.occupied)
        peak_room = max(rooms, key=lambda room: room.current_power_kw)

        return AnalyticsSummary(
            total_rooms=len(rooms),
            occupied_rooms=occupied_rooms,
            average_temperature_c=round(sum(room.temperature_c for room in rooms) / len(rooms), 2),
            average_humidity_percent=round(sum(room.humidity_percent for room in rooms) / len(rooms), 2),
            peak_power_room_id=peak_room.room_id,
            peak_power_kw=peak_room.current_power_kw,
        )

    def _energy_score(self, rooms: list[Room], active_alerts: int) -> int:
        idle_ac_count = sum(1 for room in rooms if not room.occupied and room.ac_status.value == "ON")
        idle_light_count = sum(1 for room in rooms if not room.occupied and room.light_status.value == "ON")
        average_power = sum(room.current_power_kw for room in rooms) / len(rooms)
        score = 100 - active_alerts * 3 - idle_ac_count * 2 - idle_light_count - max(0, average_power - 4.5) * 5
        return int(max(35, min(98, round(score))))
