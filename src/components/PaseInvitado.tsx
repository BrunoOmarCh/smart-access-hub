import { QRCodeSVG } from "qrcode.react";
import { Button, EstadoBadge, Modal } from "@/components/kit";
import type { Invitado } from "@/lib/demo-data";
import { CONDOMINIO } from "@/lib/demo-data";
import { fechaCorta } from "@/lib/meta";

/** Contenido del QR: lo que leería el lector en portería (sin datos personales sensibles). */
export const codigoPase = (i: Invitado) => `SMARTACCESS:PASE:${i.id}:${new Date(i.fin).getTime().toString(36)}`;

export function PaseInvitado({ invitado, onClose, anfitrion, vivienda }: { invitado: Invitado | null; onClose: () => void; anfitrion: string; vivienda: string }) {
  const imprimir = () => {
    const nodo = document.getElementById("pase-imprimible");
    const w = window.open("", "_blank");
    if (!nodo || !w) return;
    w.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Pase de invitado</title><style>body{font-family:Inter,system-ui,sans-serif;display:grid;place-items:center;padding:40px}div{text-align:center}</style></head><body>${nodo.innerHTML}<script>window.onload=()=>window.print()</script></body></html>`);
    w.document.close();
  };
  return (
    <Modal abierto={!!invitado} onClose={onClose} titulo="Pase temporal de invitado" descripcion="Código simulado: en producción lo leerá el lector QR de portería.">
      {invitado ? (
        <div className="space-y-4">
          <div id="pase-imprimible" className="rounded-2xl border border-dashed border-border bg-white p-6 text-center text-black">
            <div>
              <p style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "#555" }}>{CONDOMINIO.nombre}</p>
              <h3 style={{ fontSize: 20, fontWeight: 700, margin: "6px 0 14px" }}>{invitado.nombre} {invitado.apellido}</h3>
              <QRCodeSVG value={codigoPase(invitado)} size={180} style={{ margin: "0 auto" }} />
              <p style={{ fontFamily: "monospace", fontSize: 11, marginTop: 10 }}>{invitado.id.toUpperCase()}</p>
              <p style={{ fontSize: 12, marginTop: 10 }}>Anfitrión: {anfitrion} · {vivienda}</p>
              <p style={{ fontSize: 12 }}>Válido: {fechaCorta(invitado.inicio)} → {fechaCorta(invitado.fin)}</p>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <EstadoBadge estado={invitado.estado} />
            <Button onClick={imprimir} disabled={invitado.estado !== "Activo"}>Imprimir pase</Button>
          </div>
          {invitado.estado !== "Activo" ? <p className="text-muted-foreground text-xs">Solo los pases activos se pueden imprimir.</p> : null}
        </div>
      ) : null}
    </Modal>
  );
}
