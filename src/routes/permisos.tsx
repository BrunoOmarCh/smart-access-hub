import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Badge, Button, EstadoBadge, PageIntro, Panel, Table, Td } from "@/components/kit";
import { useStore } from "@/lib/store";
import { fechaCorta, fechaRelativa, meta } from "@/lib/meta";
import { descargarCSV, imprimirPDF } from "@/lib/exportar";

export const Route = createFileRoute("/permisos")({
  head: () => meta("Permisos de acceso", "Permisos vigentes de residentes e invitados."),
  component: Page,
});

function Page() {
  const { usuario, permisos, miVivienda, nombreVivienda } = useStore();
  const lista = usuario?.rol === "Administrador" ? permisos : permisos.filter((p) => p.viviendaId === miVivienda?.id);
  const vigencia = (p: (typeof lista)[number]) => (p.fin ? `${fechaCorta(p.inicio)} → ${fechaCorta(p.fin)}` : `Desde ${p.inicio} · Permanente`);
  const columnas = ["Persona", "Tipo", "Vivienda", "Método", "Vigencia", "Estado"];
  const filas = () => lista.map((p) => [p.persona, p.tipo, nombreVivienda(p.viviendaId), p.metodo, vigencia(p), p.estado]);
  return (
    <AppShell tituloPagina="Permisos de acceso">
      <PageIntro
        titulo="Permisos de acceso"
        descripcion="Quién puede ingresar, por qué medio y durante qué periodo."
        accion={
          <div className="flex gap-2">
            <Button variante="suave" onClick={() => descargarCSV("permisos", columnas, filas())}>Exportar CSV</Button>
            <Button variante="suave" onClick={() => imprimirPDF("Reporte de permisos de acceso", columnas, filas())}>Exportar PDF</Button>
          </div>
        }
      />
      <Panel>
        <div className="pt-2" />
        <Table columnas={columnas}>
          {lista.map((p) => (
            <tr key={p.id}>
              <Td className="text-ink font-semibold">{p.persona}</Td>
              <Td><Badge tono={p.tipo === "Residente" ? "marca" : "neutro"}>{p.tipo}</Badge></Td>
              <Td>{nombreVivienda(p.viviendaId)}</Td>
              <Td>{p.metodo}</Td>
              <Td className="text-xs">
                {vigencia(p)}
                {p.fin ? (
                  <span className="text-muted-foreground block" suppressHydrationWarning>
                    {new Date(p.fin) < new Date() ? "Expiró" : "Expira"} {fechaRelativa(p.fin)}
                  </span>
                ) : null}
              </Td>
              <Td><EstadoBadge estado={p.estado} /></Td>
            </tr>
          ))}
        </Table>
      </Panel>
    </AppShell>
  );
}
