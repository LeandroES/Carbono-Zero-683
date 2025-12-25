# app/api/routers/sessions.py

from fastapi import APIRouter, HTTPException
from beanie import PydanticObjectId
from ...models.models import Class, SensorReading
from .sensor_control import sensor_manager
from datetime import datetime

router = APIRouter()

# Variable global para simular el estado del sensor
# En un sistema real, esto podría estar en una base de datos más rápida como Redis.
active_session_info = {"active_session_id": "baseline_main"}


@router.post("/start/{class_id}")
async def start_session(class_id: PydanticObjectId):
    """
    Inicia una sesión de monitoreo para una clase específica.
    Le ordena al script del sensor que empiece a enviar datos con este ID.
    """
    target_class = await Class.get(class_id)
    if not target_class:
        raise HTTPException(status_code=404, detail="Class not found")

    # Obtiene la última lectura baseline como referencia inicial
    latest_baseline = await SensorReading.find(
        SensorReading.session_id == "baseline_main"
    ).sort(-SensorReading.timestamp).limit(1).first_or_none()

    baseline_co2 = latest_baseline.co2 if latest_baseline else 420

    # Actualiza el estado global
    active_session_info["active_session_id"] = str(class_id)

    # Envía la orden al script del sensor
    await sensor_manager.send_command({
        "command": "start_session",
        "session_id": str(class_id)
    })

    return {
        "message": f"Sesión iniciada para: {target_class.name}",
        "session_id": str(class_id),
        "initial_baseline_co2": baseline_co2
    }


@router.post("/stop")
async def stop_session():
    """
    Detiene cualquier sesión de monitoreo activa y le ordena al script
    del sensor que vuelva al modo de medición de baseline.
    """
    active_session_info["active_session_id"] = "baseline_main"

    await sensor_manager.send_command({
        "command": "stop_session"
    })
    return {"message": "Todas las sesiones detenidas. Sensor volviendo a modo baseline."}


@router.get("/active")
async def get_active_session():
    """
    Endpoint de utilidad para que el frontend pueda saber qué sesión está activa.
    """
    return active_session_info