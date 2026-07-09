from functools import lru_cache
import os

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

    # OpenAI integration (read from environment variables; do not hardcode keys)
    openai_api_key: str | None = None
    openai_model: str = "gpt-4o-mini"


@lru_cache
def get_settings() -> Settings:
    # Pull secrets from env at runtime.
    # Note: pydantic BaseModel defaults keep backward compatibility.
    return Settings(
        openai_api_key=os.getenv("OPENAI_API_KEY"),
        openai_model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
    )
