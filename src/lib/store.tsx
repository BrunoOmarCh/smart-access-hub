import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import {
  CREDENCIALES_DEMO,
  biometriaSeed,
  dispositivosSeed,
  eventosSeed,
  invitadosSeed,
  residentesSeed,
  usuariosSeed,
  viviendasSeed,
  type Dispositivo,
  type EventoAcceso,
  type Invitado,
  type Notificacion,
  type PermisoAcceso,
  type ReferenciaBiometrica,
  type RegistroAuditoria,
  type Residente,
  type Usuario,
  type Vivienda,
} from "./demo-data";

export interface OpcionesIntento {
  dispositivoId?: string;
  metodo?: EventoAcceso["metodo"];
  invitadoId?: string;
  origen?: EventoAcceso["origen"];
}

interface StoreValue {
  usuario: Usuario | null;
  cargado: boolean;
  iniciarSesion: (correo: string, clave: string) => { ok: boolean; error?: string };
  cerrarSesion: () => void;
  usuarios: Usuario[];
  actualizarPerfil: (datos: Partial<Usuario>) => void;
  residentes: Residente[];
  crearResidente: (r: Omit<Residente, "id" | "fechaRegistro">) => void;
  actualizarResidente: (id: string, datos: Partial<Residente>) => void;
  viviendas: Vivienda[];
  crearVivienda: (v: Omit<Vivienda, "id">) => void;
  actualizarVivienda: (id: string, datos: Partial<Vivienda>) => void;
  invitados: Invitado[];
  crearInvitado: (i: Omit<Invitado, "id">) => void;
  actualizarInvitado: (id: string, datos: Partial<Invitado>) => void;
  dispositivos: Dispositivo[];
  crearDispositivo: (d: Omit<Dispositivo, "id" | "ultimaConexion">) => void;
  actualizarDispositivo: (id: string, datos: Partial<Dispositivo>) => void;
  eventos: EventoAcceso[];
  simularIntento: (op?: OpcionesIntento) => EventoAcceso;
  registrarEvento: (e: Omit<EventoAcceso, "id">) => EventoAcceso;
  biometria: ReferenciaBiometrica[];
  permisos: PermisoAcceso[];
  notificaciones: (Notificacion & { leida: boolean })[];
  marcarLeidas: () => void;
  auditoria: RegistroAuditoria[];
  tema: "claro" | "oscuro";
  alternarTema: () => void;
  miResidente: Residente | null;
  miVivienda: Vivienda | null;
  nombreVivienda: (id?: string) => string;
  nombreResidente: (id?: string) => string;
  nombreDispositivo: (id?: string) => string;
}

const StoreContext = createContext<StoreValue | null>(null);

const nuevoId = (prefijo: string) => `${prefijo}${Math.random().toString(36).slice(2, 8)}`;
const SESION_KEY = "smartaccess.sesion";
const TEMA_KEY = "smartaccess.tema";
const pad = (n: number) => String(n).padStart(2, "0");
const fechaHora = (d: Date) => ({
  fecha: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
  hora: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
});

