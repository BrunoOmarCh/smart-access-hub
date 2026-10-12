import numpy as np

class CancelableBiometrics:
    def __init__(self, seed=12345, dimensions=512):
        """
        Inicializa la transformación cancelable usando una semilla (seed) secreta.
        Genera una matriz de proyección pseudoaleatoria fija.
        """
        self.seed = seed
        self.dimensions = dimensions
        self.projection_matrix = self._generate_projection_matrix()

    def _generate_projection_matrix(self):
        """ Genera una matriz ortogonal pseudoaleatoria basada en la semilla. """
        # Fijar la semilla asegura que la transformación siempre sea idéntica para el mismo sistema
        rng = np.random.default_rng(self.seed)
        # Crear una matriz aleatoria normal
        random_matrix = rng.standard_normal((self.dimensions, self.dimensions))
        # Aplicar descomposición QR para forzar que sea una matriz ortogonal (preserva distancias)
        q, _ = np.linalg.qr(random_matrix)
        return q

    def transform(self, embedding):
        """
        Aplica la transformación irreversible al embedding original.
        Ecuación de Tesis: T = E x P
        """
        if embedding is None:
            return None

        # Multiplicación matricial (Proyección)
        transformed_embedding = np.dot(embedding, self.projection_matrix)

        # Volver a normalizar el vector transformado para mantener la similitud de coseno idéntica
        norm = np.linalg.norm(transformed_embedding)
        if norm > 0:
            transformed_embedding = transformed_embedding / norm

        return transformed_embedding
