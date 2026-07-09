from app.schemas.energy import AnalyticsSummary, Dashboard, Room
from app.services.health_service import HealthService
from app.services.recommendation_service import RecommendationService
from app.utils.calculations import inr_per_day, inr_per_month, parse_money_amount
from app.utils.settings import Settings


class AnalyticsService:
    def __init__(
        self,
        settings: Settings,
        recommendation_service: RecommendationService,
        health_service: HealthService,
    ) -> None:
        self._settings = settings
        self._recommendation_service = recommendation_service
        self._health_service = health_service

    def dashboard(self, rooms: list[Room]) -> Dashboard:
        total_power = sum(room.current_power_kw for room in rooms)
        daily_energy = sum(room.daily_energy_kwh for room in rooms)
        monthly_energy = sum(room.monthly_energy_kwh for room in rooms)
        occupied_rooms = sum(1 for room in rooms if room.occupied)
        occupancy_percentage = (occupied_rooms / len(rooms)) * 100 if rooms else 0
        recommendations = self._recommendation_service.generate(rooms)
        active_alerts = self._recommendation_service.active_alert_count(rooms)
        building_health_score, building_health_status = self._health_service.building_health(rooms, recommendations)
        efficiency_score, efficiency_status = self._health_service.energy_efficiency(rooms, recommendations)
        estimated_daily_saving = sum(parse_money_amount(item.estimated_daily_saving) for item in recommendations)

        return Dashboard(
            current_consumption=round(total_power, 2),
            predicted_today_bill=round(daily_energy * self._settings.tariff_per_kwh, 2),
            predicted_month_bill=round(monthly_energy * self._settings.tariff_per_kwh, 2),
            occupancy_percentage=round(occupancy_percentage, 2),
            carbon_emission=round(daily_energy * self._settings.carbon_kg_per_kwh, 2),
            energy_score=efficiency_score,
            active_alerts=active_alerts,
            building_health_score=building_health_score,
            building_health_status=building_health_status,
            energy_efficiency_score=efficiency_score,
            energy_efficiency_status=efficiency_status,
            critical_alerts=sum(1 for item in recommendations if item.priority.value == "Critical"),
            high_priority_actions=sum(1 for item in recommendations if item.priority.value == "High"),
            estimated_today_saving=inr_per_day(estimated_daily_saving, self._settings),
            estimated_monthly_saving=inr_per_month(estimated_daily_saving * 30, self._settings),
            active_anomalies=sum(1 for item in recommendations if item.category == "Anomaly"),
        )

    def summary(self, rooms: list[Room]) -> AnalyticsSummary:
        occupied_rooms = sum(1 for room in rooms if room.occupied)
        peak_room = max(rooms, key=lambda room: room.current_power_kw)
        recommendations = self._recommendation_service.generate(rooms)
        building_health_score, building_health_status = self._health_service.building_health(rooms, recommendations)
        efficiency_score, efficiency_status = self._health_service.energy_efficiency(rooms, recommendations)

        return AnalyticsSummary(
            total_rooms=len(rooms),
            occupied_rooms=occupied_rooms,
            average_temperature_c=round(sum(room.temperature_c for room in rooms) / len(rooms), 2),
            average_humidity_percent=round(sum(room.humidity_percent for room in rooms) / len(rooms), 2),
            peak_power_room_id=peak_room.room_id,
            peak_power_kw=peak_room.current_power_kw,
            building_health_score=building_health_score,
            building_health_status=building_health_status,
            energy_efficiency_score=efficiency_score,
            energy_efficiency_status=efficiency_status,
        )
