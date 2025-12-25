# app/api/routers/readings.py
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from datetime import datetime, time, timedelta
from typing import Optional
import asyncio
from ...services.websocket_manager import manager
from ...models.models import ReadingPayload, SensorReading

router = APIRouter()

@router.post("/", status_code=202)
async def receive_sensor_reading(payload: ReadingPayload, session_id: str):
    reading_doc = SensorReading(**payload.model_dump(), session_id=session_id)
    await reading_doc.insert()
    await manager.broadcast_to_session(payload.model_dump(), session_id)
    return {"status": "received"}

@router.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await manager.connect(websocket, session_id)
    try:
        while True:
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        manager.disconnect(websocket, session_id)


@router.get("/history/{class_id}")
async def get_class_history(
        class_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        start_time: Optional[time] = None,
        end_time: Optional[time] = None
):
    """
    Busca el historial de una clase. Si se proveen fechas, filtra por ellas.
    Siempre agrupa los resultados en intervalos de 15 minutos.
    """
    match_filter = {"session_id": class_id}

    # Construir el filtro de fecha/hora si se proporcionan los parámetros
    if start_date and end_date:
        s_date = datetime.combine(start_date, start_time) if start_time else start_date
        e_date = datetime.combine(end_date, end_time) if end_time else end_date + timedelta(days=1)
        match_filter["timestamp"] = {"$gte": s_date, "$lt": e_date}

    pipeline = [
        {"$match": match_filter},
        {
            "$group": {
                "_id": {
                    "$dateTrunc": {
                        "date": "$timestamp",
                        "unit": "minute",
                        "binSize": 15
                    }
                },
                "avg_co2": {"$avg": "$co2"}
            }
        },
        {"$sort": {"_id": 1}},
        {"$project": {"timestamp": "$_id", "co2": "$avg_co2", "_id": 0}}
    ]
    history = await SensorReading.aggregate(pipeline).to_list()
    return history