import { createFileRoute } from "@tanstack/react-router";
import { Fingerprint, ScanFace, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EstadoBadge, PageIntro, Panel, PanelHeader, Table, Td } from "@/components/kit";
import { useStore } from "@/lib/store";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/biometria")({
  head: () => meta("Biometría", "Estado de las referencias biométricas protegidas de los residentes."),
  component: Page,
});

function Page() {
  const { biometria, nombreResidente } = useStore();
  return (
    <AppShell tituloPagina="Biometría">
      <PageIntro titulo="Referencias biométricas" descripcion="Solo se muestra el estado del registro, nunca datos biométricos." />
      <div className="grid gap-4 md:grid-cols-3">
        {[
          [ScanFace, "Reconocimiento facial", "Módulo preparado para integración futura."],
          [Fingerprint, "Huella dactilar", "Módulo preparado para integración futura."],
          [ShieldCheck, "Protección de datos", "Sin imágenes almacenadas; plantillas cifradas."],
        ].map(([I, t, d]) => {
          const Icono = I as typeof ShieldCheck;
          return (
            <div key={t as string} className="glass rounded-3xl p-5">
              <span className="bg-brand-soft text-primary grid size-10 place-items-center rounded-xl"><Icono className="size-5" /></span>
              <p className="font-display text-ink mt-3 font-bold">{t as string}</p>
              <p className="text-muted-foreground text-xs">{d as string}</p>
            </div>
          );
        })}
      </div>
      <Panel>
        <PanelHeader titulo="Estado por residente" />
        <div className="mt-3">
          <Table columnas={["Residente", "Tipo", "Estado", "Registro", "Actualización"]}>
            {biometria.map((b) => (
              <tr key={b.id}>
                <Td className="text-ink font-semibold">{nombreResidente(b.residenteId)}</Td>
                <Td>{b.tipo}</Td>
                <Td><EstadoBadge estado={b.estado} /></Td>
                <Td>{b.fechaRegistro || "—"}</Td>
                <Td>{b.fechaActualizacion || "—"}</Td>
              </tr>
            ))}
          </Table>
        </div>
      </Panel>
    </AppShell>
  );
}
