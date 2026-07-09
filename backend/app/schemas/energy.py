from enum import StrEnum

from pydantic import BaseModel, Field


class DeviceStatus(StrEnum):
    ON = "ON"
    OFF = "OFF"


class Priority(StrEnum):
    CRITICAL = "Critical"
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"


class Room(BaseModel):
    room_id: str
    floor: int
    occupied: bool
    occupancy_count: int = Field(ge=0)
    ac_status: DeviceStatus
    light_status: DeviceStatus
    fan_status: DeviceStatus
    temperature_c: float
    humidity_percent: float
    current_power_kw: float
    daily_energy_kwh: float
    monthly_energy_kwh: float
    updated_at: str


class Dashboard(BaseModel):
    current_consumption: float
    predicted_today_bill: float
    predicted_month_bill: float
    occupancy_percentage: float
    carbon_emission: float
    energy_score: int
    active_alerts: int


class Recommendation(BaseModel):
    title: str
    description: str
    priority: Priority
    confidence: int = Field(ge=0, le=100)
    estimated_saving: str
    category: str
    room_id: str | None = None


class AnalyticsSummary(BaseModel):
    total_rooms: int
    occupied_rooms: int
    average_temperature_c: float
    average_humidity_percent: float
    peak_power_room_id: str
    peak_power_kw: float


class SimulationRequest(BaseModel):
    turn_off_idle_ac: bool = True
    turn_off_idle_lights: bool = True
    ac_setpoint_c: int = Field(default=24, ge=18, le=30)


class SimulationResult(BaseModel):
    estimated_daily_saving_inr: float
    estimated_monthly_saving_inr: float
    actions_considered: list[str]


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=1000)


class ChatResponse(BaseModel):
    answer: str
    suggested_actions: list[str]
