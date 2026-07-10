from app.schemas.energy import Priority, Room
from app.utils.settings import Settings


def inr_per_day(amount: float, settings: Settings) -> str:
    return f"{settings.currency_symbol}{round(amount):,}/day"


def inr_per_month(amount: float, settings: Settings) -> str:
    return f"{settings.currency_symbol}{round(amount):,}/month"


def carbon_reduction_text(daily_kwh: float, settings: Settings) -> str:
    daily_kg = daily_kwh * settings.carbon_kg_per_kwh
    monthly_kg = daily_kg * 30
    return f"{daily_kg:.1f} kg CO₂/day, {monthly_kg:.0f} kg CO₂/month"


def estimate_daily_saving_kwh(room: Room, category: str) -> float:
    """Estimate savings using the current room state and rule category."""
    if category == "HVAC":
        base = min(max(room.current_power_kw * 0.55, 1.2), 5.8)
        return base * 4.5

    if category == "Lighting":
        return min(max(room.current_power_kw * 0.18, 0.35), 1.4) * 6

    if category == "Anomaly":
        excess_kw = max(0, room.current_power_kw - 4.5)
        return min(max(excess_kw * 5.5, 2.8), 18)

    if category == "Load Management":
        return min(max(room.current_power_kw * 0.22, 0.7), 2.4) * 4

    return min(max(room.current_power_kw * 0.1, 0.2), 1.0) * 3


def saving_inr_from_kwh(daily_kwh: float, settings: Settings) -> float:
    return daily_kwh * settings.tariff_per_kwh


def priority_score(priority: Priority, confidence: int, daily_saving_inr: float, anomaly_factor: int = 0) -> int:
    base = {
        Priority.CRITICAL: 88,
        Priority.HIGH: 75,
        Priority.MEDIUM: 60,
        Priority.LOW: 42,
    }[priority]
    saving_bonus = min(10, int(daily_saving_inr / 150))
    confidence_bonus = max(0, int((confidence - 85) / 3))
    return min(100, base + saving_bonus + confidence_bonus + anomaly_factor)


def priority_rank(priority: Priority) -> int:
    return {
        Priority.CRITICAL: 4,
        Priority.HIGH: 3,
        Priority.MEDIUM: 2,
        Priority.LOW: 1,
    }[priority]


def parse_money_amount(value: str) -> int:
    digits = "".join(character for character in value if character.isdigit())
    return int(digits or 0)
