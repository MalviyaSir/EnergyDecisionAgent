from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import analytics, chat, daily_brief, dashboard, recommendations, rooms, simulation
from app.services.ai_service import AIService
from app.services.analytics_service import AnalyticsService
from app.services.health_service import HealthService
from app.services.recommendation_service import RecommendationService
from app.services.sensor_service import SensorService
from app.services.simulation_service import SimulationService
from app.utils.settings import get_settings


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()
    sensor_service = SensorService(settings)
    recommendation_service = RecommendationService(settings)
    health_service = HealthService()

    app.state.sensor_service = sensor_service
    app.state.recommendation_service = recommendation_service
    app.state.health_service = health_service
    app.state.analytics_service = AnalyticsService(settings, recommendation_service, health_service)
    app.state.simulation_service = SimulationService(settings)
    app.state.ai_service = AIService()

    await sensor_service.start()
    try:
        yield
    finally:
        await sensor_service.stop()


settings = get_settings()

app = FastAPI(
    title="EnerMind AI",
    description="AI-powered Smart Energy Optimization REST API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboard.router)
app.include_router(rooms.router)
app.include_router(recommendations.router)
app.include_router(analytics.router)
app.include_router(simulation.router)
app.include_router(chat.router)
app.include_router(daily_brief.router)


@app.get("/health", tags=["health"])
async def health() -> dict[str, str]:
    return {"status": "ok", "service": settings.app_name}
