from fastapi import Request

from app.services.ai_service import AIService
from app.services.analytics_service import AnalyticsService
from app.services.health_service import HealthService
from app.services.recommendation_service import RecommendationService
from app.services.sensor_service import SensorService
from app.services.simulation_service import SimulationService


def get_sensor_service(request: Request) -> SensorService:
    return request.app.state.sensor_service


def get_recommendation_service(request: Request) -> RecommendationService:
    return request.app.state.recommendation_service


def get_analytics_service(request: Request) -> AnalyticsService:
    return request.app.state.analytics_service


def get_health_service(request: Request) -> HealthService:
    return request.app.state.health_service


def get_simulation_service(request: Request) -> SimulationService:
    return request.app.state.simulation_service


def get_ai_service(request: Request) -> AIService:
    return request.app.state.ai_service
