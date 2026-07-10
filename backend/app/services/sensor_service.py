import asyncio
import random
from datetime import UTC, datetime

from app.schemas.energy import DeviceStatus, Room
from app.utils.settings import Settings


class SensorService:
    """In-memory live sensor store for the current no-database phase."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._rooms: dict[str, Room] = {}
        self._lock = asyncio.Lock()
        self._task: asyncio.Task[None] | None = None
        self._rng = random.Random(42)
        self._generate_initial_rooms()

    async def start(self) -> None:
        if self._task is None or self._task.done():
            self._task = asyncio.create_task(self._refresh_loop())

    async def stop(self) -> None:
        if self._task is None:
            return

        self._task.cancel()
        try:
            await self._task
        except asyncio.CancelledError:
            pass

    async def list_rooms(self) -> list[Room]:
        async with self._lock:
            return list(self._rooms.values())

    async def get_room(self, room_id: str) -> Room | None:
        async with self._lock:
            return self._rooms.get(room_id)

    async def _refresh_loop(self) -> None:
        while True:
            await asyncio.sleep(self._settings.sensor_refresh_seconds)
            await self.refresh_sensor_values()

    async def refresh_sensor_values(self) -> None:
        async with self._lock:
            self._rooms = {
                room_id: self._next_room_reading(room)
                for room_id, room in self._rooms.items()
            }

    def _generate_initial_rooms(self) -> None:
        for index in range(1, self._settings.room_count + 1):
            floor = ((index - 1) // 20) + 1
            room_id = f"R{floor}-{index:03d}"
            occupied = self._rng.random() < 0.68
            occupancy_count = self._rng.randint(1, 12) if occupied else 0
            temperature = self._rng.uniform(21.5, 37.5)
            humidity = self._rng.uniform(38, 78)
            ac_status = DeviceStatus.ON if occupied and temperature > 24 else self._random_status(0.18)
            light_status = DeviceStatus.ON if occupied else self._random_status(0.22)
            fan_status = DeviceStatus.ON if occupied and temperature > 25 else self._random_status(0.12)
            power = self._calculate_power(ac_status, light_status, fan_status, temperature, occupancy_count)
            daily_energy = power * self._rng.uniform(7.5, 13.5)

            self._rooms[room_id] = Room(
                room_id=room_id,
                floor=floor,
                occupied=occupied,
                occupancy_count=occupancy_count,
                occupancy_state_minutes=self._rng.randint(4, 95),
                ac_status=ac_status,
                light_status=light_status,
                fan_status=fan_status,
                temperature_c=round(temperature, 1),
                humidity_percent=round(humidity, 1),
                current_power_kw=round(power, 2),
                daily_energy_kwh=round(daily_energy, 2),
                monthly_energy_kwh=round(daily_energy * self._rng.uniform(24, 31), 2),
                updated_at=self._timestamp(),
            )

    def _next_room_reading(self, room: Room) -> Room:
        occupied = self._next_occupancy(room)
        occupancy_count = self._next_occupancy_count(room, occupied)
        occupancy_state_minutes = (
            room.occupancy_state_minutes + max(1, round(self._settings.sensor_refresh_seconds / 60))
            if occupied == room.occupied
            else 0
        )
        temperature = max(18.0, min(40.5, room.temperature_c + self._rng.uniform(-0.7, 0.8)))
        humidity = max(28.0, min(88.0, room.humidity_percent + self._rng.uniform(-1.8, 1.8)))
        ac_status = self._next_device_status(room.ac_status, occupied, temperature, 0.08)
        light_status = self._next_device_status(room.light_status, occupied, temperature, 0.05)
        fan_status = self._next_device_status(room.fan_status, occupied, temperature, 0.07)
        power = self._calculate_power(ac_status, light_status, fan_status, temperature, occupancy_count)
        daily_increment = power * (self._settings.sensor_refresh_seconds / 3600)

        return room.model_copy(
            update={
                "occupied": occupied,
                "occupancy_count": occupancy_count,
                "occupancy_state_minutes": occupancy_state_minutes,
                "ac_status": ac_status,
                "light_status": light_status,
                "fan_status": fan_status,
                "temperature_c": round(temperature, 1),
                "humidity_percent": round(humidity, 1),
                "current_power_kw": round(power, 2),
                "daily_energy_kwh": round(room.daily_energy_kwh + daily_increment, 2),
                "monthly_energy_kwh": round(room.monthly_energy_kwh + daily_increment, 2),
                "updated_at": self._timestamp(),
            }
        )

    def _next_occupancy(self, room: Room) -> bool:
        if room.occupied:
            return self._rng.random() > 0.06
        return self._rng.random() < 0.09

    def _next_occupancy_count(self, room: Room, occupied: bool) -> int:
        if not occupied:
            return 0

        base = room.occupancy_count if room.occupancy_count > 0 else self._rng.randint(1, 5)
        return max(1, min(18, base + self._rng.choice([-1, 0, 0, 1, 2])))

    def _next_device_status(
        self,
        current: DeviceStatus,
        occupied: bool,
        temperature: float,
        change_probability: float,
    ) -> DeviceStatus:
        if occupied and temperature >= 27 and current == DeviceStatus.OFF:
            return DeviceStatus.ON if self._rng.random() < 0.72 else DeviceStatus.OFF

        if not occupied and current == DeviceStatus.ON:
            return DeviceStatus.OFF if self._rng.random() < 0.38 else DeviceStatus.ON

        if self._rng.random() < change_probability:
            return DeviceStatus.OFF if current == DeviceStatus.ON else DeviceStatus.ON

        return current

    def _calculate_power(
        self,
        ac_status: DeviceStatus,
        light_status: DeviceStatus,
        fan_status: DeviceStatus,
        temperature: float,
        occupancy_count: int,
    ) -> float:
        ac_load = self._rng.uniform(2.2, 5.4) if ac_status == DeviceStatus.ON else 0
        light_load = self._rng.uniform(0.25, 0.9) if light_status == DeviceStatus.ON else 0
        fan_load = self._rng.uniform(0.12, 0.45) if fan_status == DeviceStatus.ON else 0
        plug_load = self._rng.uniform(0.2, 1.1) + occupancy_count * self._rng.uniform(0.04, 0.12)
        heat_penalty = max(0, temperature - 34) * 0.18
        return max(0.08, ac_load + light_load + fan_load + plug_load + heat_penalty)

    def _random_status(self, on_probability: float) -> DeviceStatus:
        return DeviceStatus.ON if self._rng.random() < on_probability else DeviceStatus.OFF

    def _timestamp(self) -> str:
        return datetime.now(UTC).isoformat()
