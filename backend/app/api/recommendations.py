from fastapi import APIRouter, Depends

from app.api.dependencies import get_recommendation_service, get_sensor_service
from app.schemas.energy import Recommendation
from app.services.recommendation_service import RecommendationService
from app.services.sensor_service import SensorService

router = APIRouter(tags=["recommendations"])


@router.get("/recommendations", response_model=list[Recommendation])
async def list_recommendations(
    sensor_service: SensorService = Depends(get_sensor_service),
    recommendation_service: RecommendationService = Depends(get_recommendation_service),
) -> list[Recommendation]:
    rooms = await sensor_service.list_rooms()
    return recommendation_service.generate(rooms)
