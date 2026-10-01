import { createFileRoute } from "@tanstack/react-router";
import { Plus, Search } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button, EstadoBadge, Field, Input, Modal, PageIntro, Panel, Select, Table, Td } from "@/components/kit";
import { useStore } from "@/lib/store";
import { meta } from "@/lib/meta";
import type { Residente } from "@/lib/demo-data";

export const Route = createFileRoute("/residentes")({
  head: () => meta("Residentes", "Registro y gestión de residentes del condominio."),
  component: Page,
});

const vacio = { nombre: "", apellido: "", documento: "", correo: "", telefono: "", viviendaId: "", estado: "Activo" as const };

function Page() {
  const { residentes, viviendas, crearResidente, actualizarResidente, nombreVivienda } = useStore();
  const [q, setQ] = useState("");
  const [editando, setEditando] = useState<Residente | null>(null);
  const [abierto, setAbierto] = useState(false);
  const [f, setF] = useState<Omit<Residente, "id" | "fechaRegistro">>(vacio);

  const abrir = (r?: Residente) => {
    setEditando(r ?? null);
    setF(r ? { ...r } : { ...vacio, viviendaId: viviendas[0]?.id ?? "" });
    setAbierto(true);
  };
  const guardar = (e: React.FormEvent) => {
    e.preventDefault();
    editando ? actualizarResidente(editando.id, f) : crearResidente(f);
    setAbierto(false);
  };
  const lista = residentes.filter((r) => `${r.nombre} ${r.apellido} ${r.documento}`.toLowerCase().includes(q.toLowerCase()));
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  return (
    <AppShell tituloPagina="Residentes">
      <PageIntro titulo="Residentes" descripcion="Personas autorizadas a vivir en el condominio." accion={<Button onClick={() => abrir()}><Plus className="size-4" />Nuevo residente</Button>} />
      <Panel>
        <div className="p-5"><div className="relative max-w-xs"><Search className="text-muted-foreground absolute top-2.5 left-3 size-4" /><Input className="pl-9" placeholder="Buscar por nombre o documento" value={q} onChange={(e) => setQ(e.target.value)} /></div></div>
        <Table columnas={["Nombre", "Documento", "Contacto", "Vivienda", "Estado", ""]}>
          {lista.map((r) => (
            <tr key={r.id}>
              <Td className="text-ink font-semibold">{r.nombre} {r.apellido}</Td>
              <Td>{r.documento}</Td>
              <Td>{r.correo}<span className="text-muted-foreground block text-[11px]">{r.telefono}</span></Td>
              <Td>{nombreVivienda(r.viviendaId)}</Td>
              <Td><EstadoBadge estado={r.estado} /></Td>
              <Td className="text-right whitespace-nowrap">
                <Button variante="fantasma" onClick={() => abrir(r)}>Editar</Button>
                <Button variante={r.estado === "Activo" ? "peligro" : "suave"} onClick={() => actualizarResidente(r.id, { estado: r.estado === "Activo" ? "Inactivo" : "Activo" })}>{r.estado === "Activo" ? "Desactivar" : "Activar"}</Button>
              </Td>
            </tr>
          ))}
        </Table>
      </Panel>
      <Modal abierto={abierto} onClose={() => setAbierto(false)} titulo={editando ? "Editar residente" : "Nuevo residente"} descripcion="Solo se registran los datos mínimos necesarios.">
        <form onSubmit={guardar} className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre"><Input required value={f.nombre} onChange={set("nombre")} /></Field>
          <Field label="Apellido"><Input required value={f.apellido} onChange={set("apellido")} /></Field>
          <Field label="Documento"><Input required value={f.documento} onChange={set("documento")} /></Field>
          <Field label="Teléfono"><Input value={f.telefono} onChange={set("telefono")} /></Field>
          <Field label="Correo"><Input type="email" required value={f.correo} onChange={set("correo")} /></Field>
          <Field label="Vivienda"><Select value={f.viviendaId} onChange={set("viviendaId")}>{viviendas.map((v) => <option key={v.id} value={v.id}>{v.codigo}</option>)}</Select></Field>
          <div className="flex justify-end gap-2 sm:col-span-2"><Button type="button" variante="suave" onClick={() => setAbierto(false)}>Cancelar</Button><Button type="submit">Guardar</Button></div>
        </form>
      </Modal>
    </AppShell>
  );
}
