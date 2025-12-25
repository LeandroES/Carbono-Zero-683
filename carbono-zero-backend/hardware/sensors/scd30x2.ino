#include <Wire.h>
#include "SparkFun_SCD30_Arduino_Library.h"

SCD30 airSensor;

void setup() {
  Serial.begin(9600);
  Wire.begin();

  if (!airSensor.begin()) {
    Serial.println("❌ No se detectó el sensor SCD30. Verifica conexiones.");
    while (true);  // Detener ejecución si no se encuentra el sensor
  }

  // Configurar intervalo de medición
  if (airSensor.setMeasurementInterval(5)) {
    Serial.println("✅ Intervalo de medición configurado a 5 segundos.");
  } else {
    Serial.println("⚠️ No se pudo establecer el intervalo de medición.");
  }

  // Activar calibración automática
  if (airSensor.setAutoSelfCalibration(true)) {
    Serial.println("✅ Calibración automática activada.");
  } else {
    Serial.println("⚠️ No se pudo activar la calibración automática.");
  }

  // Establecer compensación por altitud (Arequipa ≈ 2400 m)
  if (airSensor.setAltitudeCompensation(2400)) {
    Serial.println("✅ Compensación de altitud configurada a 2400 m.");
  } else {
    Serial.println("⚠️ No se pudo establecer la compensación de altitud.");
  }

  Serial.println("✅ Sensor SCD30 inicializado y configurado correctamente.");
}

void loop() {
  if (airSensor.dataAvailable()) {
    float co2 = airSensor.getCO2();
    float temp = airSensor.getTemperature();
    float hum = airSensor.getHumidity();

    // Salida JSON
    Serial.print("{");
    Serial.print("\"co2_ppm\": ");
    Serial.print(co2, 1);
    Serial.print(", \"temperatura_c\": ");
    Serial.print(temp, 1);
    Serial.print(", \"humedad_pct\": ");
    Serial.print(hum, 1);
    Serial.println("}");
  }

  delay(5000);
}
