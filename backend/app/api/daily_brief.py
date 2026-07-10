from fastapi import APIRouter, Depends

from app.api.dependencies import (
    get_analytics_service,
    get_sensor_service,
    get_ai_service,
)
from app.schemas.energy import DailyEnergyBrief
from app.services.ai_service import AIService
from app.services.analytics_service import AnalyticsService
from app.services.daily_brief_service import DailyBriefService
from app.services.sensor_service import SensorService
from app.utils.settings import get_settings

router = APIRouter(tags=["daily-brief"])


@router.get("/daily-brief", response_model=DailyEnergyBrief)
async def get_daily_brief(
    sensor_service: SensorService = Depends(get_sensor_service),
    analytics_service: AnalyticsService = Depends(get_analytics_service),
    ai_service: AIService = Depends(get_ai_service),
) -> DailyEnergyBrief:
    """
    Generate AI-powered daily energy brief.
    
    Returns a comprehensive briefing including:
    - Building health and energy efficiency status
    - Today's forecast and peak load prediction
    - Financial projections (daily and monthly bill)
    - Environmental impact (carbon reduction)
    - Critical alerts and top risks
    - Prioritized recommendations and actions
    - Executive summary with facility manager insights
    
    Uses OpenAI for professional explanations when available,
    automatically falls back to rule-based generation.
    """
    # Gather all required data
    rooms = await sensor_service.list_rooms()
    dashboard = analytics_service.dashboard(rooms)
    recommendations = analytics_service.recommendations(rooms)
    
    # Placeholder for alerts and anomalies (would come from monitoring system)
    alerts = analytics_service.extract_alerts(rooms, dashboard)
    anomalies = analytics_service.extract_anomalies(rooms, dashboard)
    
    # Generate brief
    settings = get_settings()
    brief_service = DailyBriefService(settings, ai_service)
    
    brief = brief_service.generate_brief(
        dashboard=dashboard,
        rooms=rooms,
        recommendations=recommendations,
        alerts=alerts,
        anomalies=anomalies,
    )
    
    return brief
