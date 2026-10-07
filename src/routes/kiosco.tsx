import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Fingerprint, QrCode, ScanFace } from "lucide-react";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { meta } from "@/lib/meta";
import type { EventoAcceso } from "@/lib/demo-data";
import { codigoPase } from "@/components/PaseInvitado";

export const Route = createFileRoute("/kiosco")({
  head: () => meta("Modo kiosco", "Vista del lector biométrico y de pases QR en la puerta del condominio."),
  component: Page,
});

function Page() {
  const { usuario, dispositivos, invitados, simularIntento, registrarEvento } = useStore();
  const [dispId, setDispId] = useState("");
  const [estado, setEstado] = useState<"espera" | "verificando" | EventoAcceso>("espera");
  const [modoQr, setModoQr] = useState(false);
  const [codigo, setCodigo] = useState("");

  const mostrar = (fn: () => EventoAcceso) => {
    setEstado("verificando");
    setTimeout(() => {
      setEstado(fn());
      setTimeout(() => setEstado("espera"), 4000);
    }, 1400);
  };
  const dispositivo = () => dispId || dispositivos[0]?.id || "";
  const verificar = (metodo: EventoAcceso["metodo"]) =>
    mostrar(() => simularIntento({ metodo, dispositivoId: dispositivo(), origen: "Kiosco" }));

  const verificarQr = () => {
    const texto = codigo.trim();
    if (!texto) return;
    mostrar(() => {
      const inv = invitados.find((i) => codigoPase(i) === texto);
      if (inv) return simularIntento({ invitadoId: inv.id, dispositivoId: dispositivo(), origen: "Kiosco" });
      const ahora = new Date();
      return registrarEvento({
        fecha: ahora.toISOString().slice(0, 10),
        hora: ahora.toTimeString().slice(0, 5),
        persona: "Pase QR no reconocido",
        metodo: "Invitado",
        resultado: "Rechazado",
        dispositivoId: dispositivo(),
        motivo: "Código QR inválido o alterado",
        origen: "Kiosco",
      });
    });
    setCodigo("");
  };

  const res = typeof estado === "object" ? estado : null;
  return (
    <div className="bg-ink text-primary-foreground flex min-h-screen flex-col items-center justify-center gap-8 p-6">
      {usuario ? (
        <Link to="/panel" className="absolute top-5 left-5 flex items-center gap-2 text-sm opacity-70 hover:opacity-100"><ArrowLeft className="size-4" />Volver</Link>
      ) : null}
      <select value={dispId} onChange={(e) => setDispId(e.target.value)} className="absolute top-5 right-5 rounded-lg bg-white/10 px-3 py-1.5 text-sm">
        {dispositivos.map((d) => <option key={d.id} value={d.id} className="text-black">{d.nombre}</option>)}
      </select>
      <p className="font-display text-sm tracking-[0.3em] uppercase opacity-70">Punto de acceso</p>
      <div className={`grid size-64 place-items-center rounded-full ring-8 transition-colors ${res ? (res.resultado === "Autorizado" ? "bg-success/30 ring-success" : "bg-destructive/30 ring-destructive") : "bg-white/5 ring-white/20"} ${estado === "verificando" ? "animate-pulse" : ""}`}>
        {modoQr ? <QrCode className="size-28 opacity-80" /> : <ScanFace className="size-28 opacity-80" />}
      </div>
      <div className="text-center">
        <h1 className="font-display text-3xl font-bold">
          {estado === "espera" ? (modoQr ? "Muestre su pase QR" : "Acérquese al lector") : estado === "verificando" ? (modoQr ? "Validando pase…" : "Verificando identidad…") : res?.resultado === "Autorizado" ? "Acceso autorizado" : "Acceso denegado"}
        </h1>
        <p className="mt-2 opacity-70">{res ? `${res.persona} · ${res.motivo}` : modoQr ? "Lector QR simulado: elija un pase o pegue el código leído." : "Cámara y lector simulados — listo para integrar hardware real."}</p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <button disabled={estado !== "espera"} onClick={() => { setModoQr(false); verificar("Reconocimiento facial"); }} className="bg-primary flex items-center gap-2 rounded-xl px-5 py-3 font-semibold disabled:opacity-40"><ScanFace className="size-5" />Rostro</button>
        <button disabled={estado !== "espera"} onClick={() => { setModoQr(false); verificar("Huella dactilar"); }} className="bg-accent flex items-center gap-2 rounded-xl px-5 py-3 font-semibold disabled:opacity-40"><Fingerprint className="size-5" />Huella</button>
        <button disabled={estado !== "espera"} onClick={() => setModoQr((v) => !v)} className={`flex items-center gap-2 rounded-xl px-5 py-3 font-semibold ring-1 ring-white/30 disabled:opacity-40 ${modoQr ? "bg-white/20" : "bg-white/5"}`}><QrCode className="size-5" />Pase QR</button>
      </div>
      {modoQr ? (
        <div className="flex w-full max-w-md flex-col gap-3">
          <select aria-label="Pase de invitado a escanear" value="" onChange={(e) => setCodigo(e.target.value)} className="rounded-lg bg-white/10 px-3 py-2 text-sm">
            <option value="" className="text-black">Simular escaneo de un pase…</option>
            {invitados.map((i) => <option key={i.id} value={codigoPase(i)} className="text-black">{i.nombre} {i.apellido} — {i.estado}</option>)}
          </select>
          <div className="flex gap-2">
            <input aria-label="Código QR" value={codigo} onChange={(e) => setCodigo(e.target.value)} onKeyDown={(e) => e.key === "Enter" && verificarQr()} placeholder="SMARTACCESS:PASE:…" className="flex-1 rounded-lg bg-white/10 px-3 py-2 font-mono text-xs placeholder:opacity-50" />
            <button disabled={estado !== "espera" || !codigo.trim()} onClick={verificarQr} className="bg-primary rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-40">Validar</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
