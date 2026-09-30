import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ---------------------------------- Panels --------------------------------- */

export function Panel({ className, ...props }: ComponentProps<"section">) {
  return <section className={cn("glass rounded-3xl", className)} {...props} />;
}

export function PanelHeader({
  titulo,
  descripcion,
  accion,
}: {
  titulo: string;
  descripcion?: string;
  accion?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5">
      <div>
        <h2 className="font-display text-base font-bold text-ink">{titulo}</h2>
        {descripcion ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{descripcion}</p>
        ) : null}
      </div>
      {accion}
    </div>
  );
}

export function StatCard({
  etiqueta,
  valor,
  nota,
  tono = "neutro",
}: {
  etiqueta: string;
  valor: ReactNode;
  nota?: string;
  tono?: "neutro" | "exito" | "alerta" | "peligro";
}) {
  const notaTono = {
    neutro: "text-muted-foreground",
    exito: "text-success",
    alerta: "text-warning",
    peligro: "text-destructive",
  }[tono];
  return (
    <div className="glass rounded-2xl p-4">
      <p className="text-xs font-medium text-muted-foreground">{etiqueta}</p>
      <p className="mt-2 font-display text-3xl font-bold text-ink">{valor}</p>
      {nota ? <p className={cn("mt-1 text-[11px]", notaTono)}>{nota}</p> : null}
    </div>
  );
}

/* ---------------------------------- Badge ---------------------------------- */

type Tono = "exito" | "peligro" | "alerta" | "neutro" | "marca";

const tonos: Record<Tono, string> = {
  exito: "bg-success-soft text-success",
  peligro: "bg-danger-soft text-destructive",
  alerta: "bg-warning-soft text-warning",
  neutro: "bg-neutral-soft text-muted-foreground",
  marca: "bg-brand-soft text-primary",
};

export function Badge({
  children,
  tono = "neutro",
  punto = false,
}: {
  children: ReactNode;
  tono?: Tono;
  punto?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap",
        tonos[tono],
      )}
    >
      {punto ? <span className="size-1.5 rounded-full bg-current" /> : null}
      {children}
    </span>
  );
}

const mapaEstados: Record<string, Tono> = {
  Activo: "exito",
  Online: "exito",
  Autorizado: "exito",
  Ocupada: "exito",
  Registrada: "exito",
  Pendiente: "alerta",
  Mantenimiento: "alerta",
  Disponible: "marca",
  Inactivo: "neutro",
  Inactiva: "neutro",
  Offline: "neutro",
  Expirado: "neutro",
  "No registrada": "neutro",
  Rechazado: "peligro",
  Revocado: "peligro",
};

export function EstadoBadge({ estado }: { estado: string }) {
  return (
    <Badge tono={mapaEstados[estado] ?? "neutro"} punto>
      {estado}
    </Badge>
  );
}

/* --------------------------------- Botones --------------------------------- */

export function Button({
  variante = "primario",
  className,
  ...props
}: ComponentProps<"button"> & { variante?: "primario" | "suave" | "fantasma" | "peligro" }) {
  const estilos = {
    primario:
      "bg-primary text-primary-foreground shadow-md shadow-primary/30 hover:bg-primary/90",
    suave: "bg-surface/80 text-ink ring-1 ring-black/5 hover:bg-surface",
    fantasma: "text-muted-foreground hover:bg-surface/70 hover:text-ink",
    peligro: "bg-danger-soft text-destructive hover:bg-danger-soft/70",
  }[variante];
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors disabled:opacity-50",
        estilos,
        className,
      )}
      {...props}
    />
  );
}

/* -------------------------------- Formulario -------------------------------- */

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-ink">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-[11px] text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

const campoBase =
  "w-full rounded-xl border border-border bg-surface/90 px-3 py-2 text-sm text-ink outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:bg-neutral-soft disabled:text-muted-foreground";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(campoBase, className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn(campoBase, className)} {...props} />;
}

export function ErrorMsg({ children }: { children: ReactNode }) {
  return children ? (
    <p className="rounded-xl bg-danger-soft px-3 py-2 text-xs font-medium text-destructive">
      {children}
    </p>
  ) : null;
}

/* ---------------------------------- Tabla ---------------------------------- */

export function Table({
  columnas,
  children,
}: {
  columnas: string[];
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/70 text-left text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
            {columnas.map((c) => (
              <th key={c} className="px-5 py-3 font-semibold whitespace-nowrap">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">{children}</tbody>
      </table>
    </div>
  );
}

export function Td({ className, ...props }: ComponentProps<"td">) {
  return <td className={cn("px-5 py-3 align-middle text-ink/80", className)} {...props} />;
}

/* -------------------------------- Modal ------------------------------------ */

export function Modal({
  abierto,
  onClose,
  titulo,
  descripcion,
  children,
}: {
  abierto: boolean;
  onClose: () => void;
  titulo: string;
  descripcion?: string;
  children: ReactNode;
}) {
  return (
    <Dialog.Root open={abierto} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-ink/30 backdrop-blur-sm" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 max-h-[90vh] w-[min(560px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border border-white/70 bg-surface p-6 shadow-2xl shadow-primary/20">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="font-display text-lg font-bold text-ink">
                {titulo}
              </Dialog.Title>
              {descripcion ? (
                <Dialog.Description className="mt-1 text-xs text-muted-foreground">
                  {descripcion}
                </Dialog.Description>
              ) : null}
            </div>
            <Dialog.Close className="rounded-lg p-1 text-muted-foreground hover:bg-neutral-soft hover:text-ink">
              <X className="size-4" />
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/* ------------------------------- Estado vacío ------------------------------- */

export function EmptyState({
  icono,
  titulo,
  descripcion,
  accion,
}: {
  icono: ReactNode;
  titulo: string;
  descripcion: string;
  accion?: ReactNode;
}) {
  return (
    <div className="glass-soft rounded-3xl p-10 text-center">
      <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-surface/70 text-primary ring-1 ring-black/5">
        {icono}
      </div>
      <h3 className="mt-4 font-display text-base font-bold text-ink">{titulo}</h3>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{descripcion}</p>
      {accion ? <div className="mt-4 flex justify-center">{accion}</div> : null}
    </div>
  );
}

/* ------------------------------ Encabezado página --------------------------- */

export function PageIntro({
  titulo,
  descripcion,
  accion,
}: {
  titulo: string;
  descripcion: string;
  accion?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">{titulo}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{descripcion}</p>
      </div>
      {accion}
    </div>
  );
}
