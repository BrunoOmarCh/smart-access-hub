import { BrowserQRCodeReader } from "@zxing/browser";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Fingerprint, QrCode, ScanFace } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { EventoAcceso } from "@/lib/demo-data";
import { useStore } from "@/lib/store";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/kiosco")({
  head: () =>
    meta("Modo kiosco", "Lectura de pases QR y reconocimiento facial en el punto de acceso."),
  component: Page,
});

function Page() {
  const {
    usuario,
    cargado,
    dispositivos,
    residentes,
    biometria,
    validarPase,
    verificarRostro: solicitarReconocimientoFacial,
    registrarEvento,
    simularIntento,
  } = useStore();
  const [dispId, setDispId] = useState("");
  const [estado, setEstado] = useState<"espera" | "verificando" | EventoAcceso>("espera");
  const [modoQr, setModoQr] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState("");
  const [camara, setCamara] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const procesandoQr = useRef(false);
  const lectorPausado = useRef(false);
  const reinicioRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const esAdmin = usuario?.rol === "Administrador";

  const iniciarCamara = useCallback(async () => {
    if (camara) return camara;
    if (!navigator.mediaDevices?.getUserMedia)
      throw new Error("Este navegador no permite usar la cámara.");
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: "environment" } },
      });
    } catch (cause) {
      const detail = cause instanceof Error ? cause.message : "permiso denegado";
      throw new Error(
        `No se pudo acceder a la cámara (${detail}). Permite la cámara para localhost en el navegador y cierra otras aplicaciones que la estén usando.`,
      );
    }
    const video = videoRef.current;
    if (video) {
      try {
        video.srcObject = stream;
        await video.play();
      } catch (error) {
        stream.getTracks().forEach((track) => track.stop());
        throw error;
      }
    }
    setCamara(stream);
    return stream;
  }, [camara]);

  const programarReinicio = useCallback(() => {
    if (reinicioRef.current) clearTimeout(reinicioRef.current);
    reinicioRef.current = setTimeout(() => {
      setEstado("espera");
      procesandoQr.current = false;
    }, 5000);
  }, []);

  const procesarQr = useCallback(
    async (texto: string) => {
      if (procesandoQr.current) return;
      if (!esAdmin) {
        setError("Inicia sesión como administrador para validar pases.");
        return;
      }
      procesandoQr.current = true;
      setError("");
      setEstado("verificando");
      try {
        const evento = await validarPase(texto, dispId || dispositivos[0]?.id || "");
        setEstado(evento);
        programarReinicio();
      } catch (cause) {
        setEstado("espera");
        procesandoQr.current = false;
        setError(cause instanceof Error ? cause.message : "No se pudo validar el pase.");
      }
    },
    [dispId, dispositivos, esAdmin, programarReinicio, validarPase],
  );

  useEffect(() => {
    if (!modoQr || !camara || !videoRef.current) return;
    let activo = true;
    let controles: { stop: () => void } | undefined;
    const lector = new BrowserQRCodeReader();
    void lector
      .decodeFromStream(camara, videoRef.current, (resultado) => {
        if (resultado && activo && !procesandoQr.current && !lectorPausado.current) {
          lectorPausado.current = true;
          const texto = resultado.getText();
          setCodigo(texto);
          void procesarQr(texto);
        }
      })
      .then((control) => {
        controles = control;
        if (!activo) control.stop();
      })
      .catch((cause: unknown) => {
        if (activo)
          setError(
            cause instanceof Error
              ? `No se pudo iniciar el lector QR: ${cause.message}`
              : "No se pudo iniciar el lector QR.",
          );
      });
    return () => {
      activo = false;
      controles?.stop();
    };
  }, [camara, modoQr, procesarQr]);

  useEffect(
    () => () => {
      if (reinicioRef.current) clearTimeout(reinicioRef.current);
      camara?.getTracks().forEach((track) => track.stop());
    },
    [camara],
  );

  const capturarRostro = async () => {
    const video = videoRef.current;
    if (!video) throw new Error("No se encontró la cámara del kiosco.");
    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA)
      await new Promise<void>((resolve) =>
        video.addEventListener("loadeddata", () => resolve(), { once: true }),
      );
    if (!video.videoWidth || !video.videoHeight)
      throw new Error("La cámara todavía no ha entregado una imagen.");
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("No se pudo preparar la imagen de la cámara.");
    context.drawImage(video, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.8);
  };

  const verificarRostro = async () => {
    if (!esAdmin) {
      setError("Inicia sesión como administrador para operar el kiosco.");
      return;
    }
    setError("");
    setEstado("verificando");
    try {
      const apiUrl = import.meta.env["VITE_FACE_API_URL"] || "http://127.0.0.1:8765";
      const health = await fetch(`${apiUrl}/health`);
      if (!health.ok) throw new Error("La API facial local no está disponible.");
      const servicio = (await health.json()) as { face_source?: string };
      const frame =
        servicio.face_source === "esp32" ? undefined : await capturarRostroAfterCamera();
      const resultado = await solicitarReconocimientoFacial(frame);
      if (!resultado.reconocido && resultado.motivo !== "Rostro no registrado.") {
        setEstado("espera");
        setError(resultado.motivo ?? "No se pudo detectar un rostro.");
        return;
      }

      const residente = resultado.residenteId
        ? residentes.find((r) => r.id === resultado.residenteId)
        : undefined;
      const rostroRegistrado =
        Boolean(resultado.biometriaRegistrada) ||
        Boolean(
          residente &&
          biometria.some(
            (b) =>
              b.residenteId === residente.id && b.tipo === "Rostro" && b.estado === "Registrada",
          ),
        );
      const autorizado = Boolean(residente && residente.estado === "Activo" && rostroRegistrado);
      const ahora = new Date();
      const fecha = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, "0")}-${String(ahora.getDate()).padStart(2, "0")}`;
      const hora = `${String(ahora.getHours()).padStart(2, "0")}:${String(ahora.getMinutes()).padStart(2, "0")}`;
      const evento = registrarEvento({
        fecha,
        hora,
        persona: residente
          ? `${residente.nombre} ${residente.apellido}`
          : "Persona no identificada",
        viviendaId: residente?.viviendaId || undefined,
        metodo: "Reconocimiento facial",
        resultado: autorizado ? "Autorizado" : "Rechazado",
        dispositivoId: dispId || dispositivos[0]?.id || "",
        motivo: !resultado.reconocido
          ? (resultado.motivo ?? "Rostro no registrado")
          : !residente
            ? "La plantilla no está vinculada a un residente"
            : residente.estado !== "Activo"
              ? "Residente inactivo"
              : !rostroRegistrado
                ? "El estado biométrico no está registrado"
                : `Rostro reconocido (${((resultado.confianza ?? 0) * 100).toFixed(1)}%)`,
        origen: "Kiosco",
      });
      setEstado(evento);
      programarReinicio();
    } catch (cause) {
      setEstado("espera");
      setError(cause instanceof Error ? cause.message : "Falló la verificación facial.");
    }
  };

  const capturarRostroAfterCamera = async () => {
    await iniciarCamara();
    return capturarRostro();
  };

  const res = typeof estado === "object" ? estado : null;
  return (
    <div className="bg-ink text-primary-foreground flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      {usuario ? (
        <Link
          to="/panel"
          className="absolute top-5 left-5 flex items-center gap-2 text-sm opacity-70 hover:opacity-100"
        >
          <ArrowLeft className="size-4" />
          Volver
        </Link>
      ) : null}
      <select
        value={dispId}
        onChange={(e) => setDispId(e.target.value)}
        className="absolute top-5 right-5 rounded-lg bg-white/10 px-3 py-1.5 text-sm"
        aria-label="Dispositivo de acceso"
      >
        {dispositivos.map((d) => (
          <option key={d.id} value={d.id} className="text-black">
            {d.nombre}
          </option>
        ))}
      </select>
      <p className="font-display text-sm tracking-[0.3em] uppercase opacity-70">Punto de acceso</p>
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className={
          camara ? "aspect-video w-full max-w-md rounded-2xl bg-black object-cover" : "hidden"
        }
      />
      {!camara ? (
        <div
          className={`grid size-64 place-items-center rounded-full ring-8 transition-colors ${res ? (res.resultado === "Autorizado" ? "bg-success/30 ring-success" : "bg-destructive/30 ring-destructive") : "bg-white/5 ring-white/20"} ${estado === "verificando" ? "animate-pulse" : ""}`}
        >
          {modoQr ? (
            <QrCode className="size-28 opacity-80" />
          ) : (
            <ScanFace className="size-28 opacity-80" />
          )}
        </div>
      ) : null}
      <div className="text-center">
        <h1 className="font-display text-3xl font-bold">
          {estado === "espera"
            ? modoQr
              ? "Muestre su pase QR"
              : "Acérquese al lector"
            : estado === "verificando"
              ? modoQr
                ? "Validando pase…"
                : "Verificando identidad…"
              : res?.resultado === "Autorizado"
                ? "Acceso autorizado"
                : "Acceso denegado"}
        </h1>
        <p className="mt-2 opacity-70">
          {error ||
            (res
              ? `${res.persona} · ${res.motivo}`
              : modoQr
                ? camara
                  ? "Apunte la cámara al código del pase."
                  : "Activa la cámara o introduce el código manualmente."
                : "El reconocimiento facial consulta las plantillas protegidas del servidor local.")}
        </p>
        {res?.metodo === "Invitado" && res.persona !== "Pase QR no reconocido" ? (
          <p
            role="status"
            className={`mx-auto mt-3 w-fit rounded-full px-3 py-1 text-xs font-semibold ${res.resultado === "Autorizado" || res.motivo === "Este pase ya fue usado" ? "bg-amber-400/20 text-amber-200" : "bg-white/10 text-white/80"}`}
          >
            Estado del pase:{" "}
            {res.resultado === "Autorizado" || res.motivo === "Este pase ya fue usado"
              ? "Usado"
              : "No usado"}
          </p>
        ) : null}
        {!cargado ? (
          <p role="status" className="mt-3 text-sm text-white/70">
            Comprobando la sesión del administrador...
          </p>
        ) : !esAdmin ? (
          <div className="mt-3 text-sm text-amber-200">
            <p>El kiosco requiere una sesión de administrador para validar accesos.</p>
            <Link to="/" className="mt-1 inline-block underline underline-offset-4">
              Ir a iniciar sesión
            </Link>
          </div>
        ) : null}
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <button
          disabled={estado !== "espera" || !cargado || !esAdmin}
          onClick={() => {
            setModoQr(false);
            void verificarRostro();
          }}
          className="bg-primary flex items-center gap-2 rounded-xl px-5 py-3 font-semibold disabled:opacity-40"
        >
          <ScanFace className="size-5" />
          Verificar rostro
        </button>
        <button
          disabled={estado !== "espera" || !cargado || !esAdmin}
          onClick={() => {
            setModoQr(false);
            const evento = simularIntento({
              metodo: "Huella dactilar",
              dispositivoId: dispId || dispositivos[0]?.id || "",
              origen: "Kiosco",
            });
            setEstado(evento);
            programarReinicio();
          }}
          className="bg-accent flex items-center gap-2 rounded-xl px-5 py-3 font-semibold disabled:opacity-40"
        >
          <Fingerprint className="size-5" />
          Huella (demo)
        </button>
        <button
          disabled={estado !== "espera" || !cargado || !esAdmin}
          onClick={() => {
            setError("");
            lectorPausado.current = false;
            if (!modoQr)
              void iniciarCamara().catch((cause: unknown) => {
                setError(
                  cause instanceof Error ? cause.message : "No se pudo acceder a la cámara.",
                );
              });
            setModoQr((actual) => !actual);
          }}
          className={`flex items-center gap-2 rounded-xl px-5 py-3 font-semibold ring-1 ring-white/30 disabled:opacity-40 ${modoQr ? "bg-white/20" : "bg-white/5"}`}
        >
          <QrCode className="size-5" />
          {modoQr ? "Cerrar lector QR" : "Pase QR"}
        </button>
      </div>
      {modoQr ? (
        <div className="flex w-full max-w-md flex-col gap-3">
          <div className="flex gap-2">
            <input
              aria-label="Código QR"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void procesarQr(codigo)}
              placeholder="SMARTACCESS:PASE:…"
              className="flex-1 rounded-lg bg-white/10 px-3 py-2 font-mono text-xs placeholder:opacity-50"
            />
            <button
              disabled={estado !== "espera" || !codigo.trim() || !esAdmin}
              onClick={() => void procesarQr(codigo)}
              className="bg-primary rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-40"
            >
              Validar
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
