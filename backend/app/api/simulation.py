from fastapi import APIRouter, Depends

from app.api.dependencies import get_sensor_service, get_simulation_service
from app.schemas.energy import SimulationRequest, SimulationResult
from app.services.sensor_service import SensorService
from app.services.simulation_service import SimulationService

router = APIRouter(tags=["simulation"])


@router.post("/simulation", response_model=SimulationResult)
async def run_simulation(
    request: SimulationRequest,
    sensor_service: SensorService = Depends(get_sensor_service),
    simulation_service: SimulationService = Depends(get_simulation_service),
) -> SimulationResult:
    rooms = await sensor_service.list_rooms()
    return simulation_service.simulate(rooms, request)
