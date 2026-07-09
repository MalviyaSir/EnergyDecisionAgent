from fastapi import APIRouter, Depends

from app.api.dependencies import get_ai_service, get_recommendation_service, get_sensor_service
from app.schemas.energy import ChatRequest, ChatResponse
from app.services.ai_service import AIService
from app.services.recommendation_service import RecommendationService
from app.services.sensor_service import SensorService

router = APIRouter(tags=["chat"])


@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    sensor_service: SensorService = Depends(get_sensor_service),
    recommendation_service: RecommendationService = Depends(get_recommendation_service),
    ai_service: AIService = Depends(get_ai_service),
) -> ChatResponse:
    rooms = await sensor_service.list_rooms()
    recommendations = recommendation_service.generate(rooms)
    return ai_service.answer(request.message, recommendations)