export function StoreProvider({ children }: { children: ReactNode }) {
  const [usuarios, setUsuarios] = useState<Usuario[]>(usuariosSeed);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargado, setCargado] = useState(false);
  const [tema, setTema] = useState<"claro" | "oscuro">("claro");
  useEffect(() => {
    const correo = window.localStorage.getItem(SESION_KEY);
    setUsuario(usuariosSeed.find((u) => u.correo === correo) ?? null);
    setTema(window.localStorage.getItem(TEMA_KEY) === "oscuro" ? "oscuro" : "claro");
    setCargado(true);
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", tema === "oscuro");
  }, [tema]);
  const alternarTema = useCallback(() => {
    setTema((t) => {
      const n = t === "oscuro" ? "claro" : "oscuro";
      window.localStorage.setItem(TEMA_KEY, n);
      return n;
    });
  }, []);

  const [residentes, setResidentes] = useState<Residente[]>(residentesSeed);
  const [viviendas, setViviendas] = useState<Vivienda[]>(viviendasSeed);
  const [invitados, setInvitados] = useState<Invitado[]>(invitadosSeed);
  const [dispositivos, setDispositivos] = useState<Dispositivo[]>(dispositivosSeed);
  const [eventos, setEventos] = useState<EventoAcceso[]>(eventosSeed);
  const [biometria] = useState<ReferenciaBiometrica[]>(biometriaSeed);
  const [notifs, setNotifs] = useState<Notificacion[]>([]);
  const [leidas, setLeidas] = useState<Set<string>>(new Set());
  const [auditoria, setAuditoria] = useState<RegistroAuditoria[]>([
    {
      id: "a0",
      fecha: new Date(Date.now() - 86400000).toISOString(),
      actor: "Sistema",
      rol: "Sistema",
      accion: "Inicializó",
      entidad: "Condominio",
      detalle: "Carga de datos de demostración",
    },
  ]);

  const auditar = useCallback(
    (accion: string, entidad: string, detalle: string) =>
      setAuditoria((prev) => [
        {
          id: nuevoId("a"),
          fecha: new Date().toISOString(),
          actor: usuario ? `${usuario.nombre} ${usuario.apellido}` : "Sistema",
          rol: usuario?.rol ?? "Sistema",
          accion,
          entidad,
          detalle,
        },
        ...prev,
      ]),
    [usuario],
  );

  const notificar = useCallback(
    (n: Omit<Notificacion, "id" | "fecha">) =>
      setNotifs((prev) => [{ ...n, id: nuevoId("n"), fecha: new Date().toISOString() }, ...prev]),
    [],
  );

  const registrarEvento = useCallback((e: Omit<EventoAcceso, "id">) => {
    const ev = { ...e, id: nuevoId("e") };
    setEventos((prev) => [ev, ...prev]);
    return ev;
  }, []);

  /** Simula un intento de acceso en un punto de acceso (sin hardware real). */
  const simularIntento = useCallback(
    (op: OpcionesIntento = {}): EventoAcceso => {
      const ahora = new Date();
      const activos = dispositivos.filter((d) => d.estado !== "Offline");
      const pool = activos.length ? activos : dispositivos;
      const disp = dispositivos.find((d) => d.id === op.dispositivoId) ?? pool[Math.floor(Math.random() * pool.length)];
      const origen = op.origen ?? "Simulación";
      const invitadosActivos = invitados.filter((i) => i.estado === "Activo");
      const inv =
        invitados.find((i) => i.id === op.invitadoId) ??
        (!op.metodo && Math.random() < 0.2 ? invitadosActivos[Math.floor(Math.random() * invitadosActivos.length)] : undefined);

      if (inv) {
        const vigente = inv.estado === "Activo" && new Date(inv.inicio) <= ahora && ahora <= new Date(inv.fin);
        const ev = registrarEvento({
          ...fechaHora(ahora),
          persona: `${inv.nombre} ${inv.apellido} (invitado)`,
          viviendaId: inv.viviendaId,
          metodo: "Invitado",
          resultado: vigente ? "Autorizado" : "Rechazado",
          dispositivoId: disp?.id ?? "",
          motivo: vigente ? "Pase temporal vigente" : `Pase no vigente (${inv.estado.toLowerCase()} o fuera de horario)`,
          origen,
        });
        if (vigente)
          notificar({
            residenteId: inv.anfitrionId,
            tipo: "Ingreso",
            titulo: "Tu invitado ingresó",
            mensaje: `${inv.nombre} ${inv.apellido} ingresó por ${disp?.nombre ?? "portería"}.`,
          });
        return ev;
      }

      const desconocido = Math.random() < 0.3;
      const r = residentes[Math.floor(Math.random() * residentes.length)];
      const metodo = op.metodo ?? (Math.random() < 0.5 ? "Reconocimiento facial" : "Huella dactilar");
      return registrarEvento({
        ...fechaHora(ahora),
        persona: desconocido || !r ? "Persona no identificada" : `${r.nombre} ${r.apellido}`,
        viviendaId: desconocido || !r ? undefined : r.viviendaId,
        metodo,
        resultado: desconocido || r?.estado !== "Activo" ? "Rechazado" : "Autorizado",
        dispositivoId: disp?.id ?? "",
        motivo: desconocido
          ? "Sin coincidencia biométrica (simulado)"
          : r?.estado !== "Activo"
            ? "Residente inactivo (simulado)"
            : "Coincidencia biométrica válida (simulado)",
        origen,
      });
    },
    [dispositivos, residentes, invitados, registrarEvento, notificar],
  );

  const iniciarSesion = useCallback(
    (correo: string, clave: string) => {
      const normalizado = correo.trim().toLowerCase();
      const encontrado = usuarios.find((u) => u.correo === normalizado);
      if (!encontrado) return { ok: false, error: "No existe una cuenta con ese correo." };
      if (CREDENCIALES_DEMO[normalizado] !== clave) return { ok: false, error: "La contraseña no es correcta." };
      setUsuario(encontrado);
      window.localStorage.setItem(SESION_KEY, normalizado);
      return { ok: true };
    },
    [usuarios],
  );

  const cerrarSesion = useCallback(() => {
    setUsuario(null);
    window.localStorage.removeItem(SESION_KEY);
  }, []);

  const actualizarPerfil = useCallback(
    (datos: Partial<Usuario>) => {
      setUsuario((prev) => (prev ? { ...prev, ...datos } : prev));
      setUsuarios((prev) => prev.map((u) => (u.id === usuario?.id ? { ...u, ...datos } : u)));
      auditar("Editó", "Perfil", "Actualización de datos personales");
    },
    [usuario?.id, auditar],
  );

  const value = useMemo<StoreValue>(() => {
    const miResidente = usuario?.residenteId ? (residentes.find((r) => r.id === usuario.residenteId) ?? null) : null;
    const miVivienda = miResidente ? (viviendas.find((v) => v.id === miResidente.viviendaId) ?? null) : null;
    const persona = (x: { nombre: string; apellido: string }) => `${x.nombre} ${x.apellido}`;

    const permisos: PermisoAcceso[] = [
      ...residentes.map<PermisoAcceso>((r) => ({
        id: `p-${r.id}`,
        persona: persona(r),
        tipo: "Residente",
        viviendaId: r.viviendaId,
        metodo: "Biometría multimodal",
        inicio: r.fechaRegistro,
        fin: null,
        estado: r.estado === "Activo" ? "Activo" : "Revocado",
      })),
      ...invitados.map<PermisoAcceso>((i) => ({
        id: `p-${i.id}`,
        persona: persona(i),
        tipo: "Invitado",
        viviendaId: i.viviendaId,
        metodo: "Permiso temporal",
        inicio: i.inicio,
        fin: i.fin,
        estado: i.estado,
      })),
    ];

    // Avisos de expiración derivados: permisos activos que vencen en < 48 h.
    const ahora = Date.now();
    const expiraciones: Notificacion[] = invitados
      .filter((i) => i.estado === "Activo" && new Date(i.fin).getTime() > ahora && new Date(i.fin).getTime() - ahora < 48 * 3600000)
      .map((i) => ({
        id: `exp-${i.id}`,
        residenteId: i.anfitrionId,
        tipo: "Expiración",
        titulo: "Permiso por expirar",
        mensaje: `El pase de ${persona(i)} vence pronto.`,
        fecha: i.fin,
      }));
    const todas = [...notifs, ...expiraciones]
      .filter((n) => usuario?.rol === "Administrador" || n.residenteId === usuario?.residenteId)
      .map((n) => ({ ...n, leida: leidas.has(n.id) }));

    return {
      usuario,
      cargado,
      iniciarSesion,
      cerrarSesion,
      usuarios,
      actualizarPerfil,
      residentes,
      crearResidente: (r) => {
        setResidentes((prev) => [{ ...r, id: nuevoId("r"), fechaRegistro: new Date().toISOString().slice(0, 10) }, ...prev]);
        auditar("Creó", "Residente", persona(r));
      },
      actualizarResidente: (id, datos) => {
        const r = residentes.find((x) => x.id === id);
        setResidentes((prev) => prev.map((x) => (x.id === id ? { ...x, ...datos } : x)));
        const accion = datos.estado === "Activo" ? "Activó" : datos.estado === "Inactivo" ? "Desactivó" : "Editó";
        auditar(accion, "Residente", r ? persona(r) : id);
      },
      viviendas,
      crearVivienda: (v) => {
        setViviendas((prev) => [{ ...v, id: nuevoId("v") }, ...prev]);
        auditar("Creó", "Vivienda", v.codigo);
      },
      actualizarVivienda: (id, datos) => {
        setViviendas((prev) => prev.map((v) => (v.id === id ? { ...v, ...datos } : v)));
        auditar("Editó", "Vivienda", viviendas.find((v) => v.id === id)?.codigo ?? id);
      },
      invitados,
      crearInvitado: (i) => {
        setInvitados((prev) => [{ ...i, id: nuevoId("i") }, ...prev]);
        auditar("Creó", "Permiso de invitado", `${persona(i)} · estado ${i.estado}`);
      },
      actualizarInvitado: (id, datos) => {
        const i = invitados.find((x) => x.id === id);
        setInvitados((prev) => prev.map((x) => (x.id === id ? { ...x, ...datos } : x)));
        const accion = datos.estado === "Activo" ? "Aprobó" : datos.estado === "Revocado" ? "Revocó" : "Editó";
        auditar(accion, "Permiso de invitado", i ? persona(i) : id);
        if (i && datos.estado && usuario?.rol === "Administrador")
          notificar({
            residenteId: i.anfitrionId,
            tipo: "Aviso",
            titulo: `Permiso ${datos.estado === "Activo" ? "aprobado" : datos.estado.toLowerCase()}`,
            mensaje: `El pase de ${persona(i)} fue ${accion.toLowerCase()} por administración.`,
          });
      },
      dispositivos,
      crearDispositivo: (d) => {
        setDispositivos((prev) => [{ ...d, id: nuevoId("d"), ultimaConexion: "hace instantes" }, ...prev]);
        auditar("Creó", "Dispositivo", d.nombre);
      },
      actualizarDispositivo: (id, datos) => {
        setDispositivos((prev) => prev.map((d) => (d.id === id ? { ...d, ...datos } : d)));
        auditar("Editó", "Dispositivo", dispositivos.find((d) => d.id === id)?.nombre ?? id);
      },
      eventos,
      simularIntento,
      registrarEvento,
      biometria,
      permisos,
      notificaciones: todas,
      marcarLeidas: () => setLeidas((prev) => new Set([...prev, ...todas.map((n) => n.id)])),
      auditoria,
      tema,
      alternarTema,
      miResidente,
      miVivienda,
      nombreVivienda: (id) => viviendas.find((v) => v.id === id)?.codigo ?? "—",
      nombreResidente: (id) => {
        const r = residentes.find((x) => x.id === id);
        return r ? persona(r) : "—";
      },
      nombreDispositivo: (id) => dispositivos.find((d) => d.id === id)?.nombre ?? "—",
    };
  }, [
    usuario, cargado, usuarios, iniciarSesion, cerrarSesion, actualizarPerfil, residentes, viviendas,
    invitados, dispositivos, eventos, simularIntento, registrarEvento, biometria, notifs, leidas,
    auditoria, auditar, notificar, tema, alternarTema,
  ]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore debe usarse dentro de StoreProvider");
  return ctx;
}
