from app.schemas.energy import DeviceStatus, Room, SimulationRequest, SimulationResult
from app.utils.settings import Settings


class SimulationService:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    def simulate(self, rooms: list[Room], request: SimulationRequest) -> SimulationResult:
        daily_saving_kwh = 0.0
        actions: list[str] = []

        if request.turn_off_idle_ac:
            idle_ac_rooms = [room for room in rooms if not room.occupied and room.ac_status == DeviceStatus.ON]
            daily_saving_kwh += len(idle_ac_rooms) * 9.5
            actions.append(f"Turn off idle AC in {len(idle_ac_rooms)} rooms")

        if request.turn_off_idle_lights:
            idle_light_rooms = [room for room in rooms if not room.occupied and room.light_status == DeviceStatus.ON]
            daily_saving_kwh += len(idle_light_rooms) * 1.8
            actions.append(f"Turn off idle lights in {len(idle_light_rooms)} rooms")

        hot_rooms = [room for room in rooms if room.temperature_c > 35]
        daily_saving_kwh += len(hot_rooms) * max(0, 26 - request.ac_setpoint_c) * 0.8
        actions.append(f"Apply {request.ac_setpoint_c}°C AC target to {len(hot_rooms)} hot rooms")

        daily_saving_inr = daily_saving_kwh * self._settings.tariff_per_kwh
        return SimulationResult(
            estimated_daily_saving_inr=round(daily_saving_inr, 2),
            estimated_monthly_saving_inr=round(daily_saving_inr * 30, 2),
            actions_considered=actions,
        )
