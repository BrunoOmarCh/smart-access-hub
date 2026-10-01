import { createFileRoute } from "@tanstack/react-router";
import { Building2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EstadoBadge, PageIntro, Panel, PanelHeader } from "@/components/kit";
import { useStore } from "@/lib/store";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/mi-vivienda")({
  head: () => meta("Mi vivienda", "Información de tu vivienda y residentes vinculados."),
  component: Page,
});

function Page() {
  const { miVivienda, residentes } = useStore();
  const rs = residentes.filter((r) => r.viviendaId === miVivienda?.id);
  return (
    <AppShell tituloPagina="Mi vivienda">
      <PageIntro titulo="Mi vivienda" descripcion="Datos de tu unidad en el condominio." />
      {miVivienda ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Panel className="p-6">
            <div className="flex items-start justify-between">
              <span className="bg-brand-soft text-primary grid size-12 place-items-center rounded-2xl"><Building2 className="size-6" /></span>
              <EstadoBadge estado={miVivienda.estado} />
            </div>
            <p className="font-display text-ink mt-4 text-3xl font-bold">{miVivienda.codigo}</p>
            <p className="text-muted-foreground text-sm">Torre {miVivienda.torre} · Piso {miVivienda.piso}</p>
          </Panel>
          <Panel>
            <PanelHeader titulo="Residentes vinculados" />
            <ul className="space-y-2 p-5">
              {rs.map((r) => (
                <li key={r.id} className="bg-surface/60 flex items-center justify-between rounded-xl p-3 text-sm">
                  <span className="text-ink font-semibold">{r.nombre} {r.apellido}</span><EstadoBadge estado={r.estado} />
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      ) : null}
    </AppShell>
  );
}
