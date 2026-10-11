import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import type {
  Dispositivo,
  EventoAcceso,
  Invitado,
  Notificacion,
  PermisoAcceso,
  ReferenciaBiometrica,
  RegistroAuditoria,
  Residente,
  Usuario,
  Vivienda,
} from "./demo-data";

export interface OpcionesIntento {
  dispositivoId?: string;
  metodo?: EventoAcceso["metodo"];
  invitadoId?: string;
  origen?: EventoAcceso["origen"];
}

export interface Solicitud {
  id: string;
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  documento: string;
  viviendaSolicitada: string;
  estado: string;
  fecha: string;
}

export interface DatosRegistro {
  nombre: string;
  apellido: string;
  correo: string;
  clave: string;
  telefono: string;
  documento: string;
  vivienda: string;
}

interface StoreValue {
  usuario: Usuario | null;
  cargado: boolean;
  iniciarSesion: (correo: string, clave: string) => Promise<{ ok: boolean; error?: string }>;
  registrarse: (d: DatosRegistro) => Promise<{ ok: boolean; error?: string }>;
  cerrarSesion: () => void;
  usuarios: Usuario[];
  actualizarPerfil: (datos: Partial<Usuario>) => void;
  solicitudes: Solicitud[];
  aprobarSolicitud: (userId: string, viviendaId: string) => Promise<string | null>;
  rechazarSolicitud: (userId: string) => Promise<string | null>;
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

const nuevoId = () => crypto.randomUUID();
const TEMA_KEY = "smartaccess.tema";
const pad = (n: number) => String(n).padStart(2, "0");
const fechaHora = (d: Date) => ({
  fecha: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
  hora: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
});

/* ---------- Mapeo base de datos <-> app ---------- */
type Fila = Record<string, any>;
const deResidente = (r: Fila): Residente => ({
  id: r.id, nombre: r.nombre, apellido: r.apellido, documento: r.documento, correo: r.correo,
  telefono: r.telefono, viviendaId: r.vivienda_id ?? "", estado: r.estado, fechaRegistro: r.fecha_registro,
});
const aResidente = (r: Partial<Residente>) => limpiar({
  nombre: r.nombre, apellido: r.apellido, documento: r.documento, correo: r.correo,
  telefono: r.telefono, vivienda_id: r.viviendaId === undefined ? undefined : r.viviendaId || null, estado: r.estado,
});
const deVivienda = (v: Fila): Vivienda => ({
  id: v.id, codigo: v.codigo, torre: v.torre, piso: v.piso, estado: v.estado, residentePrincipal: v.residente_principal ?? undefined,
});
const aVivienda = (v: Partial<Vivienda>) => limpiar({
  codigo: v.codigo, torre: v.torre, piso: v.piso, estado: v.estado,
  residente_principal: v.residentePrincipal === undefined ? undefined : v.residentePrincipal || null,
});
const deInvitado = (i: Fila): Invitado => ({
  id: i.id, nombre: i.nombre, apellido: i.apellido, documento: i.documento, anfitrionId: i.anfitrion_id,
  viviendaId: i.vivienda_id ?? "", inicio: i.inicio, fin: i.fin, estado: i.estado,
});
const aInvitado = (i: Partial<Invitado>) => limpiar({
  nombre: i.nombre, apellido: i.apellido, documento: i.documento, anfitrion_id: i.anfitrionId,
  vivienda_id: i.viviendaId === undefined ? undefined : i.viviendaId || null, inicio: i.inicio, fin: i.fin, estado: i.estado,
});
const deDispositivo = (d: Fila): Dispositivo => ({
  id: d.id, nombre: d.nombre, tipo: d.tipo, ubicacion: d.ubicacion, estado: d.estado,
  ultimaConexion: d.ultima_conexion, identificador: d.identificador,
});
const aDispositivo = (d: Partial<Dispositivo>) => limpiar({
  nombre: d.nombre, tipo: d.tipo, ubicacion: d.ubicacion, estado: d.estado,
  ultima_conexion: d.ultimaConexion, identificador: d.identificador,
});
const deEvento = (e: Fila): EventoAcceso => ({
  id: e.id, fecha: e.fecha, hora: e.hora, persona: e.persona, viviendaId: e.vivienda_id ?? undefined,
  metodo: e.metodo, resultado: e.resultado, dispositivoId: e.dispositivo_id ?? "", motivo: e.motivo, origen: e.origen ?? undefined,
});
const aEvento = (e: EventoAcceso) => ({
  id: e.id, fecha: e.fecha, hora: e.hora, persona: e.persona, vivienda_id: e.viviendaId ?? null, metodo: e.metodo,
  resultado: e.resultado, dispositivo_id: e.dispositivoId || null, motivo: e.motivo, origen: e.origen ?? null,
});
function limpiar<T extends Fila>(o: T): Partial<T> {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as Partial<T>;
}
const ordenarEventos = (l: EventoAcceso[]) =>
  [...l].sort((a, b) => `${b.fecha} ${b.hora}`.localeCompare(`${a.fecha} ${a.hora}`));

const avisarError = (error: { message: string } | null) => {
  if (error) {
    console.error(error);
    import("sonner").then(({ toast }) => toast.error("No se pudo guardar: " + error.message));
  }
};

export function StoreProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargado, setCargado] = useState(false);
  const [tema, setTema] = useState<"claro" | "oscuro">("claro");
  const [residentes, setResidentes] = useState<Residente[]>([]);
  const [viviendas, setViviendas] = useState<Vivienda[]>([]);
  const [invitados, setInvitados] = useState<Invitado[]>([]);
  const [dispositivos, setDispositivos] = useState<Dispositivo[]>([]);
  const [eventos, setEventos] = useState<EventoAcceso[]>([]);
  const [biometria, setBiometria] = useState<ReferenciaBiometrica[]>([]);
  const [notifs, setNotifs] = useState<(Notificacion & { leida: boolean })[]>([]);
  const [leidasLocal, setLeidasLocal] = useState<Set<string>>(new Set());
  const [auditoria, setAuditoria] = useState<RegistroAuditoria[]>([]);
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);

  useEffect(() => {
    setTema(window.localStorage.getItem(TEMA_KEY) === "oscuro" ? "oscuro" : "claro");
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

  /** Carga el perfil del usuario y todos los datos que sus permisos le dejan ver. */
  const cargarTodo = useCallback(async (userId: string | null) => {
    if (!userId) {
      setUsuario(null);
      setCargado(true);
      return;
    }
    const [{ data: perfil }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);
    const esAdmin = (roles ?? []).some((r) => r.role === "admin");
    if (!perfil || perfil.estado !== "Activo" || (!esAdmin && !(roles ?? []).length)) {
      setUsuario(null);
      setCargado(true);
      return;
    }
    const q = await Promise.all([
      supabase.from("residentes").select("*").order("created_at", { ascending: false }),
      supabase.from("viviendas").select("*").order("codigo"),
      supabase.from("invitados").select("*").order("created_at", { ascending: false }),
      supabase.from("dispositivos").select("*").order("created_at"),
      supabase.from("eventos").select("*").order("created_at", { ascending: false }).limit(1000),
      supabase.from("biometria").select("*"),
      supabase.from("notificaciones").select("*").order("fecha", { ascending: false }).limit(200),
      esAdmin ? supabase.from("auditoria").select("*").order("fecha", { ascending: false }).limit(500) : Promise.resolve({ data: [] as Fila[] }),
      esAdmin ? supabase.from("profiles").select("*").neq("estado", "Activo").order("created_at", { ascending: false }) : Promise.resolve({ data: [] as Fila[] }),
    ]);
    const res = (q[0].data ?? []).map(deResidente);
    setResidentes(res);
    setViviendas((q[1].data ?? []).map(deVivienda));
    setInvitados((q[2].data ?? []).map(deInvitado));
    setDispositivos((q[3].data ?? []).map(deDispositivo));
    setEventos(ordenarEventos((q[4].data ?? []).map(deEvento)));
    setBiometria((q[5].data ?? []).map((b: Fila) => ({
      id: b.id, residenteId: b.residente_id, tipo: b.tipo, estado: b.estado,
      fechaRegistro: b.fecha_registro, fechaActualizacion: b.fecha_actualizacion,
    })));
    setNotifs((q[6].data ?? []).map((n: Fila) => ({
      id: n.id, residenteId: n.residente_id, tipo: n.tipo, titulo: n.titulo, mensaje: n.mensaje, fecha: n.fecha, leida: n.leida,
    })));
    setAuditoria((q[7].data ?? []).map((a: Fila) => ({
      id: a.id, fecha: a.fecha, actor: a.actor, rol: a.rol, accion: a.accion, entidad: a.entidad, detalle: a.detalle,
    })));
    setSolicitudes((q[8].data ?? []).map((p: Fila) => ({
      id: p.id, nombre: p.nombre, apellido: p.apellido, correo: p.correo, telefono: p.telefono,
      documento: p.documento, viviendaSolicitada: p.vivienda_solicitada, estado: p.estado, fecha: p.created_at,
    })));
    const mio = res.find((r) => (r as Residente & { userId?: string }) && (q[0].data ?? []).find((f: Fila) => f.id === r.id)?.user_id === userId);
    setUsuario({
      id: userId,
      nombre: perfil.nombre || mio?.nombre || "Usuario",
      apellido: perfil.apellido || mio?.apellido || "",
      correo: perfil.correo,
      telefono: perfil.telefono || mio?.telefono || "",
      rol: esAdmin ? "Administrador" : "Residente",
      estado: "Activo",
      residenteId: mio?.id,
    });
    setCargado(true);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => cargarTodo(data.session?.user.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((evento, sesion) => {
      if (evento !== "SIGNED_IN" && evento !== "SIGNED_OUT" && evento !== "USER_UPDATED") return;
      setTimeout(() => cargarTodo(sesion?.user.id ?? null), 0);
    });
    return () => sub.subscription.unsubscribe();
  }, [cargarTodo]);

  const auditar = useCallback(
    (accion: string, entidad: string, detalle: string) => {
      if (!usuario) return;
      const reg = {
        id: nuevoId(), fecha: new Date().toISOString(), actor: `${usuario.nombre} ${usuario.apellido}`,
        rol: usuario.rol, accion, entidad, detalle,
      };
      setAuditoria((prev) => [reg, ...prev]);
      supabase.from("auditoria").insert({ ...reg, actor_id: usuario.id }).then(({ error }) => error && console.error(error));
    },
    [usuario],
  );

  const notificar = useCallback(
    (n: Omit<Notificacion, "id" | "fecha">) => {
      const fila = { ...n, id: nuevoId(), fecha: new Date().toISOString(), leida: false };
      setNotifs((prev) => [fila, ...prev]);
      supabase.from("notificaciones").insert({
        id: fila.id, residente_id: n.residenteId, tipo: n.tipo, titulo: n.titulo, mensaje: n.mensaje, fecha: fila.fecha,
      }).then(({ error }) => error && console.error(error));
    },
    [],
  );

  const registrarEvento = useCallback((e: Omit<EventoAcceso, "id">) => {
    const ev = { ...e, id: nuevoId() };
    setEventos((prev) => [ev, ...prev]);
    supabase.from("eventos").insert(aEvento(ev)).then(({ error }) => avisarError(error));
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

  const iniciarSesion = useCallback(async (correo: string, clave: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email: correo.trim().toLowerCase(), password: clave });
    if (error) return { ok: false, error: "Correo o contraseña incorrectos." };
    const { data: perfil } = await supabase.from("profiles").select("estado").eq("id", data.user.id).maybeSingle();
    if (perfil?.estado !== "Activo") {
      await supabase.auth.signOut();
      return {
        ok: false,
        error: perfil?.estado === "Rechazado"
          ? "Tu solicitud fue rechazada. Comunícate con la administración."
          : "Tu cuenta está pendiente de aprobación por la administración.",
      };
    }
    return { ok: true };
  }, []);

  const registrarse = useCallback(async (d: DatosRegistro) => {
    const { error } = await supabase.auth.signUp({
      email: d.correo.trim().toLowerCase(),
      password: d.clave,
      options: {
        emailRedirectTo: window.location.origin,
        data: { nombre: d.nombre, apellido: d.apellido, telefono: d.telefono, documento: d.documento, vivienda: d.vivienda },
      },
    });
    if (error) return { ok: false, error: error.message };
    await supabase.auth.signOut();
    return { ok: true };
  }, []);

  const cerrarSesion = useCallback(() => {
    setUsuario(null);
    supabase.auth.signOut();
  }, []);

  const actualizarPerfil = useCallback(
    (datos: Partial<Usuario>) => {
      if (!usuario) return;
      setUsuario((prev) => (prev ? { ...prev, ...datos } : prev));
      const campos = limpiar({ nombre: datos.nombre, apellido: datos.apellido, telefono: datos.telefono });
      supabase.from("profiles").update(campos).eq("id", usuario.id).then(({ error }) => avisarError(error));
      if (usuario.residenteId) {
        setResidentes((prev) => prev.map((r) => (r.id === usuario.residenteId ? { ...r, ...campos } : r)));
        supabase.from("residentes").update(campos).eq("id", usuario.residenteId).then(({ error }) => avisarError(error));
      }
      auditar("Editó", "Perfil", "Actualización de datos personales");
    },
    [usuario, auditar],
  );

  const aprobarSolicitud = useCallback(async (userId: string, viviendaId: string) => {
    const s = solicitudes.find((x) => x.id === userId);
    const { error } = await supabase.rpc("aprobar_usuario", { _user_id: userId, _vivienda_id: viviendaId });
    if (error) return error.message;
    auditar("Aprobó", "Cuenta", s ? `${s.nombre} ${s.apellido} (${s.correo})` : userId);
    await cargarTodo(usuario?.id ?? null);
    return null;
  }, [solicitudes, auditar, cargarTodo, usuario?.id]);

  const rechazarSolicitud = useCallback(async (userId: string) => {
    const s = solicitudes.find((x) => x.id === userId);
    const { error } = await supabase.rpc("rechazar_usuario", { _user_id: userId });
    if (error) return error.message;
    setSolicitudes((prev) => prev.map((x) => (x.id === userId ? { ...x, estado: "Rechazado" } : x)));
    auditar("Rechazó", "Cuenta", s ? `${s.nombre} ${s.apellido} (${s.correo})` : userId);
    return null;
  }, [solicitudes, auditar]);

  const value = useMemo<StoreValue>(() => {
    const miResidente = usuario?.residenteId ? (residentes.find((r) => r.id === usuario.residenteId) ?? null) : null;
    const miVivienda = miResidente ? (viviendas.find((v) => v.id === miResidente.viviendaId) ?? null) : null;
    const persona = (x: { nombre: string; apellido: string }) => `${x.nombre} ${x.apellido}`;

    const permisos: PermisoAcceso[] = [
      ...residentes.map<PermisoAcceso>((r) => ({
        id: `p-${r.id}`, persona: persona(r), tipo: "Residente", viviendaId: r.viviendaId,
        metodo: "Biometría multimodal", inicio: r.fechaRegistro, fin: null,
        estado: r.estado === "Activo" ? "Activo" : "Revocado",
      })),
      ...invitados.map<PermisoAcceso>((i) => ({
        id: `p-${i.id}`, persona: persona(i), tipo: "Invitado", viviendaId: i.viviendaId,
        metodo: "Permiso temporal", inicio: i.inicio, fin: i.fin, estado: i.estado,
      })),
    ];

    // Avisos de expiración derivados: permisos activos que vencen en < 48 h.
    const ahora = Date.now();
    const expiraciones = invitados
      .filter((i) => i.estado === "Activo" && new Date(i.fin).getTime() > ahora && new Date(i.fin).getTime() - ahora < 48 * 3600000)
      .map((i) => ({
        id: `exp-${i.id}`, residenteId: i.anfitrionId, tipo: "Expiración" as const, titulo: "Permiso por expirar",
        mensaje: `El pase de ${persona(i)} vence pronto.`, fecha: i.fin, leida: false,
      }));
    const todas = [...notifs, ...expiraciones]
      .filter((n) => usuario?.rol === "Administrador" || n.residenteId === usuario?.residenteId)
      .map((n) => ({ ...n, leida: n.leida || leidasLocal.has(n.id) }));

    return {
      usuario,
      cargado,
      iniciarSesion,
      registrarse,
      cerrarSesion,
      usuarios: usuario ? [usuario] : [],
      actualizarPerfil,
      solicitudes,
      aprobarSolicitud,
      rechazarSolicitud,
      residentes,
      crearResidente: (r) => {
        const nuevo = { ...r, id: nuevoId(), fechaRegistro: new Date().toISOString().slice(0, 10) };
        setResidentes((prev) => [nuevo, ...prev]);
        supabase.from("residentes").insert({ id: nuevo.id, ...aResidente(r) } as never).then(({ error }) => avisarError(error));
        auditar("Creó", "Residente", persona(r));
      },
      actualizarResidente: (id, datos) => {
        const r = residentes.find((x) => x.id === id);
        setResidentes((prev) => prev.map((x) => (x.id === id ? { ...x, ...datos } : x)));
        supabase.from("residentes").update(aResidente(datos)).eq("id", id).then(({ error }) => avisarError(error));
        const accion = datos.estado === "Activo" ? "Activó" : datos.estado === "Inactivo" ? "Desactivó" : "Editó";
        auditar(accion, "Residente", r ? persona(r) : id);
      },
      viviendas,
      crearVivienda: (v) => {
        const nueva = { ...v, id: nuevoId() };
        setViviendas((prev) => [nueva, ...prev]);
        supabase.from("viviendas").insert({ id: nueva.id, ...aVivienda(v) } as never).then(({ error }) => avisarError(error));
        auditar("Creó", "Vivienda", v.codigo);
      },
      actualizarVivienda: (id, datos) => {
        setViviendas((prev) => prev.map((v) => (v.id === id ? { ...v, ...datos } : v)));
        supabase.from("viviendas").update(aVivienda(datos)).eq("id", id).then(({ error }) => avisarError(error));
        auditar("Editó", "Vivienda", viviendas.find((v) => v.id === id)?.codigo ?? id);
      },
      invitados,
      crearInvitado: (i) => {
        const nuevo = { ...i, id: nuevoId() };
        setInvitados((prev) => [nuevo, ...prev]);
        supabase.from("invitados").insert({ id: nuevo.id, ...aInvitado(i) } as never).then(({ error }) => avisarError(error));
        auditar("Creó", "Permiso de invitado", `${persona(i)} · estado ${i.estado}`);
      },
      actualizarInvitado: (id, datos) => {
        const i = invitados.find((x) => x.id === id);
        setInvitados((prev) => prev.map((x) => (x.id === id ? { ...x, ...datos } : x)));
        supabase.from("invitados").update(aInvitado(datos)).eq("id", id).then(({ error }) => avisarError(error));
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
        const nuevo = { ...d, id: nuevoId(), ultimaConexion: "hace instantes" };
        setDispositivos((prev) => [nuevo, ...prev]);
        supabase.from("dispositivos").insert({ id: nuevo.id, ...aDispositivo(nuevo) } as never).then(({ error }) => avisarError(error));
        auditar("Creó", "Dispositivo", d.nombre);
      },
      actualizarDispositivo: (id, datos) => {
        setDispositivos((prev) => prev.map((d) => (d.id === id ? { ...d, ...datos } : d)));
        supabase.from("dispositivos").update(aDispositivo(datos)).eq("id", id).then(({ error }) => avisarError(error));
        auditar("Editó", "Dispositivo", dispositivos.find((d) => d.id === id)?.nombre ?? id);
      },
      eventos,
      simularIntento,
      registrarEvento,
      biometria,
      permisos,
      notificaciones: todas,
      marcarLeidas: () => {
        setLeidasLocal((prev) => new Set([...prev, ...todas.map((n) => n.id)]));
        const ids = notifs.filter((n) => !n.leida).map((n) => n.id);
        if (ids.length) supabase.from("notificaciones").update({ leida: true }).in("id", ids).then(() => {});
      },
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
    usuario, cargado, iniciarSesion, registrarse, cerrarSesion, actualizarPerfil, solicitudes, aprobarSolicitud,
    rechazarSolicitud, residentes, viviendas, invitados, dispositivos, eventos, simularIntento, registrarEvento,
    biometria, notifs, leidasLocal, auditoria, auditar, notificar, tema, alternarTema,
  ]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore debe usarse dentro de StoreProvider");
  return ctx;
}
