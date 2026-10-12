import os
import json
import numpy as np
from server.recognition.embedding import FaceEmbedder
from server.crypto.cancelable import CancelableBiometrics

class FaceRecognizer:
    def __init__(self, threshold=0.90):
        self.embedder = FaceEmbedder()
        self.threshold = threshold
        self.db_json_path = "server/database/users.json"
        self.embeddings_dir = "server/database/embeddings"
        # La misma semilla exacta usada en el registro (98765)
        self.crypto = CancelableBiometrics(seed=98765)
        self.known_faces = {}
        self.load_known_faces()

    def load_known_faces(self):
        if not os.path.exists(self.db_json_path):
            self.known_faces = {}
            return
        try:
            with open(self.db_json_path, "r", encoding="utf-8") as f:
                users_data = json.load(f)
        except (OSError, json.JSONDecodeError) as error:
            raise RuntimeError(f"No se pudo leer la base local de rostros: {error}") from error

        self.known_faces = {}
        for username, info in users_data.items():
            filename = info.get("embedding_file")
            if not isinstance(filename, str) or os.path.basename(filename) != filename:
                raise RuntimeError(f"La plantilla facial de {username} tiene una ruta inválida.")
            npy_path = os.path.join(self.embeddings_dir, filename)
            if not os.path.isfile(npy_path):
                raise RuntimeError(f"No se encontró la plantilla facial de {username}: {filename}")
            try:
                template = np.load(npy_path, allow_pickle=False)
            except (OSError, ValueError) as error:
                raise RuntimeError(
                    f"No se pudo cargar la plantilla facial de {username}: {error}"
                ) from error
            if template.ndim != 1 or template.shape[0] != self.crypto.dimensions:
                raise RuntimeError(
                    f"La plantilla facial de {username} tiene dimensiones inválidas: {template.shape}."
                )
            self.known_faces[username] = template

        print(f"[✅ OK] Base de datos de plantillas cancelables cargada ({len(self.known_faces)} usuarios).")

    def recognize_face(self, face):
        """
        Compara el rostro actual contra la base de datos usando similitud de coseno.
        """
        current_embedding = self.embedder.extract_embedding(face)
        if current_embedding is None:
            return "Desconocido", 0.0

        # --- TRANSFORMAR EL VECTOR EN VIVO ANTES DE COMPARAR ---
        # No comparamos datos planos, comparamos hashes cripto-biométricos
        transformed_current = self.crypto.transform(current_embedding)
        # --------------------------------------------------------

        best_name = "Desconocido"
        best_score = 0.0

        for name, protected_embedding in self.known_faces.items():
            # Al estar ambos vectores normalizados, el producto punto es la similitud de coseno
            # InsightFace/ArcFace escala la distancia lineal a un score de confianza (0.0 a 1.0)
            # Nota: Si el score base es distancia euclidiana, se ajusta la fórmula.
            similitud = float(np.dot(transformed_current, protected_embedding))

            # Mapeo opcional: ArcFace entrega rangos donde > 0.4-0.5 ya es la misma persona.
            # Para tu tesis, si deseas mostrar porcentajes limpios del 0 al 100%,
            # usaremos un mapeo lineal simple para que el jurado entienda el score de confianza.
            if similitud > best_score:
                best_score = similitud
                best_name = name

        # Aplicar el umbral estricto configurado (0.90)
        # Si el score no llega al umbral, se mantiene como Desconocido
        if best_score < self.threshold:
            return "Desconocido", best_score

        return best_name, best_score
