# app/services/websocket_manager.py

from fastapi import WebSocket
import logging

# Configura un logger para ver qué está pasando
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class WebSocketManager:
    def __init__(self):
        # El diccionario ahora guarda listas de WebSockets por session_id
        self.active_connections: dict[str, list[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, session_id: str):
        await websocket.accept()
        if session_id not in self.active_connections:
            self.active_connections[session_id] = []
        self.active_connections[session_id].append(websocket)
        logger.info(f"Cliente conectado al WebSocket para la sesión: {session_id}")

    def disconnect(self, websocket: WebSocket, session_id: str):
        if session_id in self.active_connections:
            self.active_connections[session_id].remove(websocket)
            logger.info(f"Cliente desconectado del WebSocket para la sesión: {session_id}")
            # Si no quedan clientes para esa sesión, eliminamos la entrada del diccionario
            if not self.active_connections[session_id]:
                del self.active_connections[session_id]

    async def broadcast_to_session(self, message: dict, session_id: str):
        if session_id in self.active_connections:
            # Creamos una copia de la lista de conexiones para poder modificarla de forma segura
            connections_to_broadcast = self.active_connections[session_id][:]

            for connection in connections_to_broadcast:
                try:
                    # Intentamos enviar el mensaje
                    await connection.send_json(message)
                except Exception:
                    # Si el envío falla (ej. la conexión fue cerrada por el cliente),
                    # lo removemos de la lista de conexiones activas.
                    logger.warning(
                        f"No se pudo enviar mensaje a una conexión cerrada. Eliminando cliente de la sesión: {session_id}")
                    self.active_connections[session_id].remove(connection)
                    # Si ya no hay clientes en la sesión, la eliminamos
                    if not self.active_connections[session_id]:
                        del self.active_connections[session_id]


# Creamos una instancia única del manager para toda la aplicación
manager = WebSocketManager()
