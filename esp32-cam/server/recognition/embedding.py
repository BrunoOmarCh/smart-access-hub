import numpy as np

class FaceEmbedder:
    def __init__(self):
        print("[INFO] Inicializado el extractor de embeddings (ArcFace).")

    def extract_embedding(self, face):
        """
        Extrae el vector de 512 dimensiones de un rostro detectado por InsightFace.
        """
        # InsightFace calcula automáticamente el embedding si usamos 'buffalo_l'
        if hasattr(face, 'normed_embedding') and face.normed_embedding is not None:
            return face.normed_embedding

        if hasattr(face, 'embedding') and face.embedding is not None:
            # Normalizar el embedding para asegurar similitud de coseno precisa
            embedding = face.embedding
            norm = np.linalg.norm(embedding)
            return embedding / norm if norm > 0 else embedding

        return None
