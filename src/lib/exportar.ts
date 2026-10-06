const hoy = () => new Date().toISOString().slice(0, 10);

export function descargarCSV(nombre: string, columnas: string[], filas: string[][]) {
  const esc = (v: string) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = "\uFEFF" + [columnas, ...filas].map((f) => f.map(esc).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${nombre}-${hoy()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Abre un reporte imprimible; el usuario elige "Guardar como PDF". */
export function imprimirPDF(titulo: string, columnas: string[], filas: string[][]) {
  const w = window.open("", "_blank");
  if (!w) return;
  const e = (s: string) => String(s ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);
  w.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${e(titulo)}</title>
<style>body{font-family:Inter,system-ui,sans-serif;padding:32px;color:#111}h1{font-size:20px;margin:0}
p{color:#666;font-size:12px}table{width:100%;border-collapse:collapse;font-size:11px;margin-top:16px}
th,td{border-bottom:1px solid #ddd;padding:6px 8px;text-align:left}th{background:#f3f4f8}</style></head><body>
<h1>${e(titulo)}</h1><p>Residencial SmartAccess · generado el ${new Date().toLocaleString("es-PE")} · ${filas.length} registros</p>
<table><thead><tr>${columnas.map((c) => `<th>${e(c)}</th>`).join("")}</tr></thead><tbody>
${filas.map((f) => `<tr>${f.map((c) => `<td>${e(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>
<script>window.onload=()=>window.print()</script></body></html>`);
  w.document.close();
}
