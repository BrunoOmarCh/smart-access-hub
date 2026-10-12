# Smart Access Hub

Construye una plataforma web moderna, profesional y responsive para un sistema de control de acceso inteligente para condominios basado en reconocimiento biométrico multimodal y protección de datos.

Esta versión es un MVP local. El kiosco puede leer pases QR de un solo uso y verificar rostros; la huella y la comunicación con cerraduras físicas requieren sus respectivos lectores/controladores.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/e28bde4a-4a41-4046-b594-41e5403cd647).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Desarrollo local

Se requiere Node.js, npm y Docker Desktop iniciado. La base de datos, Auth y la API corren localmente con Supabase CLI; no se usa el proyecto remoto para `npm run dev`.

```sh
npm install
npm run dev
```

La primera ejecución descarga e inicia los contenedores locales y puede tardar unos minutos. El servidor web queda en <http://localhost:8080>; Supabase Studio, en <http://127.0.0.1:54323>.

`npm run db:stop` detiene los contenedores. `npm run db:reset` reinicia la base local, vuelve a aplicar las migraciones y carga datos de demostración; **borra los datos que se hayan guardado en esa base local**.

Las cuentas locales son `admin@smartaccess.demo` y `residente@smartaccess.demo`, ambas con clave `demo1234`. Son credenciales de demostración y no deben usarse en producción. Las confirmaciones por correo están deshabilitadas solo para el entorno local, así que se puede probar una solicitud y su aprobación sin configurar un proveedor de correo.

La migración local se mantiene en `supabase/migrations/`; el SQL de esquema original permanece en `drizzle/migrations/`. El registro de solicitudes, residentes, viviendas, invitados, equipos, eventos y auditoría se guarda en el PostgreSQL local dentro del volumen de Docker.

### Kiosco QR y reconocimiento facial

`npm run dev` inicia la API facial local junto con Supabase y la web cuando existe `esp32-cam/venv`. Si el entorno todavía no existe, créalo e instala las dependencias:

```powershell
python -m venv esp32-cam/venv
esp32-cam/venv/Scripts/python.exe -m pip install -r esp32-cam/requirements.txt
```

El administrador puede registrar un rostro desde **Residentes → Editar → Registrar rostro**. Se abre la ventana de captura de Python; la plantilla protegida se guarda localmente bajo el ID del residente y solo se registra su estado en PostgreSQL. Mantén `server/database/users.json` y `server/database/embeddings/` fuera del control de versiones.

En el kiosco, inicia sesión como administrador y permite el acceso a la cámara del navegador para leer QR o capturar el rostro. Para usar la cámara ESP32 en el reconocimiento facial, cambia `USE_WEBCAM_LOCAL` a `False` y configura `ESP32_STREAM_URL` en `esp32-cam/server/config.py`. Los pases QR se validan y consumen atómicamente en PostgreSQL; un pase usado no puede autorizar otro ingreso.

Para conectar el firmware ESP32 a tu red, copia `esp32-cam/esp32/camera_stream/secrets.example.h` como `secrets.h` en esa misma carpeta y completa allí el SSID y la contraseña. `secrets.h` se excluye de Git.
