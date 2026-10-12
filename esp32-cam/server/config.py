import os

# --- CONFIGURACIÓN DEL VIDEO ---
# Usa 0 para la cámara web integrada de la laptop (Entorno de Desarrollo)
# Cambia a la URL http://... para el ESP32-S3 CAM (Entorno de Despliegue)
USE_WEBCAM_LOCAL = True

if USE_WEBCAM_LOCAL:
    ESP32_STREAM_URL = 0  # El entero 0 le dice a OpenCV que use la cámara local
else:
    ESP32_STREAM_URL = "http://192.168.1"

# Configuración de Ventana OpenCV
WINDOW_NAME = "SmartAccess - Simulación Local"

# MQTT SMARTACCESS
# ==========================================================

# MQTT_BROKER = "192.168.1.54"
MQTT_BROKER = "10.58.235.79"

MQTT_PORT = 1883
MQTT_CLIENT_ID = "smartaccess-face-server"

# ==========================================================
# Topics Oficiales SmartAccess
# ==========================================================

TOPIC_COMMAND = "smartaccess/command"

TOPIC_RESPONSE = "smartaccess/system/response"

TOPIC_HEARTBEAT = "smartaccess/system/heartbeat"

TOPIC_EVENTS = "smartaccess/events"

# =====================================================================
# 🔒 PARAMETROS CRIPTOGRÁFICOS (FASES 5 Y 6)
# =====================================================================
# Semilla maestra para la proyección ortogonal (Biometría Cancelable)
CANCELABLE_SEED = 98765

# Parámetros para la siguiente fase: IoM Hashing (Index-of-Max)
IOM_NUM_FEATURES = 512
IOM_NUM_PERMUTATIONS = 128  # Longitud del hash binario final para la base de datos
