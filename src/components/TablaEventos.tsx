import { useMemo, useState } from "react";
import { Button, EstadoBadge, Input, Panel, Select, Table, Td } from "@/components/kit";
import { useStore } from "@/lib/store";
import type { EventoAcceso } from "@/lib/demo-data";

const POR_PAGINA = 8;

export function TablaEventos({ eventos }: { eventos: EventoAcceso[] }) {
  const { nombreVivienda, nombreDispositivo } = useStore();
  const [q, setQ] = useState("");
  const [res, setRes] = useState("");
  const [met, setMet] = useState("");
  const [orden, setOrden] = useState<"desc" | "asc">("desc");
  const [pagina, setPagina] = useState(1);

  const lista = useMemo(() => {
    const f = eventos.filter(
      (e) => e.persona.toLowerCase().includes(q.toLowerCase()) && (!res || e.resultado === res) && (!met || e.metodo === met),
    );
    return [...f].sort((a, b) => {
      const c = `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`);
      return orden === "asc" ? c : -c;
    });
  }, [eventos, q, res, met, orden]);

  const paginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
  const actual = Math.min(pagina, paginas);
  const visibles = lista.slice((actual - 1) * POR_PAGINA, actual * POR_PAGINA);

  const exportar = () => {
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const filas = [
      ["Fecha", "Hora", "Persona", "Vivienda", "Método", "Dispositivo", "Resultado", "Motivo"],
      ...lista.map((e) => [e.fecha, e.hora, e.persona, nombreVivienda(e.viviendaId), e.metodo, nombreDispositivo(e.dispositivoId), e.resultado, e.motivo]),
    ];
    const csv = "\uFEFF" + filas.map((f) => f.map(esc).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `eventos-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const cambiar = <T,>(fn: (v: T) => void) => (v: T) => { fn(v); setPagina(1); };

  return (
    <Panel>
      <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-5">
        <Input placeholder="Buscar persona" value={q} onChange={(e) => cambiar(setQ)(e.target.value)} />
        <Select value={res} onChange={(e) => cambiar(setRes)(e.target.value)}><option value="">Todos los resultados</option><option>Autorizado</option><option>Rechazado</option></Select>
        <Select value={met} onChange={(e) => cambiar(setMet)(e.target.value)}><option value="">Todos los métodos</option><option>Reconocimiento facial</option><option>Huella dactilar</option><option>Invitado</option><option>Administrador</option></Select>
        <Select value={orden} onChange={(e) => setOrden(e.target.value as "asc" | "desc")}><option value="desc">Más recientes primero</option><option value="asc">Más antiguos primero</option></Select>
        <Button variante="suave" onClick={exportar} disabled={lista.length === 0}>Exportar CSV</Button>
      </div>
      <Table columnas={["Fecha", "Persona", "Vivienda", "Método", "Dispositivo", "Resultado", "Motivo"]}>
        {visibles.map((e) => (
          <tr key={e.id}>
            <Td className="whitespace-nowrap">{e.fecha} {e.hora}</Td>
            <Td className="text-ink font-semibold">{e.persona}</Td>
            <Td>{nombreVivienda(e.viviendaId)}</Td>
            <Td>{e.metodo}</Td>
            <Td>{nombreDispositivo(e.dispositivoId)}</Td>
            <Td><EstadoBadge estado={e.resultado} /></Td>
            <Td className="text-xs">{e.motivo}</Td>
          </tr>
        ))}
      </Table>
      {lista.length === 0 ? (
        <p className="text-muted-foreground p-6 text-center text-sm">Sin eventos para estos filtros.</p>
      ) : (
        <div className="text-muted-foreground flex items-center justify-between gap-3 p-4 text-xs">
          <span>{lista.length} eventos · página {actual} de {paginas}</span>
          <div className="flex gap-2">
            <Button variante="fantasma" disabled={actual <= 1} onClick={() => setPagina(actual - 1)}>Anterior</Button>
            <Button variante="fantasma" disabled={actual >= paginas} onClick={() => setPagina(actual + 1)}>Siguiente</Button>
          </div>
        </div>
      )}
    </Panel>
  );
}
