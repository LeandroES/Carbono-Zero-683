import serial
import json
import csv
from datetime import datetime

# 📍 Configura el puerto serial según tu sistema
# En Linux: '/dev/ttyACM0' o '/dev/ttyUSB0'
# En Windows: 'COM5' o similar
SERIAL_PORT = 'COM5'#'/dev/ttyACM0'
BAUD_RATE = 9600
CSV_FILE = 'datos_scd30.csv'

# 📦 Inicializa conexión serial
ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=5)

# 🗂️ Crea archivo CSV y escribe encabezado si no existe
try:
    with open(CSV_FILE, 'x', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['timestamp', 'co2_ppm', 'temperatura_c', 'humedad_pct'])
except FileExistsError:
    pass  # ya existe

print("📡 Escuchando datos del Arduino... (Ctrl+C para detener)")

try:
    while True:
        line = ser.readline().decode('utf-8').strip()
        if line.startswith('{') and line.endswith('}'):
            try:
                data = json.loads(line)
                timestamp = datetime.now().isoformat()
                co2 = data.get("co2_ppm")
                temp = data.get("temperatura_c")
                hum = data.get("humedad_pct")

                print(f"{timestamp} → CO₂: {co2} ppm | Temp: {temp} °C | Hum: {hum} %")

                # 💾 Guardar en CSV
                with open(CSV_FILE, 'a', newline='') as f:
                    writer = csv.writer(f)
                    writer.writerow([timestamp, co2, temp, hum])

            except json.JSONDecodeError:
                print("⚠️ Error al decodificar JSON:", line)
except KeyboardInterrupt:
    print("\n🛑 Lectura detenida por el usuario.")
finally:
    ser.close()
