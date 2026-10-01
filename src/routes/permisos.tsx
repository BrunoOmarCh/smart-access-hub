import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Badge, EstadoBadge, PageIntro, Panel, Table, Td } from "@/components/kit";
import { useStore } from "@/lib/store";
import { fechaCorta, meta } from "@/lib/meta";

export const Route = createFileRoute("/permisos")({
  head: () => meta("Permisos de acceso", "Permisos vigentes de residentes e invitados."),
  component: Page,
});

function Page() {
  const { usuario, permisos, miVivienda, nombreVivienda } = useStore();
  const lista = usuario?.rol === "Administrador" ? permisos : permisos.filter((p) => p.viviendaId === miVivienda?.id);
  return (
    <AppShell tituloPagina="Permisos de acceso">
      <PageIntro titulo="Permisos de acceso" descripcion="Quién puede ingresar, por qué medio y durante qué periodo." />
      <Panel>
        <div className="pt-2" />
        <Table columnas={["Persona", "Tipo", "Vivienda", "Método", "Vigencia", "Estado"]}>
          {lista.map((p) => (
            <tr key={p.id}>
              <Td className="text-ink font-semibold">{p.persona}</Td>
              <Td><Badge tono={p.tipo === "Residente" ? "marca" : "neutro"}>{p.tipo}</Badge></Td>
              <Td>{nombreVivienda(p.viviendaId)}</Td>
              <Td>{p.metodo}</Td>
              <Td className="text-xs">{p.fin ? `${fechaCorta(p.inicio)} → ${fechaCorta(p.fin)}` : `Desde ${p.inicio} · Permanente`}</Td>
              <Td><EstadoBadge estado={p.estado} /></Td>
            </tr>
          ))}
        </Table>
      </Panel>
    </AppShell>
  );
}
