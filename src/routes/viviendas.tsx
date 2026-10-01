import { createFileRoute } from "@tanstack/react-router";
import { Building2, Plus } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button, EstadoBadge, Field, Input, Modal, PageIntro, Select } from "@/components/kit";
import { useStore } from "@/lib/store";
import { meta } from "@/lib/meta";
import type { Vivienda } from "@/lib/demo-data";

export const Route = createFileRoute("/viviendas")({
  head: () => meta("Viviendas", "Unidades habitacionales del condominio y su ocupación."),
  component: Page,
});

function Page() {
  const { viviendas, residentes, crearVivienda, actualizarVivienda } = useStore();
  const [abierto, setAbierto] = useState(false);
  const [editando, setEditando] = useState<Vivienda | null>(null);
  const [f, setF] = useState<Omit<Vivienda, "id">>({ codigo: "", torre: "A", piso: 1, estado: "Disponible" });
  const abrir = (v?: Vivienda) => { setEditando(v ?? null); setF(v ? { ...v } : { codigo: "", torre: "A", piso: 1, estado: "Disponible" }); setAbierto(true); };
  const guardar = (e: React.FormEvent) => { e.preventDefault(); editando ? actualizarVivienda(editando.id, f) : crearVivienda(f); setAbierto(false); };

  return (
    <AppShell tituloPagina="Viviendas">
      <PageIntro titulo="Viviendas" descripcion="Unidades del condominio y residentes vinculados." accion={<Button onClick={() => abrir()}><Plus className="size-4" />Nueva vivienda</Button>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {viviendas.map((v) => {
          const rs = residentes.filter((r) => r.viviendaId === v.id);
          return (
            <div key={v.id} className="glass rounded-3xl p-5">
              <div className="flex items-start justify-between">
                <span className="bg-brand-soft text-primary grid size-10 place-items-center rounded-xl"><Building2 className="size-5" /></span>
                <EstadoBadge estado={v.estado} />
              </div>
              <p className="font-display text-ink mt-4 text-xl font-bold">{v.codigo}</p>
              <p className="text-muted-foreground text-xs">Torre {v.torre} · Piso {v.piso}</p>
              <div className="mt-3 space-y-1 text-sm">
                {rs.length ? rs.map((r) => <p key={r.id} className="text-ink/80">{r.nombre} {r.apellido}</p>) : <p className="text-muted-foreground">Sin residentes</p>}
              </div>
              <Button variante="suave" className="mt-4 w-full" onClick={() => abrir(v)}>Editar</Button>
            </div>
          );
        })}
      </div>
      <Modal abierto={abierto} onClose={() => setAbierto(false)} titulo={editando ? "Editar vivienda" : "Nueva vivienda"}>
        <form onSubmit={guardar} className="grid gap-4 sm:grid-cols-2">
          <Field label="Código"><Input required value={f.codigo} onChange={(e) => setF({ ...f, codigo: e.target.value })} placeholder="A-101" /></Field>
          <Field label="Torre"><Input required value={f.torre} onChange={(e) => setF({ ...f, torre: e.target.value })} /></Field>
          <Field label="Piso"><Input type="number" min={1} value={f.piso} onChange={(e) => setF({ ...f, piso: Number(e.target.value) })} /></Field>
          <Field label="Estado"><Select value={f.estado} onChange={(e) => setF({ ...f, estado: e.target.value as Vivienda["estado"] })}><option>Ocupada</option><option>Disponible</option><option>Inactiva</option></Select></Field>
          <div className="flex justify-end gap-2 sm:col-span-2"><Button type="button" variante="suave" onClick={() => setAbierto(false)}>Cancelar</Button><Button type="submit">Guardar</Button></div>
        </form>
      </Modal>
    </AppShell>
  );
}
