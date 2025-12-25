# app/api/routers/sensor_control.py

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()

# Este manager solo manejará la conexión con el script del sensor.
# Es un objeto simple para mantener el estado de la conexión.
class SensorControlManager:
    def __init__(self):
        self.active_connection: WebSocket | None = None
        print("SensorControlManager inicializado.")

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connection = websocket
        print("🔌 Conexión con el script del sensor establecida.")

    def disconnect(self):
        self.active_connection = None
        print("🔌 Conexión con el script del sensor perdida.")

    async def send_command(self, command: dict):
        if self.active_connection:
            await self.active_connection.send_json(command)
            print(f"▶️ Comando enviado al sensor: {command}")
        else:
            print("⚠️ No se pudo enviar el comando: No hay conexión con el script del sensor.")

# Creamos una instancia única del manager para toda la aplicación
sensor_manager = SensorControlManager()

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    Este es el endpoint al que el script de Python se conectará
    para recibir órdenes (ej: 'inicia monitoreo para la clase X').
    """
    await sensor_manager.connect(websocket)
    try:
        # Mantenemos la conexión abierta indefinidamente, esperando
        while True:
            # En el futuro, el script podría enviar pings de 'estoy vivo'
            await websocket.receive_text()
    except WebSocketDisconnect:
        sensor_manager.disconnect()