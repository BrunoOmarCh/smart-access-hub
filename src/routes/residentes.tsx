import { createFileRoute } from "@tanstack/react-router";
import { Plus, ScanFace, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import {
  Button,
  EstadoBadge,
  Field,
  Input,
  Modal,
  PageIntro,
  Panel,
  Select,
  Table,
  Td,
} from "@/components/kit";
import { useStore } from "@/lib/store";
import { meta } from "@/lib/meta";
import type { Residente } from "@/lib/demo-data";

export const Route = createFileRoute("/residentes")({
  head: () => meta("Residentes", "Registro y gestión de residentes del condominio."),
  component: Page,
});

const vacio = {
  nombre: "",
  apellido: "",
  documento: "",
  correo: "",
  telefono: "",
  viviendaId: "",
  estado: "Activo" as const,
};

function Page() {
  const {
    residentes,
    viviendas,
    crearResidente,
    actualizarResidente,
    biometria,
    registrarRostro,
    nombreVivienda,
    solicitudes,
    aprobarSolicitud,
    rechazarSolicitud,
  } = useStore();
  const [asignar, setAsignar] = useState<Record<string, string>>({});
  const pendientes = solicitudes.filter((x) => x.estado === "Pendiente");
  const viviendaPara = (id: string, pedida: string) =>
    asignar[id] ??
    viviendas.find((v) => v.codigo.toLowerCase() === pedida.trim().toLowerCase())?.id ??
    viviendas[0]?.id ??
    "";
  const aprobar = async (id: string, pedida: string) => {
    const err = await aprobarSolicitud(id, viviendaPara(id, pedida));
    if (err) toast.error(err);
    else toast.success("Cuenta aprobada");
  };
  const rechazar = async (id: string) => {
    const err = await rechazarSolicitud(id);
    if (err) toast.error(err);
    else toast.success("Solicitud rechazada");
  };
  const [q, setQ] = useState("");
  const [editando, setEditando] = useState<Residente | null>(null);
  const [abierto, setAbierto] = useState(false);
  const [registrandoRostro, setRegistrandoRostro] = useState(false);
  const [f, setF] = useState<Omit<Residente, "id" | "fechaRegistro">>(vacio);

  const abrir = (r?: Residente) => {
    setEditando(r ?? null);
    setF(r ? { ...r } : { ...vacio, viviendaId: viviendas[0]?.id ?? "" });
    setAbierto(true);
  };
  const guardar = (e: React.FormEvent) => {
    e.preventDefault();
    if (editando) actualizarResidente(editando.id, f);
    else crearResidente(f);
    setAbierto(false);
  };
  const lista = residentes.filter((r) =>
    `${r.nombre} ${r.apellido} ${r.documento}`.toLowerCase().includes(q.toLowerCase()),
  );
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF({ ...f, [k]: e.target.value });

  return (
    <AppShell tituloPagina="Residentes">
      <PageIntro
        titulo="Residentes"
        descripcion="Personas autorizadas a vivir en el condominio."
        accion={
          <Button onClick={() => abrir()}>
            <Plus className="size-4" />
            Nuevo residente
          </Button>
        }
      />
      {pendientes.length ? (
        <Panel>
          <div className="p-5 pb-0">
            <h2 className="font-display text-ink text-lg font-bold">
              Solicitudes pendientes ({pendientes.length})
            </h2>
            <p className="text-muted-foreground text-sm">
              Personas que crearon su cuenta y esperan aprobación. Asigna su vivienda antes de
              aprobar.
            </p>
          </div>
          <Table
            columnas={[
              "Nombre",
              "Documento",
              "Contacto",
              "Vivienda pedida",
              "Asignar vivienda",
              "",
            ]}
          >
            {pendientes.map((x) => (
              <tr key={x.id}>
                <Td className="text-ink font-semibold">
                  {x.nombre} {x.apellido}
                </Td>
                <Td>{x.documento || "—"}</Td>
                <Td>
                  {x.correo}
                  <span className="text-muted-foreground block text-[11px]">{x.telefono}</span>
                </Td>
                <Td>{x.viviendaSolicitada || "—"}</Td>
                <Td>
                  <Select
                    value={viviendaPara(x.id, x.viviendaSolicitada)}
                    onChange={(e) => setAsignar({ ...asignar, [x.id]: e.target.value })}
                  >
                    {viviendas.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.codigo}
                      </option>
                    ))}
                  </Select>
                </Td>
                <Td className="text-right whitespace-nowrap">
                  <Button variante="peligro" onClick={() => rechazar(x.id)}>
                    Rechazar
                  </Button>
                  <Button onClick={() => aprobar(x.id, x.viviendaSolicitada)}>Aprobar</Button>
                </Td>
              </tr>
            ))}
          </Table>
        </Panel>
      ) : null}
      <Panel>
        <div className="p-5">
          <div className="relative max-w-xs">
            <Search className="text-muted-foreground absolute top-2.5 left-3 size-4" />
            <Input
              className="pl-9"
              placeholder="Buscar por nombre o documento"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>
        <Table columnas={["Nombre", "Documento", "Contacto", "Vivienda", "Estado", ""]}>
          {lista.map((r) => (
            <tr key={r.id}>
              <Td className="text-ink font-semibold">
                {r.nombre} {r.apellido}
              </Td>
              <Td>{r.documento}</Td>
              <Td>
                {r.correo}
                <span className="text-muted-foreground block text-[11px]">{r.telefono}</span>
              </Td>
              <Td>{nombreVivienda(r.viviendaId)}</Td>
              <Td>
                <EstadoBadge estado={r.estado} />
              </Td>
              <Td className="text-right whitespace-nowrap">
                <Button variante="fantasma" onClick={() => abrir(r)}>
                  Editar
                </Button>
                <Button
                  variante={r.estado === "Activo" ? "peligro" : "suave"}
                  onClick={() =>
                    actualizarResidente(r.id, {
                      estado: r.estado === "Activo" ? "Inactivo" : "Activo",
                    })
                  }
                >
                  {r.estado === "Activo" ? "Desactivar" : "Activar"}
                </Button>
              </Td>
            </tr>
          ))}
        </Table>
      </Panel>
      <Modal
        abierto={abierto}
        onClose={() => setAbierto(false)}
        titulo={editando ? "Editar residente" : "Nuevo residente"}
        descripcion="Solo se registran los datos mínimos necesarios."
      >
        <form onSubmit={guardar} className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre">
            <Input required value={f.nombre} onChange={set("nombre")} />
          </Field>
          <Field label="Apellido">
            <Input required value={f.apellido} onChange={set("apellido")} />
          </Field>
          <Field label="Documento">
            <Input required value={f.documento} onChange={set("documento")} />
          </Field>
          <Field label="Teléfono">
            <Input value={f.telefono} onChange={set("telefono")} />
          </Field>
          <Field label="Correo">
            <Input type="email" required value={f.correo} onChange={set("correo")} />
          </Field>
          <Field label="Vivienda">
            <Select value={f.viviendaId} onChange={set("viviendaId")}>
              {viviendas.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.codigo}
                </option>
              ))}
            </Select>
          </Field>
          {editando ? (
            <div className="bg-surface/60 flex flex-wrap items-center justify-between gap-3 rounded-xl p-4 sm:col-span-2">
              <div>
                <p className="text-ink text-sm font-semibold">Registro facial</p>
                <p className="text-muted-foreground text-xs">
                  Estado:{" "}
                  {biometria.find((b) => b.residenteId === editando.id && b.tipo === "Rostro")
                    ?.estado ?? "No registrada"}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  Se abrirá la cámara local. La captura se cancela con la tecla Q.
                </p>
              </div>
              <Button
                type="button"
                disabled={registrandoRostro}
                onClick={async () => {
                  setRegistrandoRostro(true);
                  try {
                    const resultado = await registrarRostro(editando.id);
                    if (resultado.ok) toast.success("Rostro registrado y vinculado al residente.");
                    else toast.error(`No se pudo registrar el rostro: ${resultado.error}`);
                  } catch (error) {
                    toast.error(
                      `No se pudo registrar el rostro: ${error instanceof Error ? error.message : "error inesperado"}`,
                    );
                  } finally {
                    setRegistrandoRostro(false);
                  }
                }}
              >
                <ScanFace className="size-4" />
                {registrandoRostro ? "Registrando…" : "Registrar rostro"}
              </Button>
            </div>
          ) : null}
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variante="suave" onClick={() => setAbierto(false)}>
              Cancelar
            </Button>
            <Button type="submit">Guardar</Button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}
