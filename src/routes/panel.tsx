import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Badge, EstadoBadge, Panel, PanelHeader, StatCard, Table, Td } from "@/components/kit";
import { useStore } from "@/lib/store";
import { fechaCorta, meta } from "@/lib/meta";

export const Route = createFileRoute("/panel")({
  head: () => meta("Dashboard", "Resumen de accesos, dispositivos y residentes del condominio."),
  component: PanelPage,
});

function PanelPage() {
  const s = useStore();
  if (!s.usuario) return <AppShell tituloPagina="Dashboard">{null}</AppShell>;
  return (
    <AppShell tituloPagina="Dashboard">
      {s.usuario.rol === "Administrador" ? <Admin /> : <Residente />}
    </AppShell>
  );
}

function Admin() {
  const { residentes, viviendas, invitados, dispositivos, eventos, nombreVivienda, nombreDispositivo } = useStore();
  const autorizados = eventos.filter((e) => e.resultado === "Autorizado").length;
  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard etiqueta="Residentes activos" valor={residentes.filter((r) => r.estado === "Activo").length} nota={`${residentes.length} registrados`} />
        <StatCard etiqueta="Viviendas ocupadas" valor={`${viviendas.filter((v) => v.estado === "Ocupada").length}/${viviendas.length}`} />
        <StatCard etiqueta="Invitados activos" valor={invitados.filter((i) => i.estado === "Activo").length} nota={`${invitados.filter((i) => i.estado === "Pendiente").length} pendientes`} tono="alerta" />
        <StatCard etiqueta="Accesos autorizados" valor={`${autorizados}/${eventos.length}`} nota={`${eventos.length - autorizados} rechazados`} tono="peligro" />
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <Panel className="xl:col-span-2">
          <PanelHeader titulo="Eventos recientes" accion={<Link to="/eventos" className="text-primary text-xs font-semibold">Ver todos</Link>} />
          <div className="mt-3">
            <Table columnas={["Fecha", "Persona", "Método", "Dispositivo", "Resultado"]}>
              {eventos.slice(0, 6).map((e) => (
                <tr key={e.id}>
                  <Td className="whitespace-nowrap">{e.fecha} {e.hora}</Td>
                  <Td className="text-ink font-medium">{e.persona}<span className="text-muted-foreground block text-[11px]">{nombreVivienda(e.viviendaId)}</span></Td>
                  <Td>{e.metodo}</Td>
                  <Td>{nombreDispositivo(e.dispositivoId)}</Td>
                  <Td><EstadoBadge estado={e.resultado} /></Td>
                </tr>
              ))}
            </Table>
          </div>
        </Panel>
        <Panel>
          <PanelHeader titulo="Dispositivos" descripcion="Estado simulado (IoT pendiente)" />
          <ul className="space-y-2 p-5">
            {dispositivos.map((d) => (
              <li key={d.id} className="bg-surface/60 flex items-center justify-between gap-2 rounded-xl p-3">
                <div className="min-w-0">
                  <p className="text-ink truncate text-sm font-semibold">{d.nombre}</p>
                  <p className="text-muted-foreground text-[11px]">{d.ubicacion}</p>
                </div>
                <EstadoBadge estado={d.estado} />
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}

function Residente() {
  const { usuario, miVivienda, miResidente, invitados, eventos, biometria } = useStore();
  const mios = invitados.filter((i) => i.anfitrionId === miResidente?.id);
  const misEventos = eventos.filter((e) => e.viviendaId === miVivienda?.id);
  const bio = biometria.filter((b) => b.residenteId === miResidente?.id);
  return (
    <>
      <Panel className="p-6">
        <p className="text-muted-foreground text-sm">Hola,</p>
        <h2 className="font-display text-ink text-2xl font-bold">{usuario?.nombre} {usuario?.apellido}</h2>
        <p className="text-muted-foreground mt-1 text-sm">Vivienda {miVivienda?.codigo} · Torre {miVivienda?.torre} · Piso {miVivienda?.piso}</p>
      </Panel>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard etiqueta="Mis invitados activos" valor={mios.filter((i) => i.estado === "Activo").length} />
        <StatCard etiqueta="Pendientes" valor={mios.filter((i) => i.estado === "Pendiente").length} tono="alerta" />
        <StatCard etiqueta="Accesos de mi vivienda" valor={misEventos.length} />
        <StatCard etiqueta="Biometría registrada" valor={`${bio.filter((b) => b.estado === "Registrada").length}/2`} tono="exito" nota="Rostro y huella" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <PanelHeader titulo="Mis invitados" accion={<Link to="/invitados" className="text-primary text-xs font-semibold">Gestionar</Link>} />
          <ul className="space-y-2 p-5">
            {mios.length === 0 ? <p className="text-muted-foreground text-sm">Sin invitados.</p> : mios.map((i) => (
              <li key={i.id} className="bg-surface/60 flex items-center justify-between rounded-xl p-3">
                <div><p className="text-ink text-sm font-semibold">{i.nombre} {i.apellido}</p><p className="text-muted-foreground text-[11px]">Hasta {fechaCorta(i.fin)}</p></div>
                <EstadoBadge estado={i.estado} />
              </li>
            ))}
          </ul>
        </Panel>
        <Panel>
          <PanelHeader titulo="Últimos accesos" accion={<Link to="/historial" className="text-primary text-xs font-semibold">Historial</Link>} />
          <ul className="space-y-2 p-5">
            {misEventos.slice(0, 5).map((e) => (
              <li key={e.id} className="bg-surface/60 flex items-center justify-between rounded-xl p-3">
                <div><p className="text-ink text-sm font-semibold">{e.persona}</p><p className="text-muted-foreground text-[11px]">{e.fecha} {e.hora} · {e.metodo}</p></div>
                <Badge tono={e.resultado === "Autorizado" ? "exito" : "peligro"} punto>{e.resultado}</Badge>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}
