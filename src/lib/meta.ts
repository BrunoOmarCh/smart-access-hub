export const meta = (titulo: string, descripcion: string) => ({
  meta: [
    { title: `${titulo} — SmartAccess` },
    { name: "description", content: descripcion },
    { property: "og:title", content: `${titulo} — SmartAccess` },
    { property: "og:description", content: descripcion },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ],
});

export const fechaCorta = (iso: string) =>
  new Date(iso).toLocaleString("es-PE", { dateStyle: "medium", timeStyle: "short" });

/** "hace 5 min", "en 2 días"… */
export const fechaRelativa = (iso: string) => {
  const diff = (new Date(iso).getTime() - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat("es", { numeric: "auto" });
  const pasos: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, "second"], [60, "minute"], [24, "hour"], [30, "day"], [12, "month"], [Infinity, "year"],
  ];
  let v = diff;
  for (const [lim, u] of pasos) {
    if (Math.abs(v) < lim) return rtf.format(Math.round(v), u);
    v /= lim;
  }
  return "";
};
