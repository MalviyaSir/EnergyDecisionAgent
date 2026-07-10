from fastapi import APIRouter, Depends

from app.api.dependencies import (
    get_ai_service,
    get_analytics_service,
    get_recommendation_service,
    get_sensor_service,
)
from app.schemas.energy import ChatRequest, ChatResponse
from app.services.ai_service import AIService
from app.services.analytics_service import AnalyticsService
from app.services.recommendation_service import RecommendationService
from app.services.sensor_service import SensorService

router = APIRouter(tags=["chat"])


@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    sensor_service: SensorService = Depends(get_sensor_service),
    recommendation_service: RecommendationService = Depends(get_recommendation_service),
    analytics_service: AnalyticsService = Depends(get_analytics_service),
    ai_service: AIService = Depends(get_ai_service),
) -> ChatResponse:
    """AI Building Energy Consultant endpoint.

    Analyzes building using current telemetry and recommendations.
    Uses goal-based prioritization and grounded analysis.

    Backward compatible with existing clients.
    """
    # Get current building state
    rooms = await sensor_service.list_rooms()
    recommendations = recommendation_service.generate(rooms)
    dashboard = analytics_service.dashboard(rooms)

    # Use the new grounded analysis with building context
    return ai_service.answer_with_context(
        message=request.message,
        rooms=rooms,
        dashboard=dashboard,
        recommendations=recommendations,
    )
