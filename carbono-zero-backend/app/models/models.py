# app/models/models.py
from beanie import Document, PydanticObjectId
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, time

# Modelo de respuesta para el frontend
class ClassOut(BaseModel):
    id: PydanticObjectId
    name: str
    schedule_day: int
    schedule_start: str # <-- CAMBIO: De 'time' a 'str'
    schedule_end: str   # <-- CAMBIO: De 'time' a 'str'
    capacity: int
    volume: float
    area: float
    ventilation: str

    class Config:
        from_attributes = True

# Modelo para la base de datos
class Class(Document):
    name: str
    schedule_day: int
    schedule_start: str # <-- CAMBIO: De 'time' a 'str'
    schedule_end: str   # <-- CAMBIO: De 'time' a 'str'
    capacity: int
    volume: float
    area: float
    ventilation: str

    class Settings:
        name = "classes"

# Modelo para actualizar una clase
class UpdateClass(BaseModel):
    name: Optional[str] = None
    schedule_day: Optional[int] = None
    schedule_start: Optional[str] = None # <-- CAMBIO: De 'time' a 'str'
    schedule_end: Optional[str] = None   # <-- CAMBIO: De 'time' a 'str'
    capacity: Optional[int] = None
    volume: Optional[float] = None
    area: Optional[float] = None
    ventilation: Optional[str] = None

# Modelo para las lecturas de sensores (sin cambios)
class SensorReading(Document):
    session_id: str
    co2: float
    temperature: float
    humidity: float
    timestamp: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "sensor_readings"

# Modelo para el payload que llega del sensor (sin cambios)
class ReadingPayload(BaseModel):
    co2: float
    temperature: float
    humidity: float
