import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Badge, PageIntro, Panel, Table, Td } from "@/components/kit";
import { useStore } from "@/lib/store";
import { fechaCorta, meta } from "@/lib/meta";

export const Route = createFileRoute("/auditoria")({
  head: () => meta("Bitácora de auditoría", "Registro de quién creó, editó o revocó cada permiso."),
  component: Page,
});

function Page() {
  const { auditoria } = useStore();
  return (
    <AppShell tituloPagina="Auditoría">
      <PageIntro titulo="Bitácora de auditoría" descripcion="Trazabilidad de cada acción administrativa realizada en esta sesión." />
      <Panel>
        <div className="pt-2" />
        <Table columnas={["Fecha", "Actor", "Acción", "Entidad", "Detalle"]}>
          {auditoria.map((a) => (
            <tr key={a.id}>
              <Td className="text-xs whitespace-nowrap">{fechaCorta(a.fecha)}</Td>
              <Td className="text-ink font-semibold">{a.actor}<span className="text-muted-foreground block text-[11px] font-normal">{a.rol}</span></Td>
              <Td><Badge>{a.accion}</Badge></Td>
              <Td>{a.entidad}</Td>
              <Td>{a.detalle}</Td>
            </tr>
          ))}
        </Table>
      </Panel>
    </AppShell>
  );
}
