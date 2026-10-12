import cv2
from server.config import ESP32_STREAM_URL

class ESP32Stream:
    def __init__(self):
        self.url = ESP32_STREAM_URL
        self.cap = None

    def connect(self):
        """Inicializa la captura de video (Soporta puerto local o URL de red)."""
        if isinstance(self.url, int):
            print(f"[INFO] Conectando a la Cámara de la Laptop (Puerto {self.url})...")
        else:
            print(f"[INFO] Conectando al stream de red del ESP32: {self.url}")

        self.cap = cv2.VideoCapture(self.url)

        if not self.cap.isOpened():
            print("[❌ ERROR] No se pudo abrir la cámara. Verifica permisos o IP.")
            return False

        # --- CORRECCIÓN CRUCIAL PARA LAPTOP ---
        # Si es la cámara local, forzamos resolución 640x480 para no saturar a InsightFace
        if isinstance(self.url, int):
            self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
            self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
            print("[INFO] Resolución de Laptop ajustada a 640x480 para la IA.")

        print("[✅ OK] Conexión de video establecida correctamente.")
        return True

    def get_frame(self):
        """Lee un frame de la cámara actual."""
        if self.cap is None or not self.cap.isOpened():
            return False, None
        return self.cap.read()

    def disconnect(self):
        """Libera los recursos de la cámara."""
        if self.cap:
            self.cap.release()
            print("[INFO] Conexión de video cerrada.")
