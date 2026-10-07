import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Fingerprint, ScanFace } from "lucide-react";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { meta } from "@/lib/meta";
import type { EventoAcceso } from "@/lib/demo-data";

export const Route = createFileRoute("/kiosco")({
  head: () => meta("Modo kiosco", "Vista del lector biométrico en la puerta del condominio."),
  component: Page,
});

function Page() {
  const { usuario, dispositivos, simularIntento } = useStore();
  const [dispId, setDispId] = useState("");
  const [estado, setEstado] = useState<"espera" | "verificando" | EventoAcceso>("espera");
  const verificar = (metodo: EventoAcceso["metodo"]) => {
    setEstado("verificando");
    setTimeout(() => {
      setEstado(simularIntento({ metodo, dispositivoId: dispId || dispositivos[0]?.id || "", origen: "Kiosco" }));
      setTimeout(() => setEstado("espera"), 4000);
    }, 1400);
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
        <ScanFace className="size-28 opacity-80" />
      </div>
      <div className="text-center">
        <h1 className="font-display text-3xl font-bold">
          {estado === "espera" ? "Acérquese al lector" : estado === "verificando" ? "Verificando identidad…" : res?.resultado === "Autorizado" ? "Acceso autorizado" : "Acceso denegado"}
        </h1>
        <p className="mt-2 opacity-70">{res ? `${res.persona} · ${res.motivo}` : "Cámara y lector simulados — listo para integrar hardware real."}</p>
      </div>
      <div className="flex gap-3">
        <button disabled={estado !== "espera"} onClick={() => verificar("Reconocimiento facial")} className="bg-primary flex items-center gap-2 rounded-xl px-5 py-3 font-semibold disabled:opacity-40"><ScanFace className="size-5" />Rostro</button>
        <button disabled={estado !== "espera"} onClick={() => verificar("Huella dactilar")} className="bg-accent flex items-center gap-2 rounded-xl px-5 py-3 font-semibold disabled:opacity-40"><Fingerprint className="size-5" />Huella</button>
      </div>
    </div>
  );
}
