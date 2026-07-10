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
    occupancy_state_minutes: int = Field(ge=0)
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
    building_health_score: int
    building_health_status: str
    energy_efficiency_score: int
    energy_efficiency_status: str
    critical_alerts: int
    high_priority_actions: int
    estimated_today_saving: str
    estimated_monthly_saving: str
    active_anomalies: int


class AnomalyExplanation(BaseModel):
    root_cause: str
    severity: Priority
    probability: int = Field(ge=0, le=100)
    recommended_resolution: str


class Recommendation(BaseModel):
    id: str
    title: str
    category: str
    priority: Priority
    reason: str
    evidence: list[str]
    confidence: int = Field(ge=0, le=100)
    estimated_daily_saving: str
    estimated_monthly_saving: str
    estimated_carbon_reduction: str
    urgency: Priority
    business_impact: str
    recommended_action: str
    affected_rooms: list[str]
    generated_at: str
    status: str = "Open"
    priority_score: int = Field(ge=0, le=100)
    ai_explanation: str
    anomaly: AnomalyExplanation | None = None
    # Backward-compatible fields retained for existing clients.
    description: str
    estimated_saving: str
    room_id: str | None = None


class AnalyticsSummary(BaseModel):
    total_rooms: int
    occupied_rooms: int
    average_temperature_c: float
    average_humidity_percent: float
    peak_power_room_id: str
    peak_power_kw: float
    building_health_score: int
    building_health_status: str
    energy_efficiency_score: int
    energy_efficiency_status: str


class SimulationRequest(BaseModel):
    # Legacy parameters (backward compatibility)
    turn_off_idle_ac: bool = True
    turn_off_idle_lights: bool = True
    ac_setpoint_c: int = Field(default=24, ge=18, le=30)
    
    # New What-if parameters
    lighting_schedule_percent: int = Field(default=100, ge=0, le=100)
    occupancy_percent: int = Field(default=100, ge=0, le=100)
    working_hours_start: int = Field(default=9, ge=0, le=23)
    working_hours_end: int = Field(default=17, ge=0, le=23)
    electricity_tariff_per_kwh: float = Field(default=8.5, ge=1, le=20)
    solar_capacity_kw: float = Field(default=0, ge=0, le=500)
    battery_capacity_kwh: float = Field(default=0, ge=0, le=1000)
    ev_charging_load_kw: float = Field(default=0, ge=0, le=100)


class WhatIfComparison(BaseModel):
    metric: str
    current_value: float | str
    proposed_value: float | str
    improvement_percent: float
    unit: str


class WhatIfAnalysis(BaseModel):
    executive_summary: str
    benefits: list[str]
    trade_offs: list[str]
    risks: list[str]
    recommendations: list[str]
    confidence_score: int = Field(ge=0, le=100)


class SimulationResult(BaseModel):
    # Current state metrics
    current_energy_usage_kwh: float
    current_monthly_bill_inr: float
    current_comfort_score: int = Field(ge=0, le=100)
    current_efficiency_score: int = Field(ge=0, le=100)
    current_health_score: int = Field(ge=0, le=100)
    
    # Proposed state metrics
    predicted_energy_usage_kwh: float
    predicted_monthly_bill_inr: float
    predicted_comfort_score: int = Field(ge=0, le=100)
    predicted_efficiency_score: int = Field(ge=0, le=100)
    predicted_health_score: int = Field(ge=0, le=100)
    
    # Impact metrics
    monthly_savings_inr: float
    annual_savings_inr: float
    carbon_reduction_kg_co2: float
    energy_efficiency_improvement_percent: float
    building_health_improvement_percent: float
    peak_load_reduction_kw: float
    roi_percent: float
    
    # Additional metrics
    peak_load_reduction_percent: float
    daily_savings_inr: float
    
    # AI Analysis
    analysis: WhatIfAnalysis
    
    # Comparison data
    comparisons: list[WhatIfComparison]
    
    # Actions considered
    actions_considered: list[str]
    
    # Backward-compatible fields (existing clients)
    estimated_daily_saving_inr: float
    estimated_monthly_saving_inr: float


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=1000)


class StrategyAction(BaseModel):
    priority: int
    title: str
    rationale: str
    why: str
    expected_savings: str
    expected_carbon_reduction: str
    timeline: str
    difficulty: str
    business_impact: str
    confidence: int = Field(ge=0, le=100)


class EnergyStrategyPlan(BaseModel):
    current_status: str
    target_goal: str
    optimization_strategy: str
    prioritized_action_plan: list[StrategyAction]
    expected_savings: str
    expected_carbon_reduction: str
    expected_timeline: str
    roi: str
    difficulty: str
    priority: str
    confidence: int = Field(ge=0, le=100)


class ChatResponse(BaseModel):
    # Backward-compatible fields (existing clients depend on these)
    answer: str
    suggested_actions: list[str]

    # AI Building Energy Consultant response (required by updated product spec)
    summary: str
    root_cause: str
    key_findings: list[str]
    top_recommendations: list[str]
    estimated_savings: str
    carbon_reduction: str
    business_impact: str
    priority: str
    confidence: int = Field(ge=0, le=100)
    next_best_action: str

    # Energy strategy planner output (additional fields for existing clients)
    current_status: str | None = None
    target_goal: str | None = None
    optimization_strategy: str | None = None
    prioritized_action_plan: list[StrategyAction] | None = None
    expected_savings: str | None = None
    expected_carbon_reduction: str | None = None
    expected_timeline: str | None = None
    roi: str | None = None
    difficulty: str | None = None


class DailyEnergyBrief(BaseModel):
    # Greeting and timing
    good_morning_message: str
    date: str
    generation_time: str
    
    # Building status overview
    overall_building_health: str
    building_health_score: int = Field(ge=0, le=100)
    building_health_trend: str
    
    # Energy metrics
    energy_efficiency: str
    energy_efficiency_score: int = Field(ge=0, le=100)
    today_forecast: str
    
    # Financial metrics
    predicted_electricity_bill_today: str
    predicted_electricity_bill_month: str
    estimated_daily_saving: str
    estimated_monthly_saving: str
    
    # Peak and anomalies
    predicted_peak_hour: str
    peak_load_kw: float
    
    # Environmental impact
    carbon_reduction_today: str
    carbon_reduction_month: str
    
    # Alerts and risks
    critical_alerts: list[str]
    top_risks: list[str]
    equipment_requiring_attention: list[str]
    
    # Recommendations
    top_recommendations: list[str]
    priority_actions: list[str]
    
    # Analysis
    executive_summary: str
    facility_manager_insights: str
    
    # Data quality
    confidence_score: int = Field(ge=0, le=100)
    data_freshness_minutes: int

