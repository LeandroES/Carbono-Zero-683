# read_and_push_sensors.py
import serial
import json
import requests
from time import sleep
import asyncio
import websockets
import threading

# --- CONFIGURACIÓN ---
SERIAL_PORT = 'COM5'
BAUD_RATE = 9600
BACKEND_URL_POST = 'http://localhost:8000/api/readings/'
WS_CONTROL_URL = 'ws://localhost:8000/ws/sensor-control/ws'
DEFAULT_SESSION_ID = "baseline_main"


# Usamos un objeto de bloqueo para manejar la variable de forma segura entre hilos
class SessionState:
    def __init__(self):
        self.active_session_id = DEFAULT_SESSION_ID
        self._lock = threading.Lock()

    def set_id(self, new_id):
        with self._lock:
            self.active_session_id = new_id

    def get_id(self):
        with self._lock:
            return self.active_session_id


# Creamos una instancia global del estado
session_state = SessionState()


async def listen_for_commands():
    """Se conecta al WebSocket de control y escucha órdenes del backend."""
    while True:
        try:
            # El 'ping_interval' y 'ping_timeout' ayudan a mantener la conexión viva
            async with websockets.connect(WS_CONTROL_URL, ping_interval=20, ping_timeout=20) as websocket:
                print("✅ Conectado al servidor de control del backend.")
                while True:
                    message = await websocket.recv()
                    command = json.loads(message)
                    print(f"▶️  Orden recibida: {command}")
                    if command.get("command") == "start_session":
                        new_id = command.get("session_id", DEFAULT_SESSION_ID)
                        session_state.set_id(new_id)
                        print(f"🚀 Iniciando sesión de monitoreo para: {new_id}")
                    elif command.get("command") == "stop_session":
                        session_state.set_id(DEFAULT_SESSION_ID)
                        print(f"🛑 Sesión detenida. Volviendo a modo baseline.")
        except Exception as e:
            # Si hay cualquier error (conexión cerrada, rechazada, etc.), esperamos y reintentamos.
            print(f"⚠️ Conexión de control perdida ({type(e).__name__}). Reintentando en 5 segundos...")
            await asyncio.sleep(5)


def read_and_push_serial_data():
    """Lee del puerto serial y envía los datos vía HTTP POST."""
    print(f"📡 Intentando conectar al puerto {SERIAL_PORT}...")
    try:
        ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
        print("✅ Conexión serial exitosa.")
        sleep(2)
    except serial.SerialException as e:
        print(f"❌ Error al conectar al puerto serial: {e}")
        return

    try:
        while True:
            if ser.in_waiting > 0:
                line = ser.readline().decode('utf-8').strip()
                if line.startswith('{') and line.endswith('}'):
                    try:
                        data = json.loads(line)
                        payload = {
                            "co2": data.get("co2_ppm"),
                            "temperature": data.get("temperatura_c"),
                            "humidity": data.get("humedad_pct")
                        }

                        current_session_id = session_state.get_id()
                        response = requests.post(f"{BACKEND_URL_POST}?session_id={current_session_id}", json=payload)

                        if response.status_code == 202:
                            print(
                                f"🛰️  Datos enviados para '{current_session_id}': CO2: {payload['co2']:.0f} ppm | Temp: {payload['temperature']}°C | Hum: {payload['humidity']:.0f}%")
                        else:
                            print(f"❌ Error al enviar datos: {response.status_code}")
                    except (json.JSONDecodeError, requests.exceptions.RequestException) as e:
                        print(f"Error procesando/enviando: {e}")
            sleep(5)
    except KeyboardInterrupt:
        print("\n🛑 Programa detenido.")
    finally:
        if 'ser' in locals() and ser.is_open:
            ser.close()
            print(" Puerto serial cerrado.")


async def main():
    # Creamos un hilo separado para la lectura serial, que es bloqueante
    serial_thread = threading.Thread(target=read_and_push_serial_data, daemon=True)
    serial_thread.start()

    # Ejecutamos el listener de comandos de WebSocket en el hilo principal
    await listen_for_commands()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("Programa finalizado.")
