import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Building2,
  Cpu,
  Fingerprint,
  Home,
  KeyRound,
  LayoutGrid,
  LogOut,
  Menu,
  ScrollText,
  Settings,
  ShieldCheck,
  UserRound,
  Users,
  UsersRound,
  X,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { ClipboardList, Monitor } from "lucide-react";
import { useStore } from "@/lib/store";
import { Notificaciones } from "./Notificaciones";
import { CONDOMINIO } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

type Item = { to: string; label: string; icon: typeof Home };

const navAdmin: { grupo: string; items: Item[] }[] = [
  {
    grupo: "General",
    items: [
      { to: "/panel", label: "Dashboard", icon: LayoutGrid },
      { to: "/residentes", label: "Residentes", icon: Users },
      { to: "/viviendas", label: "Viviendas", icon: Building2 },
      { to: "/invitados", label: "Invitados", icon: UsersRound },
    ],
  },
  {
    grupo: "Operación",
    items: [
      { to: "/dispositivos", label: "Dispositivos", icon: Cpu },
      { to: "/eventos", label: "Eventos", icon: ScrollText },
      { to: "/historial", label: "Historial", icon: ScrollText },
      { to: "/kiosco", label: "Modo kiosco", icon: Monitor },
    ],
  },
  {
    grupo: "Seguridad",
    items: [
      { to: "/biometria", label: "Biometría", icon: Fingerprint },
      { to: "/permisos", label: "Permisos de acceso", icon: KeyRound },
      { to: "/auditoria", label: "Auditoría", icon: ClipboardList },
      { to: "/configuracion", label: "Configuración", icon: Settings },
    ],
  },
];

const navResidente: { grupo: string; items: Item[] }[] = [
  {
    grupo: "General",
    items: [
      { to: "/panel", label: "Dashboard", icon: LayoutGrid },
      { to: "/mi-perfil", label: "Mi perfil", icon: UserRound },
      { to: "/mi-vivienda", label: "Mi vivienda", icon: Home },
    ],
  },
  {
    grupo: "Accesos",
    items: [
      { to: "/invitados", label: "Mis invitados", icon: UsersRound },
      { to: "/permisos", label: "Permisos de acceso", icon: KeyRound },
      { to: "/historial", label: "Historial de accesos", icon: ScrollText },
    ],
  },
];

export function AppShell({
  children,
  tituloPagina,
}: {
  children: ReactNode;
  tituloPagina: string;
}) {
  const { usuario, cargado, cerrarSesion, dispositivos } = useStore();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => {
    if (cargado && !usuario) navigate({ to: "/" });
  }, [cargado, usuario, navigate]);

  useEffect(() => {
    setMenuAbierto(false);
  }, [pathname]);

  if (!usuario) return null;

  const esAdmin = usuario.rol === "Administrador";
  const grupos = esAdmin ? navAdmin : navResidente;
  const online = dispositivos.filter((d) => d.estado === "Online").length;
  const iniciales = `${usuario.nombre[0]}${usuario.apellido[0]}`;

  const sidebar = (
    <div className="flex h-full flex-col p-5">
      <div className="flex items-center gap-3 px-2">
        <div className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
          <span className="font-display text-lg font-bold">S</span>
        </div>
        <div>
          <p className="font-display text-base leading-none font-bold text-ink">SmartAccess</p>
          <p className="mt-1 text-[11px] text-muted-foreground">Control de acceso inteligente</p>
        </div>
      </div>

      <nav className="mt-8 flex flex-1 flex-col gap-1 overflow-y-auto">
        {grupos.map((g) => (
          <div key={g.grupo}>
            <p className="px-3 pt-4 pb-2 text-[10px] font-semibold tracking-[0.18em] text-muted-foreground uppercase first:pt-0">
              {g.grupo}
            </p>
            {g.items.map((item) => {
              const activo = pathname === item.to;
              const Icono = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    activo
                      ? "bg-surface/70 font-semibold text-primary shadow-sm ring-1 ring-primary/15"
                      : "text-muted-foreground hover:bg-surface/50 hover:text-ink",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-6 place-items-center rounded-lg",
                      activo ? "bg-brand-soft text-primary" : "bg-neutral-soft text-muted-foreground",
                    )}
                  >
                    <Icono className="size-3.5" />
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="mt-6 rounded-2xl bg-gradient-to-br from-primary to-accent p-4 text-primary-foreground">
        <p className="font-display text-sm font-semibold">Sistema protegido</p>
        <p className="mt-1 text-[11px] text-primary-foreground/80">
          Plantillas biométricas protegidas. Sin imágenes faciales almacenadas.
        </p>
      </div>
    </div>
  );

  return (
    <div className="bg-canvas text-ink relative min-h-screen w-full overflow-x-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="bg-primary/25 absolute -top-24 -left-24 size-[420px] rounded-full blur-[120px]" />
        <div className="bg-accent/25 absolute top-1/3 -right-32 size-[460px] rounded-full blur-[130px]" />
        <div className="bg-primary/15 absolute bottom-0 left-1/3 size-[380px] rounded-full blur-[120px]" />
      </div>

      <div className="relative flex min-h-screen">
        <aside className="glass sticky top-0 hidden h-screen w-64 shrink-0 rounded-r-3xl lg:block">
          {sidebar}
        </aside>

        {menuAbierto ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="bg-ink/40 absolute inset-0 backdrop-blur-sm"
              onClick={() => setMenuAbierto(false)}
            />
            <div className="bg-surface absolute inset-y-0 left-0 w-72 shadow-2xl">
              <button
                onClick={() => setMenuAbierto(false)}
                className="text-muted-foreground hover:text-ink absolute top-5 right-4 rounded-lg p-1"
                aria-label="Cerrar menú"
              >
                <X className="size-5" />
              </button>
              {sidebar}
            </div>
          </div>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="glass sticky top-0 z-30 flex items-center justify-between gap-3 rounded-b-3xl px-4 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMenuAbierto(true)}
                className="bg-surface/70 text-ink rounded-xl p-2 ring-1 ring-black/5 lg:hidden"
                aria-label="Abrir menú"
              >
                <Menu className="size-4" />
              </button>
              <div>
                <p className="text-muted-foreground text-[11px] font-medium tracking-[0.18em] uppercase">
                  {CONDOMINIO.nombre}
                </p>
                <h1 className="font-display text-ink text-xl font-bold">{tituloPagina}</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="bg-success-soft text-success ring-success/20 hidden items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 md:flex">
                <ShieldCheck className="size-3.5" /> {online} dispositivos online
              </span>
              <Notificaciones />
              <div className="bg-surface/70 flex items-center gap-3 rounded-full py-1.5 pr-2 pl-1.5 ring-1 ring-black/5">
                <div className="bg-brand-soft font-display text-primary grid size-9 place-items-center rounded-full text-sm font-bold">
                  {iniciales}
                </div>
                <div className="hidden leading-tight sm:block">
                  <p className="text-ink text-sm font-semibold">
                    {usuario.nombre} {usuario.apellido}
                  </p>
                  <p className="text-muted-foreground text-[11px]">{usuario.rol}</p>
                </div>
                <button
                  onClick={() => {
                    cerrarSesion();
                    navigate({ to: "/" });
                  }}
                  className="text-muted-foreground hover:bg-neutral-soft hover:text-ink rounded-full p-2"
                  aria-label="Cerrar sesión"
                  title="Cerrar sesión"
                >
                  <LogOut className="size-4" />
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1 space-y-6 p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
