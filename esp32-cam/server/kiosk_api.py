import base64
import json
import os
import subprocess
import sys
import threading
from datetime import date
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urlsplit
import unicodedata
from urllib.request import Request, urlopen

from server.config import USE_WEBCAM_LOCAL

for stream in (sys.stdout, sys.stderr):
    if hasattr(stream, "reconfigure"):
        stream.reconfigure(encoding="utf-8", errors="replace")


PROJECT_DIR = Path(__file__).resolve().parent.parent
MAX_FRAME_BYTES = 5 * 1024 * 1024
MAX_REQUEST_BYTES = 8 * 1024 * 1024
_model_lock = threading.Lock()
_registration_lock = threading.Lock()
_detector = None
_recognizer = None


def _json_request(url, headers, method="GET", body=None):
    request = Request(url, headers=headers, method=method, data=body)
    with urlopen(request, timeout=8) as response:
        payload = response.read()
        return json.loads(payload) if payload else None


def _authenticate(token, require_admin=True):
    supabase_url = os.environ.get("SUPABASE_URL", "").rstrip("/")
    supabase_key = os.environ.get("SUPABASE_PUBLISHABLE_KEY")
    if not supabase_url or not supabase_key:
        raise RuntimeError("Falta la configuración local de Supabase para validar la sesión.")

    headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {token}",
    }
    user = _json_request(f"{supabase_url}/auth/v1/user", headers)
    user_id = user.get("id")
    if not isinstance(user_id, str):
        raise PermissionError("La sesión no contiene un usuario válido.")

    if require_admin:
        query = urlencode({"select": "role", "user_id": f"eq.{user_id}", "role": "eq.admin"})
        roles = _json_request(f"{supabase_url}/rest/v1/user_roles?{query}", headers)
        if not isinstance(roles, list) or not roles:
            raise PermissionError("Solo un administrador puede operar el kiosco.")
    return user_id


def _face_models():
    global _detector, _recognizer
    if _detector is None or _recognizer is None:
        from server.recognition.detector import FaceDetector
        from server.recognition.recognizer import FaceRecognizer

        detector = FaceDetector()
        recognizer = FaceRecognizer(threshold=0.80)
        _detector = detector
        _recognizer = recognizer
    return _detector, _recognizer


def _decode_frame(encoded_frame):
    import cv2
    import numpy as np

    if not isinstance(encoded_frame, str):
        raise ValueError("No se recibió una imagen de la cámara.")
    if encoded_frame.startswith("data:"):
        _, separator, encoded_frame = encoded_frame.partition(",")
        if not separator:
            raise ValueError("El formato de imagen de la cámara es inválido.")

    try:
        image_bytes = base64.b64decode(encoded_frame, validate=True)
    except ValueError as error:
        raise ValueError("La imagen de la cámara no contiene base64 válido.") from error
    if not image_bytes or len(image_bytes) > MAX_FRAME_BYTES:
        raise ValueError("La imagen está vacía o supera el límite permitido.")

    frame = cv2.imdecode(np.frombuffer(image_bytes, dtype=np.uint8), cv2.IMREAD_COLOR)
    if frame is None:
        raise ValueError("No se pudo leer la imagen capturada por la cámara.")
    return frame


def _capture_esp32_frame():
    from server.camera.stream import ESP32Stream

    stream = ESP32Stream()
    if not stream.connect():
        raise RuntimeError("No se pudo conectar a la cámara configurada en server.config.")
    try:
        for _ in range(5):
            success, frame = stream.get_frame()
            if success and frame is not None:
                return frame
        raise RuntimeError("La cámara ESP32 no entregó una imagen.")
    finally:
        stream.disconnect()


def _recognize(frame):
    with _model_lock:
        detector, recognizer = _face_models()
        faces = detector.detect_faces(frame)
        if not faces:
            return {"recognized": False, "reason": "No se detectó un rostro."}
        if len(faces) != 1:
            return {
                "recognized": False,
                "reason": "Debe aparecer una sola persona frente a la cámara.",
            }

        resident_id, confidence = recognizer.recognize_face(faces[0])
        if resident_id == "Desconocido":
            return {
                "recognized": False,
                "reason": "Rostro no registrado.",
                "confidence": round(float(confidence), 4),
            }
        return {
            "recognized": True,
            "residente_id": resident_id,
            "confidence": round(float(confidence), 4),
        }


