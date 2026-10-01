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
