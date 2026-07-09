from functools import lru_cache

from pydantic import BaseModel


class Settings(BaseModel):
    app_name: str = "EnerMind AI"
    cors_origins: list[str] = ["*"]
    room_count: int = 100
    sensor_refresh_seconds: int = 5
    currency_symbol: str = "₹"
    tariff_per_kwh: float = 8.25
    carbon_kg_per_kwh: float = 0.72
    high_power_threshold_kw: float = 7.5


@lru_cache
def get_settings() -> Settings:
    return Settings()
