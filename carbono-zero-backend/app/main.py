# app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from contextlib import asynccontextmanager

# --- CAMBIOS AQUÍ ---
from .core.config import settings
from .core.scheduler import scheduler  # Importamos nuestro planificador
from .models.models import Class, SensorReading
from .api.routers import classes, readings, reports, sessions, sensor_control


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Conexión a la base de datos
    print("Iniciando conexión a la base de datos...")
    client = AsyncIOMotorClient(settings.DATABASE_URL)
    await init_beanie(database=client.get_default_database(), document_models=[Class, SensorReading])
    print("✅ Conexión a la base de datos establecida.")

    # --- Iniciar el planificador ---
    print("▶️ Iniciando el planificador de horarios...")
    scheduler.start()
    print("✅ Planificador iniciado.")

    yield  # La aplicación se mantiene viva aquí

    # --- Detener el planificador de forma segura ---
    print("⏹️ Deteniendo el planificador...")
    scheduler.shutdown()
    print("✅ Planificador detenido.")
    print("Cerrando conexión.")


app = FastAPI(title="Carbono Zero 683 API", lifespan=lifespan)

# Middleware para permitir que tu frontend se comunique con este backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # En producción, cambia "*" por la URL de tu frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluimos los routers de la API
app.include_router(classes.router, prefix="/api/classes", tags=["Classes"])
app.include_router(readings.router, prefix="/api/readings", tags=["Sensor Readings"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"]) # <--- NUEVA LÍNEA
app.include_router(sessions.router, prefix="/api/sessions", tags=["Sessions"]) # <--- NUEVA LÍNEA
app.include_router(sensor_control.router, prefix="/ws/sensor-control", tags=["Sensor Control"]) # <--- NUEVA LÍNEA

@app.get("/")
def read_root():
    return {"Proyecto": "Carbono Zero 683 API"}