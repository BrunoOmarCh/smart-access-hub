import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { PageIntro } from "@/components/kit";
import { TablaEventos } from "@/components/TablaEventos";
import { useStore } from "@/lib/store";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/historial")({
  head: () => meta("Historial de accesos", "Consulta y filtra el historial de accesos."),
  component: Page,
});

function Page() {
  const { usuario, eventos, miVivienda } = useStore();
  const esAdmin = usuario?.rol === "Administrador";
  const lista = esAdmin ? eventos : eventos.filter((e) => e.viviendaId === miVivienda?.id);
  return (
    <AppShell tituloPagina="Historial">
      <PageIntro titulo="Historial de accesos" descripcion={esAdmin ? "Registro completo con trazabilidad." : "Accesos relacionados con tu vivienda."} />
      <TablaEventos eventos={lista} />
    </AppShell>
  );
}
