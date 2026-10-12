import cv2
from insightface.app import FaceAnalysis

class FaceDetector:
    def __init__(self, providers=['CPUExecutionProvider']):
        print("[INFO] Cargando modelos de InsightFace (Detección)...")
        self.app = FaceAnalysis(name='buffalo_l', providers=providers)
        # Seteamos det_size a 640x640 para que haga match perfecto con nuestro stream
        self.app.prepare(ctx_id=-1, det_size=(640, 640))
        print("[✅ OK] Modelos cargados exitosamente.")

    def detect_faces(self, frame):
        if frame is None:
            return []
        try:
            # Forzar que el frame sea continuo en memoria para evitar errores de InsightFace
            return self.app.get(frame)
        except Exception as e:
            print(f"[⚠️ WARN] Error en detección: {e}")
            return []

    def draw_bbox(self, frame, faces):
        for face in faces:
            x1, y1, x2, y2 = face.bbox.astype(int)
            detection_score = face.det_score

            # Dibujar cuadro verde estándar
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
            label = f"Cara: {detection_score*100:.1f}%"
            cv2.putText(frame, label, (x1, y1 - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
        return frame
