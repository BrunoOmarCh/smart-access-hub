import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Badge, Field, Input, PageIntro, Panel, PanelHeader } from "@/components/kit";
import { CONDOMINIO } from "@/lib/demo-data";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/configuracion")({
  head: () => meta("Configuración", "Datos del condominio y políticas de privacidad."),
  component: Page,
});

const politicas = [
  "No se almacenan imágenes faciales ni huellas en bruto.",
  "Las plantillas biométricas se guardan protegidas y cifradas.",
  "Se registran solo los datos mínimos necesarios.",
  "Todo acceso queda registrado para trazabilidad.",
  "Los permisos de invitados expiran automáticamente.",
];

function Page() {
  return (
    <AppShell tituloPagina="Configuración">
      <PageIntro titulo="Configuración" descripcion="Parámetros generales del condominio." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <PanelHeader titulo="Condominio" />
          <div className="space-y-4 p-5">
            <Field label="Nombre"><Input defaultValue={CONDOMINIO.nombre} /></Field>
            <Field label="Dirección"><Input defaultValue={CONDOMINIO.direccion} /></Field>
            <Field label="Descripción"><Input defaultValue={CONDOMINIO.descripcion} /></Field>
          </div>
        </Panel>
        <Panel>
          <PanelHeader titulo="Privacidad y protección de datos" />
          <ul className="space-y-2 p-5">
            {politicas.map((p) => (
              <li key={p} className="bg-surface/60 flex items-center justify-between gap-3 rounded-xl p-3 text-sm">
                <span className="text-ink/80">{p}</span><Badge tono="exito" punto>Activa</Badge>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel className="lg:col-span-2">
          <PanelHeader titulo="Integraciones futuras" descripcion="Preparadas en la arquitectura del MVP." />
          <div className="flex flex-wrap gap-2 p-5">
            {["Reconocimiento facial", "Huella dactilar", "Controladores IoT", "Cerraduras/Relés", "Notificaciones"].map((i) => <Badge key={i} tono="alerta">{i} · Pendiente</Badge>)}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
