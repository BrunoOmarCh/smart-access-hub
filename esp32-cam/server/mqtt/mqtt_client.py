import json
import time
import paho.mqtt.client as mqtt
from server.config import (
    MQTT_BROKER,
    MQTT_PORT,
    MQTT_CLIENT_ID,
    TOPIC_COMMAND
)
class SmartAccessMQTT:
    def __init__(self):
        # Usamos CallbackAPIVersion.VERSION2 por compatibilidad con paho-mqtt v2.x
        self.client = mqtt.Client(callback_api_version=mqtt.CallbackAPIVersion.VERSION2, client_id=MQTT_CLIENT_ID)
        self.is_connected = False

        # Asignar funciones de callback
        self.client.on_connect = self._on_connect
        self.client.on_disconnect = self._on_disconnect

    def _on_connect(self, client, userdata, flags, rc, properties=None):
        if rc == 0:
            print("[MQTT] Conectado exitosamente al Broker HiveMQ.")
            self.is_connected = True
        else:
            print(f"[MQTT] Error de conexión. Código de retorno: {rc}")

    def _on_disconnect(self, client, userdata, rc, properties=None):
        print("[MQTT] Se ha perdido la conexión con el Broker.")
        self.is_connected = False

    def connect(self):
        """Conecta al broker de manera asíncrona para no bloquear el hilo de OpenCV."""
        try:
            print(f"[INFO] Conectando al broker MQTT: {MQTT_BROKER}...")
            self.client.connect_async(MQTT_BROKER, MQTT_PORT, keepalive=60)
            # Inicia el bucle de red en un hilo separado
            self.client.loop_start()
        except Exception as e:
            print(f"[MQTT] Error crítico al inicializar la conexión: {e}")

    def publish_access(self, username, confidence):
        """
        Publica el resultado del reconocimiento utilizando
        el protocolo oficial de SmartAccess.
        """
        if not self.is_connected:
            print("[MQTT] Cliente desconectado.")
            return False
        authorized = username != "Desconocido"
        payload = {
            "event":"camera_result",
            "authorized":authorized,
            "user":username if authorized else "",
            "confidence":round(float(confidence),4),
            "device":"esp32-cam",
            "source":"AI"
        }
        try:
            json_payload = json.dumps(payload)
            result = self.client.publish(
                TOPIC_COMMAND,
                json_payload,
                qos=1
            )
            result.wait_for_publish(timeout=1.0)
            print(f"[MQTT] Publicado -> {json_payload}")
            return True
        except Exception as e:
            print(f"[MQTT] Error: {e}")
            return False

    def disconnect(self):
        """Detiene los hilos y cierra la sesión limpiamente."""
        self.client.loop_stop()
        self.client.disconnect()
        print("[INFO] Conexión MQTT finalizada limpiamente.")
