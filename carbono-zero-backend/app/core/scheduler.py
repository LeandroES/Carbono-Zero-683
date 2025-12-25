# app/core/scheduler.py

import httpx
from datetime import datetime
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from beanie import PydanticObjectId

from ..models.models import Class
from ..api.routers.sessions import active_session_info  # Importamos el estado de la sesión

# La URL base de nuestra propia API
API_BASE_URL = "http://localhost:8000"


async def check_schedules():
    """
    Esta es la tarea que se ejecutará cada minuto.
    Revisa los horarios de las clases y decide si iniciar o detener una sesión.
    """
    now = datetime.now()
    current_day = now.weekday()  # Lunes = 0, Martes = 1, ...
    current_time_str = now.strftime("%H:%M")

    print(
        f"[{now.strftime('%Y-%m-%d %H:%M:%S')}] ⏰ Planificador ejecutándose... Día: {current_day}, Hora: {current_time_str}")

    all_classes = await Class.find_all().to_list()
    current_session_id = active_session_info["active_session_id"]

    # Usamos un cliente HTTP asíncrono para hacer llamadas a nuestra propia API
    async with httpx.AsyncClient() as client:
        # Lógica para INICIAR una sesión
        if current_session_id == "baseline_main":
            for cls in all_classes:
                # Comparamos el día y la hora de inicio
                if cls.schedule_day == current_day and cls.schedule_start == current_time_str:
                    print(f"✅ Coincidencia de INICIO encontrada para la clase: {cls.name}")
                    try:
                        # Llama al endpoint para iniciar la sesión
                        await client.post(f"{API_BASE_URL}/api/sessions/start/{cls.id}")
                        print(f"🚀 Orden de INICIO enviada para la clase {cls.id}")
                        break  # Salimos del bucle para no iniciar múltiples clases a la vez
                    except httpx.RequestError as e:
                        print(f"❌ Error al enviar orden de INICIO: {e}")

        # Lógica para DETENER una sesión
        else:
            # Buscamos la clase que está actualmente activa
            active_class = await Class.get(PydanticObjectId(current_session_id))
            if active_class:
                # Comparamos el día y la hora de fin
                if active_class.schedule_day == current_day and active_class.schedule_end == current_time_str:
                    print(f"✅ Coincidencia de FIN encontrada para la clase: {active_class.name}")
                    try:
                        # Llama al endpoint para detener TODAS las sesiones
                        await client.post(f"{API_BASE_URL}/api/sessions/stop")
                        print(f"🛑 Orden de FIN enviada.")
                    except httpx.RequestError as e:
                        print(f"❌ Error al enviar orden de FIN: {e}")


# Creamos una instancia del planificador
scheduler = AsyncIOScheduler(timezone="America/Lima")  # Asegúrate que el timezone sea el correcto
scheduler.add_job(check_schedules, 'interval', minutes=1)