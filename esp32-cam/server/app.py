import argparse

def main():
    import cv2
    import time
    from server.camera.stream import ESP32Stream
    from server.recognition.detector import FaceDetector
    from server.recognition.recognizer import FaceRecognizer
    from server.mqtt.mqtt_client import SmartAccessMQTT
    from server.config import WINDOW_NAME

    print("[🚀 PRODUCTION] Iniciando Sistema SmartAccess con IA e Integración IoT...")

    # Inicializar componentes
    streamer = ESP32Stream()
    detector = FaceDetector()
    recognizer = FaceRecognizer(threshold=0.80)
    mqtt_io = SmartAccessMQTT()

    # Conectar periférico de mensajería
    mqtt_io.connect()

    if not streamer.connect():
        mqtt_io.disconnect()
        return

    # Variables de control para no saturar el Broker (anti-spam de eventos)
    last_mqtt_sent_time = 0
    mqtt_cooldown = 5  # Segundos de espera entre transmisiones del mismo estado
    last_sent_user = ""

    print("\n[INFO] Monitoreo activo. Transmitiendo telemetría vía MQTT. Presiona 'q' para salir.")

    while True:
        ret, frame = streamer.get_frame()
        if not ret or frame is None:
            print("[⚠️ WARN] Pérdida de señal de video del ESP32.")
            break

        faces = detector.detect_faces(frame)
        current_time = time.time()

        for face in faces:
            name, score = recognizer.recognize_face(face)

            # CORRECCIÓN: Desempaquetar correctamente las 4 coordenadas del array de InsightFace
            x1, y1, x2, y2 = face.bbox.astype(int)

            if name != "Desconocido":
                color = (0, 255, 0)
                label = f"ACCESO CONCEDIDO: {name} ({score*100:.1f}%)"

                if (current_time - last_mqtt_sent_time > mqtt_cooldown) or (name != last_sent_user):
                    mqtt_io.publish_access(name, score)
                    last_mqtt_sent_time = current_time
                    last_sent_user = name
            else:
                color = (0, 0, 255)
                label = f"NO RECONOCIDO ({score*100:.1f}%)"

                if (current_time - last_mqtt_sent_time > mqtt_cooldown + 5) and (last_sent_user != "Desconocido"):
                    mqtt_io.publish_access("Desconocido", score)
                    last_mqtt_sent_time = current_time
                    last_sent_user = "Desconocido"

            # Ahora x1, y1, x2, y2 son enteros nativos puros
            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
            cv2.putText(frame, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

            print(f"[LOG BIOMETRICO] {name} | Confianza: {score*100:.2f}%")


        cv2.imshow(WINDOW_NAME, frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            print("[INFO] Apagando el sistema...")
            break

    streamer.disconnect()
    mqtt_io.disconnect()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--api",
        action="store_true",
        help="Inicia la API local usada por el kiosco web.",
    )
    args = parser.parse_args()
    if args.api:
        from server.kiosk_api import serve

        serve()
    else:
        main()