def _resolve_resident_id(label, token):
    supabase_url = os.environ["SUPABASE_URL"].rstrip("/")
    supabase_key = os.environ["SUPABASE_PUBLISHABLE_KEY"]
    query = urlencode({"select": "id,nombre,apellido,estado"})
    residents = _json_request(
        f"{supabase_url}/rest/v1/residentes?{query}",
        {"apikey": supabase_key, "Authorization": f"Bearer {token}"},
    )
    if not isinstance(residents, list):
        raise RuntimeError("Supabase devolvió una lista de residentes inválida.")

    def normalizar(value):
        value = unicodedata.normalize("NFKD", value)
        return "".join(char for char in value if not unicodedata.combining(char)).casefold().strip()

    resident_by_id = {row["id"]: row for row in residents if isinstance(row.get("id"), str)}
    if label in resident_by_id:
        return label

    legacy_key = normalizar(label)
    matches = [
        row
        for row in residents
        if normalizar(row.get("nombre", "")) == legacy_key
        or normalizar(f"{row.get('nombre', '')} {row.get('apellido', '')}") == legacy_key
    ]
    return matches[0]["id"] if len(matches) == 1 else None


def _ensure_face_status(resident_id, token):
    supabase_url = os.environ["SUPABASE_URL"].rstrip("/")
    supabase_key = os.environ["SUPABASE_PUBLISHABLE_KEY"]
    query = urlencode(
        {
            "select": "id,estado",
            "residente_id": f"eq.{resident_id}",
            "tipo": "eq.Rostro",
            "limit": "1",
        }
    )
    headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {token}",
    }
    rows = _json_request(f"{supabase_url}/rest/v1/biometria?{query}", headers)
    if not isinstance(rows, list):
        raise RuntimeError("Supabase devolvió un estado biométrico inválido.")
    if rows and rows[0].get("estado") == "Registrada":
        return

    fecha = date.today().isoformat()
    payload = json.dumps(
        {
            "estado": "Registrada",
            "fecha_registro": fecha,
            "fecha_actualizacion": fecha,
        }
    ).encode("utf-8")
    if rows:
        status_query = urlencode({"id": f"eq.{rows[0]['id']}"})
        _json_request(
            f"{supabase_url}/rest/v1/biometria?{status_query}",
            {**headers, "Content-Type": "application/json", "Prefer": "return=minimal"},
            method="PATCH",
            body=payload,
        )
    else:
        _json_request(
            f"{supabase_url}/rest/v1/biometria",
            {
                **headers,
                "Content-Type": "application/json",
                "Prefer": "return=minimal",
            },
            method="POST",
            body=json.dumps(
                {
                    "residente_id": resident_id,
                    "tipo": "Rostro",
                    "estado": "Registrada",
                    "fecha_registro": fecha,
                    "fecha_actualizacion": fecha,
                }
            ).encode("utf-8"),
        )


