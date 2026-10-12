import os
import json
import argparse
import re
import sys
import cv2
import numpy as np
from server.camera.stream import ESP32Stream
from server.recognition.detector import FaceDetector
from server.recognition.embedding import FaceEmbedder
from server.crypto.cancelable import CancelableBiometrics

class UserRegister:
    def __init__(self):
        self.db_json_path = "server/database/users.json"
        self.embeddings_dir = "server/database/embeddings"
        self.required_samples = 30
        # Instanciar el protector criptográfico con la clave del sistema
        self.crypto = CancelableBiometrics(seed=98765)

    def save_user(self, username, collected_embeddings):
        print(f"[INFO] Procesando promedio biométrico de {self.required_samples} muestras...")
        mean_embedding = np.mean(collected_embeddings, axis=0)

        norm = np.linalg.norm(mean_embedding)
        if norm > 0:
            mean_embedding = mean_embedding / norm

        # --- CAPA CRIPTOGRÁFICA: TRANSFORMACIÓN CANCELABLE ---
        print("[🔒 CRIPTO] Aplicando transformación irreversible al embedding...")
        cancelable_template = self.crypto.transform(mean_embedding)
        # -----------------------------------------------------

        os.makedirs(self.embeddings_dir, exist_ok=True)

        # Guardar la plantilla protegida (nunca el original)
        npy_filename = f"{username}_cancelable.npy"
        npy_path = os.path.join(self.embeddings_dir, npy_filename)
        np.save(npy_path, cancelable_template)

        # Update the metadata without silently discarding earlier registrations.
        users_data = {}
        if os.path.exists(self.db_json_path):
            with open(self.db_json_path, 'r', encoding="utf-8") as f:
                users_data = json.load(f)

        users_data[username] = {
            "embedding_file": npy_filename,
            "samples_collected": self.required_samples,
            "protected_by": "Cancelable Biometrics (Random Orthogonal Projection)"
        }

        with open(self.db_json_path, 'w') as f:
            json.dump(users_data, f, indent=4)

        print(f"[✅ OK] ¡Usuario '{username}' registrado con PLANTILLA PROTEGIDA!\n")

def run_registration_flow(username=None):
    print("[📝 ADMIN] --- REGISTRO DE USUARIOS CON PROTECCIÓN CRIPTOGRÁFICA ---")
    username = username or input("Ingresa el ID del residente a registrar: ").strip()
    if not username:
        return False

    streamer = ESP32Stream()
    detector = FaceDetector()
    embedder = FaceEmbedder()
    register = UserRegister()

    if not streamer.connect():
        return False

    collected_embeddings = []
    print(f"\n[🚀 CAPTURA] Mirar a la cámara para capturar muestras para '{username}'...")

    while len(collected_embeddings) < register.required_samples:
        ret, frame = streamer.get_frame()
        if not ret or frame is None:
            break

        faces = detector.detect_faces(frame)
        display_frame = frame.copy()

        # CORRECCIÓN: Validar que se detectó exactamente un rostro en la lista
        if len(faces) == 1:
            face = faces[0]  # <-- EXTRAER EL PRIMER ROSTRO DE LA LISTA
            embedding = embedder.extract_embedding(face)

            if embedding is not None:
                collected_embeddings.append(embedding)

                # Desempaquetar las coordenadas correctamente para OpenCV
                x1, y1, x2, y2 = face.bbox.astype(int)

                # Pintar recuadro interactivo azul de registro
                cv2.rectangle(display_frame, (x1, y1), (x2, y2), (255, 0, 0), 2)
                txt = f"Registrando '{username}': {len(collected_embeddings)}/{register.required_samples}"
                cv2.putText(display_frame, txt, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 0, 0), 2)
        elif len(faces) > 1:
            cv2.putText(display_frame, "ERROR: Solo una persona a la vez", (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)
        else:
            cv2.putText(display_frame, "Buscando rostro...", (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)

        cv2.imshow("SmartAccess - Registro Protegido", display_frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    streamer.disconnect()
    cv2.destroyAllWindows()

    if len(collected_embeddings) == register.required_samples:
        register.save_user(username, collected_embeddings)
        return True
    return False

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--username",
        help="ID interno del residente al que se vinculará la plantilla protegida.",
    )
    args = parser.parse_args()
    if args.username and not re.fullmatch(r"[A-Za-z0-9_-]{1,80}", args.username):
        parser.error("El ID solo puede contener letras, números, guiones y guiones bajos.")
    if not run_registration_flow(args.username):
        sys.exit(1)
