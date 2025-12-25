# Carbono Zero 683: Sistema Inteligente para la Medición y Gestión del CO2

**Carbono Zero 683** es un sistema integral de monitoreo ambiental en tiempo real diseñado para medir la concentración de CO2, temperatura y humedad en aulas y oficinas. El proyecto busca no solo determinar la calidad del aire, sino también estimar el impuesto al carbono por persona para concientizar sobre el impacto ambiental.

[cite_start]Este proyecto fue desarrollado como Propuesta de Proyecto Final para la carrera de Ingeniería de Software en la Universidad La Salle - Arequipa[cite: 8].

## 📋 Tabla de Contenidos
- [Descripción del Proyecto](#descripción-del-proyecto)
- [Objetivos y ODS](#objetivos-y-ods)
- [Arquitectura y Tecnologías](#arquitectura-y-tecnologías)
- [Hardware Requerido](#hardware-requerido)
- [Instalación y Ejecución](#instalación-y-ejecución)
- [Autor](#autor)

## 📖 Descripción del Proyecto

[cite_start]El sistema combina la adquisición de datos mediante sensores especializados, su almacenamiento en una base de datos NoSQL y la visualización a través de un dashboard interactivo[cite: 25, 28].

**Funcionalidades Principales:**
* [cite_start]**Monitoreo en Tiempo Real:** Lectura de niveles de CO2, temperatura y humedad relativa[cite: 18].
* [cite_start]**Cálculo de Emisiones:** Estimación de emisiones de CO2 generadas por ocupación humana (en gramos y kilogramos)[cite: 19].
* [cite_start]**Impuesto al Carbono:** Cálculo automático del impuesto al carbono por persona basado en tasas internacionales para incentivar la sostenibilidad[cite: 20].
* [cite_start]**Alertas y Análisis:** Dashboards históricos y en tiempo real para la toma de decisiones (ej. mejorar ventilación)[cite: 21, 31].

## 🌍 Objetivos y ODS

[cite_start]El proyecto se alinea con la **Agenda 2030**, enfocándose en el cumplimiento de los siguientes Objetivos de Desarrollo Sostenible[cite: 41]:
* **ODS 3:** Salud y bienestar.
* **ODS 11:** Ciudades y comunidades sostenibles.
* **ODS 13:** Acción por el clima.

## 🛠 Arquitectura y Tecnologías

El sistema está dividido en tres componentes principales:

### 1. Frontend (Visualización)
Desarrollado con **React** y **Vite** para una experiencia de usuario rápida e interactiva.
* **Librerías clave:** `chart.js` y `react-chartjs-2` para gráficos de datos ambientales, `axios` para consumo de API.

### 2. Backend (API y Lógica)
Construido con **FastAPI (Python)**, encargado de la gestión de sesiones, websocket para datos en vivo y comunicación con el hardware.
* **Librerías clave:** `fastapi`, `uvicorn`, `beanie` (ODM para Mongo), `motor`, `pyserial` (lectura de sensores), `websockets`.

### 3. Base de Datos
* [cite_start]**MongoDB (NoSQL):** Optimizada para el manejo eficiente de series temporales de datos de sensores[cite: 28].

## 🖥️ Hardware Requerido

[cite_start]El sistema físico consta de los siguientes componentes[cite: 26, 27]:
* **Sensores:** 2x Sensirion SCD30 (CO2, Temperatura, Humedad).
* **Microcontrolador:** Arduino Mega 2560 R3 (Adquisición de datos vía I2C).
* **Procesamiento Central:** Raspberry Pi 5 (Servidor y Base de Datos).
* **Almacenamiento:** NVMe Base HAT+ con SSD NVMe.

## 🚀 Instalación y Ejecución

### Requisitos Previos
* Python 3.10+
* Node.js & npm
* MongoDB (local o Atlas)
* Arduino IDE (para cargar el script `.ino`)

### 1. Configuración del Hardware
1.  Conectar los sensores SCD30 al Arduino Mega mediante I2C.
2.  Cargar el script `carbono-zero-backend/hardware/sensors/scd30x2.ino` en el Arduino.
3.  Conectar el Arduino vía USB a la máquina host (Raspberry Pi o PC).

### 2. Configuración del Backend
```bash
cd carbono-zero-backend

# Crear entorno virtual (opcional pero recomendado)
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
# Crea un archivo .env basado en la configuración requerida (MongoDB URL, Serial Port, etc.)

# Ejecutar el servidor
uvicorn app.main:app --reload