class KioskHandler(BaseHTTPRequestHandler):
    server_version = "SmartAccessFace/1.0"

    def _allowed_origins(self):
        configured = os.environ.get(
            "SMARTACCESS_ALLOWED_ORIGINS",
            "http://localhost:8080,http://127.0.0.1:8080,"
            "http://localhost:5173,http://127.0.0.1:5173",
        )
        return {origin.strip() for origin in configured.split(",") if origin.strip()}

    def _origin_allowed(self, origin):
        if origin in self._allowed_origins():
            return True
        try:
            parsed = urlsplit(origin)
        except ValueError:
            return False
        return (
            parsed.scheme == "http"
            and parsed.hostname in {"localhost", "127.0.0.1"}
            and parsed.username is None
            and parsed.password is None
            and not parsed.path
            and not parsed.query
            and not parsed.fragment
        )

    def _send_json(self, status, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        origin = self.headers.get("Origin")
        if origin and self._origin_allowed(origin):
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Vary", "Origin")
        self.end_headers()
        self.wfile.write(body)

    def _check_origin(self):
        origin = self.headers.get("Origin")
        if origin and not self._origin_allowed(origin):
            self._send_json(403, {"error": "Origen no permitido."})
            return False
        return True

    def _read_json(self):
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError as error:
            raise ValueError("Longitud de solicitud inválida.") from error
        if length < 1 or length > MAX_REQUEST_BYTES:
            raise ValueError("Tamaño de solicitud inválido.")
        try:
            data = json.loads(self.rfile.read(length))
        except json.JSONDecodeError as error:
            raise ValueError("El cuerpo de la solicitud no es JSON válido.") from error
        if not isinstance(data, dict):
            raise ValueError("El cuerpo de la solicitud debe ser un objeto JSON.")
        return data

    def _require_admin(self):
        authorization = self.headers.get("Authorization", "")
        scheme, separator, token = authorization.partition(" ")
        if not separator or scheme.lower() != "bearer" or not token:
            raise PermissionError("Inicia sesión como administrador para usar el kiosco.")
        return _authenticate(token)

    def do_OPTIONS(self):
        if not self._check_origin():
            return
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", self.headers.get("Origin", ""))
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Authorization, Content-Type")
        self.send_header("Access-Control-Max-Age", "600")
        self.send_header("Vary", "Origin")
        self.end_headers()

    def do_GET(self):
        if self.path != "/health":
            self._send_json(404, {"error": "Ruta no encontrada."})
            return
        self._send_json(
            200,
            {"ok": True, "face_source": "webcam" if USE_WEBCAM_LOCAL else "esp32"},
        )

    def do_POST(self):
        if not self._check_origin():
            return
        if self.path not in {"/api/recognize", "/api/register"}:
            self._send_json(404, {"error": "Ruta no encontrada."})
            return

        try:
            self._require_admin()
            data = self._read_json()
            if self.path == "/api/register":
                token = self.headers["Authorization"].partition(" ")[2]
                self._register(data, token)
            else:
                token = self.headers["Authorization"].partition(" ")[2]
                self._recognize(data, token)
        except PermissionError as error:
            self._send_json(403, {"error": str(error)})
        except (ValueError, RuntimeError) as error:
            self._send_json(400, {"error": str(error)})
        except HTTPError as error:
            status = 403 if error.code in (401, 403) else 502
            message = "La sesión no es válida o no tiene permisos de administrador." if status == 403 else f"No se pudo validar la sesión con Supabase: {error}"
            self._send_json(status, {"error": message})
        except URLError as error:
            self._send_json(502, {"error": f"No se pudo conectar con Supabase: {error}"})
        except Exception as error:
            print(f"[API kiosco] Error inesperado: {error}", file=sys.stderr)
            self._send_json(500, {"error": f"Error interno del servicio facial: {error}"})

    def _register(self, data, token):
        global _recognizer
        resident_id = data.get("residente_id")
        if not isinstance(resident_id, str) or not resident_id:
            raise ValueError("Falta el identificador del residente.")
        if len(resident_id) > 80 or any(
            char not in "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-"
            for char in resident_id
        ):
            raise ValueError("El identificador del residente no es válido.")
        supabase_url = os.environ["SUPABASE_URL"].rstrip("/")
        supabase_key = os.environ["SUPABASE_PUBLISHABLE_KEY"]
        query = urlencode(
            {"select": "id", "id": f"eq.{resident_id}", "estado": "eq.Activo", "limit": "1"}
        )
        headers = {
            "apikey": supabase_key,
            "Authorization": f"Bearer {token}",
        }
        residents = _json_request(f"{supabase_url}/rest/v1/residentes?{query}", headers)
        if not isinstance(residents, list) or not residents:
            raise ValueError("No se encontró un residente activo para asociar el rostro.")
        if not _registration_lock.acquire(blocking=False):
            self._send_json(409, {"error": "Ya hay un registro facial en curso."})
            return

        try:
            result = subprocess.run(
                [
                    sys.executable,
                    "-X",
                    "utf8",
                    "-m",
                    "server.training.register",
                    "--username",
                    resident_id,
                ],
                cwd=PROJECT_DIR,
                capture_output=True,
                text=True,
                timeout=600,
                check=False,
            )
            if result.stdout:
                print(result.stdout, end="")
            if result.stderr:
                print(result.stderr, file=sys.stderr, end="")
            if result.returncode != 0:
                details = (result.stderr or result.stdout).strip().splitlines()
                detail = details[-1] if details else "La cámara no pudo completar la captura."
                self._send_json(
                    400,
                    {
                        "error": f"No terminó el registro facial: {detail}",
                    },
                )
                return
            with _model_lock:
                _recognizer = None
            self._send_json(200, {"ok": True})
        except subprocess.TimeoutExpired:
            self._send_json(408, {"error": "El registro superó los 10 minutos y fue cancelado."})
        finally:
            _registration_lock.release()

    def _recognize(self, data, token):
        if USE_WEBCAM_LOCAL:
            frame = _decode_frame(data.get("frame"))
        else:
            frame = _capture_esp32_frame()
        result = _recognize(frame)
        if result.get("recognized") is True:
            resident_id = _resolve_resident_id(result["residente_id"], token)
            if resident_id is None:
                self._send_json(
                    200,
                    {
                        "recognized": False,
                        "reason": "Se reconoció la plantilla, pero no se pudo vincular de forma única con un residente.",
                        "confidence": result["confidence"],
                    },
                )
                return
            result["residente_id"] = resident_id
            _ensure_face_status(resident_id, token)
            result["biometria_registrada"] = True
        self._send_json(200, result)

    def log_message(self, format_string, *args):
        print(f"[API kiosco] {self.address_string()} - {format_string % args}")


def serve():
    host = os.environ.get("SMARTACCESS_FACE_API_HOST", "127.0.0.1")
    port = int(os.environ.get("SMARTACCESS_FACE_API_PORT", "8765"))
    server = ThreadingHTTPServer((host, port), KioskHandler)
    print(f"[API kiosco] Servicio facial local disponible en http://{host}:{port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
