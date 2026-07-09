from fastapi import APIRouter, Depends

from app.api.dependencies import get_analytics_service, get_sensor_service
from app.schemas.energy import AnalyticsSummary
from app.services.analytics_service import AnalyticsService
from app.services.sensor_service import SensorService

router = APIRouter(tags=["analytics"])


@router.get("/analytics", response_model=AnalyticsSummary)
async def get_analytics(
    sensor_service: SensorService = Depends(get_sensor_service),
    analytics_service: AnalyticsService = Depends(get_analytics_service),
) -> AnalyticsSummary:
    rooms = await sensor_service.list_rooms()
    return analytics_service.summary(rooms)
