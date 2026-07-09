from fastapi import APIRouter, Depends

from app.api.dependencies import get_analytics_service, get_sensor_service
from app.schemas.energy import Dashboard
from app.services.analytics_service import AnalyticsService
from app.services.sensor_service import SensorService

router = APIRouter(tags=["dashboard"])


@router.get("/dashboard", response_model=Dashboard)
async def get_dashboard(
    sensor_service: SensorService = Depends(get_sensor_service),
    analytics_service: AnalyticsService = Depends(get_analytics_service),
) -> Dashboard:
    rooms = await sensor_service.list_rooms()
    return analytics_service.dashboard(rooms)
