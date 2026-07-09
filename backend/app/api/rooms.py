from fastapi import APIRouter, Depends, HTTPException, status

from app.api.dependencies import get_sensor_service
from app.schemas.energy import Room
from app.services.sensor_service import SensorService

router = APIRouter(tags=["rooms"])


@router.get("/rooms", response_model=list[Room])
async def list_rooms(sensor_service: SensorService = Depends(get_sensor_service)) -> list[Room]:
    return await sensor_service.list_rooms()


@router.get("/rooms/{room_id}", response_model=Room)
async def get_room(room_id: str, sensor_service: SensorService = Depends(get_sensor_service)) -> Room:
    room = await sensor_service.get_room(room_id)

    if room is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Room '{room_id}' was not found.",
        )

    return room
