import { Bell } from "lucide-react";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { fechaRelativa } from "@/lib/meta";

export function Notificaciones() {
  const { notificaciones, marcarLeidas } = useStore();
  const [abierto, setAbierto] = useState(false);
  const sinLeer = notificaciones.filter((n) => !n.leida).length;
  return (
    <div className="relative">
      <button
        onClick={() => {
          setAbierto((a) => !a);
          if (!abierto) setTimeout(marcarLeidas, 1500);
        }}
        className="bg-surface/70 text-ink relative rounded-full p-2.5 ring-1 ring-black/5"
        aria-label="Notificaciones"
      >
        <Bell className="size-4" />
        {sinLeer ? (
          <span className="bg-destructive text-primary-foreground absolute -top-1 -right-1 grid size-5 place-items-center rounded-full text-[10px] font-bold">
            {sinLeer}
          </span>
        ) : null}
      </button>
      {abierto ? (
        <div className="bg-surface fixed inset-x-3 top-20 z-40 sm:absolute sm:inset-x-auto sm:top-auto sm:right-0 sm:mt-2 sm:w-80 rounded-2xl p-3 shadow-2xl ring-1 ring-black/5">
          <p className="font-display text-ink px-2 pb-2 text-sm font-semibold">Notificaciones</p>
          {notificaciones.length === 0 ? (
            <p className="text-muted-foreground px-2 py-6 text-center text-xs">Sin notificaciones por ahora.</p>
          ) : (
            <ul className="max-h-80 space-y-1 overflow-y-auto">
              {notificaciones.map((n) => (
                <li key={n.id} className={`rounded-xl px-3 py-2 ${n.leida ? "" : "bg-brand-soft"}`}>
                  <p className="text-ink text-sm font-semibold">{n.titulo}</p>
                  <p className="text-muted-foreground text-xs">{n.mensaje}</p>
                  <p className="text-muted-foreground mt-1 text-[10px]" suppressHydrationWarning>{fechaRelativa(n.fecha)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
