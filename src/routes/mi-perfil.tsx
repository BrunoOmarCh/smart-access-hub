import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button, EstadoBadge, Field, Input, PageIntro, Panel, PanelHeader } from "@/components/kit";
import { useStore } from "@/lib/store";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/mi-perfil")({
  head: () => meta("Mi perfil", "Tus datos personales y estado biométrico."),
  component: Page,
});

function Page() {
  const { usuario, actualizarPerfil, biometria, miResidente } = useStore();
  const [f, setF] = useState({ nombre: "", apellido: "", telefono: "" });
  const [ok, setOk] = useState(false);
  useEffect(() => { if (usuario) setF({ nombre: usuario.nombre, apellido: usuario.apellido, telefono: usuario.telefono }); }, [usuario]);
  const bio = biometria.filter((b) => b.residenteId === miResidente?.id);
  return (
    <AppShell tituloPagina="Mi perfil">
      <PageIntro titulo="Mi perfil" descripcion="Mantén tus datos de contacto actualizados." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <PanelHeader titulo="Datos personales" />
          <form className="space-y-4 p-5" onSubmit={(e) => { e.preventDefault(); actualizarPerfil(f); setOk(true); }}>
            <Field label="Nombre"><Input value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} /></Field>
            <Field label="Apellido"><Input value={f.apellido} onChange={(e) => setF({ ...f, apellido: e.target.value })} /></Field>
            <Field label="Teléfono"><Input value={f.telefono} onChange={(e) => setF({ ...f, telefono: e.target.value })} /></Field>
            <Field label="Correo" hint="El correo solo puede cambiarlo un administrador."><Input disabled value={usuario?.correo ?? ""} /></Field>
            <div className="flex items-center gap-3"><Button type="submit">Guardar cambios</Button>{ok ? <span className="text-success text-xs font-semibold">Guardado</span> : null}</div>
          </form>
        </Panel>
        <Panel>
          <PanelHeader titulo="Mi biometría" descripcion="Solo el estado; los datos nunca se muestran." />
          <ul className="space-y-2 p-5">
            {bio.map((b) => (
              <li key={b.id} className="bg-surface/60 flex items-center justify-between rounded-xl p-3 text-sm">
                <span className="text-ink font-semibold">{b.tipo}</span><EstadoBadge estado={b.estado} />
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </AppShell>
  );
}
