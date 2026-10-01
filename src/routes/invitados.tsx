import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button, EstadoBadge, Field, Input, Modal, PageIntro, Panel, Select, Table, Td, ErrorMsg } from "@/components/kit";
import { useStore } from "@/lib/store";
import { fechaCorta, meta } from "@/lib/meta";

export const Route = createFileRoute("/invitados")({
  head: () => meta("Invitados", "Permisos temporales de acceso para invitados."),
  component: Page,
});

function Page() {
  const { usuario, miResidente, invitados, residentes, crearInvitado, actualizarInvitado, nombreVivienda, nombreResidente } = useStore();
  const esAdmin = usuario?.rol === "Administrador";
  const lista = esAdmin ? invitados : invitados.filter((i) => i.anfitrionId === miResidente?.id);
  const [abierto, setAbierto] = useState(false);
  const [error, setError] = useState("");
  const [f, setF] = useState({ nombre: "", apellido: "", documento: "", anfitrionId: "", inicio: "", fin: "" });

  const abrir = () => { setError(""); setF({ nombre: "", apellido: "", documento: "", anfitrionId: miResidente?.id ?? residentes[0]?.id ?? "", inicio: "", fin: "" }); setAbierto(true); };
  const guardar = (e: React.FormEvent) => {
    e.preventDefault();
    if (f.fin <= f.inicio) return setError("La fecha de fin debe ser posterior al inicio.");
    const anfitrion = residentes.find((r) => r.id === f.anfitrionId);
    crearInvitado({ ...f, viviendaId: anfitrion?.viviendaId ?? "", estado: esAdmin ? "Activo" : "Pendiente" });
    setAbierto(false);
  };

  return (
    <AppShell tituloPagina={esAdmin ? "Invitados" : "Mis invitados"}>
      <PageIntro titulo={esAdmin ? "Invitados" : "Mis invitados"} descripcion="Accesos temporales con fecha y hora de vigencia." accion={<Button onClick={abrir}><Plus className="size-4" />Registrar invitado</Button>} />
      <Panel>
        <div className="pt-2" />
        <Table columnas={["Invitado", "Documento", "Anfitrión", "Vigencia", "Estado", ""]}>
          {lista.map((i) => (
            <tr key={i.id}>
              <Td className="text-ink font-semibold">{i.nombre} {i.apellido}</Td>
              <Td>{i.documento}</Td>
              <Td>{nombreResidente(i.anfitrionId)}<span className="text-muted-foreground block text-[11px]">{nombreVivienda(i.viviendaId)}</span></Td>
              <Td className="text-xs whitespace-nowrap">{fechaCorta(i.inicio)}<br />{fechaCorta(i.fin)}</Td>
              <Td><EstadoBadge estado={i.estado} /></Td>
              <Td className="text-right whitespace-nowrap">
                {esAdmin && i.estado === "Pendiente" ? <Button variante="suave" onClick={() => actualizarInvitado(i.id, { estado: "Activo" })}>Aprobar</Button> : null}
                {i.estado === "Activo" || i.estado === "Pendiente" ? <Button variante="peligro" onClick={() => actualizarInvitado(i.id, { estado: "Revocado" })}>Revocar</Button> : null}
              </Td>
            </tr>
          ))}
        </Table>
      </Panel>
      <Modal abierto={abierto} onClose={() => setAbierto(false)} titulo="Registrar invitado" descripcion={esAdmin ? "El permiso queda activo de inmediato." : "El permiso queda pendiente de aprobación."}>
        <form onSubmit={guardar} className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre"><Input required value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} /></Field>
          <Field label="Apellido"><Input required value={f.apellido} onChange={(e) => setF({ ...f, apellido: e.target.value })} /></Field>
          <Field label="Documento"><Input required value={f.documento} onChange={(e) => setF({ ...f, documento: e.target.value })} /></Field>
          <Field label="Anfitrión">
            <Select disabled={!esAdmin} value={f.anfitrionId} onChange={(e) => setF({ ...f, anfitrionId: e.target.value })}>
              {residentes.map((r) => <option key={r.id} value={r.id}>{r.nombre} {r.apellido}</option>)}
            </Select>
          </Field>
          <Field label="Inicio"><Input type="datetime-local" required value={f.inicio} onChange={(e) => setF({ ...f, inicio: e.target.value })} /></Field>
          <Field label="Fin"><Input type="datetime-local" required value={f.fin} onChange={(e) => setF({ ...f, fin: e.target.value })} /></Field>
          <div className="sm:col-span-2"><ErrorMsg>{error}</ErrorMsg></div>
          <div className="flex justify-end gap-2 sm:col-span-2"><Button type="button" variante="suave" onClick={() => setAbierto(false)}>Cancelar</Button><Button type="submit">Registrar</Button></div>
        </form>
      </Modal>
    </AppShell>
  );
}
