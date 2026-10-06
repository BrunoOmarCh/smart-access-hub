import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { Badge, Button, EstadoBadge, Input, Panel, Select, Table, Td } from "@/components/kit";
import { useStore } from "@/lib/store";
import type { EventoAcceso } from "@/lib/demo-data";
import { descargarCSV, imprimirPDF } from "@/lib/exportar";
import { fechaRelativa } from "@/lib/meta";

const POR_PAGINA = 8;
const aIso = (e: EventoAcceso) => `${e.fecha}T${e.hora}:00`;

export function TablaEventos({ eventos }: { eventos: EventoAcceso[] }) {
  const { nombreVivienda, nombreDispositivo, dispositivos } = useStore();
  const [q, setQ] = useState("");
  const [res, setRes] = useState("");
  const [met, setMet] = useState("");
  const [orden, setOrden] = useState("fecha-desc");
  const [pagina, setPagina] = useState(1);
  const [sel, setSel] = useState<EventoAcceso | null>(null);

  const lista = useMemo(() => {
    const f = eventos.filter(
      (e) => e.persona.toLowerCase().includes(q.toLowerCase()) && (!res || e.resultado === res) && (!met || e.metodo === met),
    );
    return [...f].sort((a, b) => {
      const fecha = aIso(a).localeCompare(aIso(b));
      if (orden === "fecha-asc") return fecha;
      if (orden === "resultado") return a.resultado.localeCompare(b.resultado) || -fecha;
      return -fecha;
    });
  }, [eventos, q, res, met, orden]);

  const paginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
  const actual = Math.min(pagina, paginas);
  const visibles = lista.slice((actual - 1) * POR_PAGINA, actual * POR_PAGINA);

  const columnas = ["Fecha", "Hora", "Persona", "Vivienda", "Método", "Dispositivo", "Resultado", "Motivo"];
  const filas = () =>
    lista.map((e) => [e.fecha, e.hora, e.persona, nombreVivienda(e.viviendaId), e.metodo, nombreDispositivo(e.dispositivoId), e.resultado, e.motivo]);

  const cambiar = (fn: (v: string) => void) => (v: string) => { fn(v); setPagina(1); };
  const disp = sel ? dispositivos.find((d) => d.id === sel.dispositivoId) : undefined;

  return (
    <Panel>
      <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-6">
        <Input placeholder="Buscar persona" value={q} onChange={(e) => cambiar(setQ)(e.target.value)} />
        <Select value={res} onChange={(e) => cambiar(setRes)(e.target.value)}><option value="">Todos los resultados</option><option>Autorizado</option><option>Rechazado</option></Select>
        <Select value={met} onChange={(e) => cambiar(setMet)(e.target.value)}><option value="">Todos los métodos</option><option>Reconocimiento facial</option><option>Huella dactilar</option><option>Invitado</option><option>Administrador</option></Select>
        <Select value={orden} onChange={(e) => setOrden(e.target.value)}><option value="fecha-desc">Más recientes primero</option><option value="fecha-asc">Más antiguos primero</option><option value="resultado">Por resultado</option></Select>
        <Button variante="suave" onClick={() => descargarCSV("eventos", columnas, filas())} disabled={lista.length === 0}>Exportar CSV</Button>
        <Button variante="suave" onClick={() => imprimirPDF("Reporte de eventos de acceso", columnas, filas())} disabled={lista.length === 0}>Exportar PDF</Button>
      </div>
      <Table columnas={["Fecha", "Persona", "Vivienda", "Método", "Dispositivo", "Resultado"]}>
        {visibles.map((e) => (
          <tr key={e.id} onClick={() => setSel(e)} className="hover:bg-surface/60 cursor-pointer">
            <Td className="whitespace-nowrap">{e.fecha} {e.hora}<span className="text-muted-foreground block text-[11px]" suppressHydrationWarning>{fechaRelativa(aIso(e))}</span></Td>
            <Td className="text-ink font-semibold">{e.persona}</Td>
            <Td>{nombreVivienda(e.viviendaId)}</Td>
            <Td>{e.metodo}</Td>
            <Td>{nombreDispositivo(e.dispositivoId)}</Td>
            <Td><EstadoBadge estado={e.resultado} /></Td>
          </tr>
        ))}
      </Table>
      {lista.length === 0 ? (
        <p className="text-muted-foreground p-6 text-center text-sm">Sin eventos para estos filtros.</p>
      ) : (
        <div className="text-muted-foreground flex items-center justify-between gap-3 p-4 text-xs">
          <span>{lista.length} eventos · página {actual} de {paginas} · clic en una fila para ver el detalle</span>
          <div className="flex gap-2">
            <Button variante="fantasma" disabled={actual <= 1} onClick={() => setPagina(actual - 1)}>Anterior</Button>
            <Button variante="fantasma" disabled={actual >= paginas} onClick={() => setPagina(actual + 1)}>Siguiente</Button>
          </div>
        </div>
      )}

      {sel ? (
        <div className="fixed inset-0 z-50">
          <div className="bg-ink/30 absolute inset-0 backdrop-blur-sm" onClick={() => setSel(null)} />
          <aside className="bg-surface absolute inset-y-0 right-0 w-[min(420px,100vw)] overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground text-[11px] tracking-[0.18em] uppercase">Evento {sel.id}</p>
                <h2 className="font-display text-ink mt-1 text-xl font-bold">{sel.persona}</h2>
              </div>
              <button onClick={() => setSel(null)} className="text-muted-foreground hover:text-ink rounded-lg p-1" aria-label="Cerrar detalle"><X className="size-5" /></button>
            </div>
            <div className="mt-4 flex gap-2"><EstadoBadge estado={sel.resultado} />{sel.origen ? <Badge tono="neutro">{sel.origen}</Badge> : null}</div>
            <dl className="mt-6 space-y-4 text-sm">
              {[
                ["Fecha y hora", `${sel.fecha} ${sel.hora}`],
                ["Vivienda", nombreVivienda(sel.viviendaId)],
                ["Método", sel.metodo],
                ["Motivo", sel.motivo],
                ["Dispositivo", disp?.nombre ?? "—"],
                ["Tipo de dispositivo", disp?.tipo ?? "—"],
                ["Ubicación", disp?.ubicacion ?? "—"],
                ["Identificador", disp?.identificador ?? "—"],
                ["Estado del dispositivo", disp?.estado ?? "—"],
              ].map(([k, v]) => (
                <div key={k} className="border-border border-b pb-3">
                  <dt className="text-muted-foreground text-xs">{k}</dt>
                  <dd className="text-ink mt-1 font-medium">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="text-muted-foreground mt-6 text-xs">Por protección de datos, el evento no guarda imágenes ni plantillas biométricas.</p>
          </aside>
        </div>
      ) : null}
    </Panel>
  );
}
