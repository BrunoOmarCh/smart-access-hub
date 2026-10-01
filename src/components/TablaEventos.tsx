import { useState } from "react";
import { EstadoBadge, Input, Panel, Select, Table, Td } from "@/components/kit";
import { useStore } from "@/lib/store";
import type { EventoAcceso } from "@/lib/demo-data";

export function TablaEventos({ eventos }: { eventos: EventoAcceso[] }) {
  const { nombreVivienda, nombreDispositivo } = useStore();
  const [q, setQ] = useState("");
  const [res, setRes] = useState("");
  const [met, setMet] = useState("");
  const lista = eventos.filter(
    (e) => e.persona.toLowerCase().includes(q.toLowerCase()) && (!res || e.resultado === res) && (!met || e.metodo === met),
  );
  return (
    <Panel>
      <div className="grid gap-3 p-5 sm:grid-cols-3">
        <Input placeholder="Buscar persona" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select value={res} onChange={(e) => setRes(e.target.value)}><option value="">Todos los resultados</option><option>Autorizado</option><option>Rechazado</option></Select>
        <Select value={met} onChange={(e) => setMet(e.target.value)}><option value="">Todos los métodos</option><option>Reconocimiento facial</option><option>Huella dactilar</option><option>Invitado</option><option>Administrador</option></Select>
      </div>
      <Table columnas={["Fecha", "Persona", "Vivienda", "Método", "Dispositivo", "Resultado", "Motivo"]}>
        {lista.map((e) => (
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
      {lista.length === 0 ? <p className="text-muted-foreground p-6 text-center text-sm">Sin eventos para estos filtros.</p> : null}
    </Panel>
  );
}
