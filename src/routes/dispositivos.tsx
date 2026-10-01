import { createFileRoute } from "@tanstack/react-router";
import { Cpu, Plus } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button, EstadoBadge, Field, Input, Modal, PageIntro, Select } from "@/components/kit";
import { useStore } from "@/lib/store";
import { meta } from "@/lib/meta";
import type { Dispositivo, TipoDispositivo } from "@/lib/demo-data";

export const Route = createFileRoute("/dispositivos")({
  head: () => meta("Dispositivos", "Controladores, cámaras, lectores y cerraduras del condominio."),
  component: Page,
});

const tipos: TipoDispositivo[] = ["Controlador de acceso", "Cámara", "Lector biométrico", "Sensor", "Cerradura/Relé"];
const estados: Dispositivo["estado"][] = ["Online", "Offline", "Mantenimiento"];

function Page() {
  const { dispositivos, crearDispositivo, actualizarDispositivo } = useStore();
  const [abierto, setAbierto] = useState(false);
  const [f, setF] = useState({ nombre: "", tipo: "Controlador de acceso" as TipoDispositivo, ubicacion: "", identificador: "", estado: "Offline" as Dispositivo["estado"] });
  const guardar = (e: React.FormEvent) => { e.preventDefault(); crearDispositivo(f); setAbierto(false); };

  return (
    <AppShell tituloPagina="Dispositivos">
      <PageIntro titulo="Dispositivos" descripcion="Estado simulado. La conexión IoT real se integrará en una fase posterior." accion={<Button onClick={() => setAbierto(true)}><Plus className="size-4" />Nuevo dispositivo</Button>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {dispositivos.map((d) => (
          <div key={d.id} className="glass rounded-3xl p-5">
            <div className="flex items-start justify-between">
              <span className="bg-brand-soft text-primary grid size-10 place-items-center rounded-xl"><Cpu className="size-5" /></span>
              <EstadoBadge estado={d.estado} />
            </div>
            <p className="font-display text-ink mt-4 text-lg font-bold">{d.nombre}</p>
            <p className="text-muted-foreground text-xs">{d.tipo} · {d.ubicacion}</p>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div><dt className="text-muted-foreground">ID</dt><dd className="text-ink font-mono">{d.identificador}</dd></div>
              <div><dt className="text-muted-foreground">Última conexión</dt><dd className="text-ink">{d.ultimaConexion}</dd></div>
            </dl>
            <Select className="mt-4" value={d.estado} onChange={(e) => actualizarDispositivo(d.id, { estado: e.target.value as Dispositivo["estado"] })}>
              {estados.map((s) => <option key={s}>{s}</option>)}
            </Select>
          </div>
        ))}
      </div>
      <Modal abierto={abierto} onClose={() => setAbierto(false)} titulo="Nuevo dispositivo">
        <form onSubmit={guardar} className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre"><Input required value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} /></Field>
          <Field label="Tipo"><Select value={f.tipo} onChange={(e) => setF({ ...f, tipo: e.target.value as TipoDispositivo })}>{tipos.map((t) => <option key={t}>{t}</option>)}</Select></Field>
          <Field label="Ubicación"><Input required value={f.ubicacion} onChange={(e) => setF({ ...f, ubicacion: e.target.value })} /></Field>
          <Field label="Identificador"><Input required value={f.identificador} onChange={(e) => setF({ ...f, identificador: e.target.value })} /></Field>
          <div className="flex justify-end gap-2 sm:col-span-2"><Button type="button" variante="suave" onClick={() => setAbierto(false)}>Cancelar</Button><Button type="submit">Guardar</Button></div>
        </form>
      </Modal>
    </AppShell>
  );
}
