import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Button, PageIntro, StatCard } from "@/components/kit";
import { toast } from "sonner";
import { TablaEventos } from "@/components/TablaEventos";
import { useStore } from "@/lib/store";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/eventos")({
  head: () => meta("Eventos de acceso", "Monitoreo de intentos de acceso autorizados y rechazados."),
  component: Page,
});

function Page() {
  const { eventos, simularIntento } = useStore();
  const rech = eventos.filter((e) => e.resultado === "Rechazado").length;
  const simular = () => {
    const e = simularIntento();
    if (e.resultado === "Autorizado") toast.success(`Acceso autorizado: ${e.persona}`);
    else toast.error(`Acceso rechazado: ${e.persona}`);
  };
  return (
    <AppShell tituloPagina="Eventos">
      <PageIntro
        titulo="Eventos de acceso"
        descripcion="Todos los intentos registrados por los puntos de acceso."
        accion={<Button onClick={simular}>Simular intento de acceso</Button>}
      />
      <div className="grid grid-cols-3 gap-4">
        <StatCard etiqueta="Total" valor={eventos.length} />
        <StatCard etiqueta="Autorizados" valor={eventos.length - rech} tono="exito" />
        <StatCard etiqueta="Rechazados" valor={rech} tono="peligro" />
      </div>
      <TablaEventos eventos={eventos} />
    </AppShell>
  );
}
