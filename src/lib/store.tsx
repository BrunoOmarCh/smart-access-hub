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
  type PermisoAcceso,
  type ReferenciaBiometrica,
  type Residente,
  type Usuario,
  type Vivienda,
} from "./demo-data";

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
  biometria: ReferenciaBiometrica[];
  permisos: PermisoAcceso[];
  /** Ficha de residente del usuario con sesión iniciada (si aplica). */
  miResidente: Residente | null;
  miVivienda: Vivienda | null;
  nombreVivienda: (id?: string) => string;
  nombreResidente: (id?: string) => string;
  nombreDispositivo: (id?: string) => string;
}

const StoreContext = createContext<StoreValue | null>(null);

const nuevoId = (prefijo: string) =>
  `${prefijo}${Math.random().toString(36).slice(2, 8)}`;

const SESION_KEY = "smartaccess.sesion";

export function StoreProvider({ children }: { children: ReactNode }) {
  const [usuarios, setUsuarios] = useState<Usuario[]>(usuariosSeed);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargado, setCargado] = useState(false);
  useEffect(() => {
    const correo = window.localStorage.getItem(SESION_KEY);
    setUsuario(usuariosSeed.find((u) => u.correo === correo) ?? null);
    setCargado(true);
  }, []);
  const [residentes, setResidentes] = useState<Residente[]>(residentesSeed);
  const [viviendas, setViviendas] = useState<Vivienda[]>(viviendasSeed);
  const [invitados, setInvitados] = useState<Invitado[]>(invitadosSeed);
  const [dispositivos, setDispositivos] = useState<Dispositivo[]>(dispositivosSeed);
  const [eventos] = useState<EventoAcceso[]>(eventosSeed);
  const [biometria] = useState<ReferenciaBiometrica[]>(biometriaSeed);

  const iniciarSesion = useCallback(
    (correo: string, clave: string) => {
      const normalizado = correo.trim().toLowerCase();
      const encontrado = usuarios.find((u) => u.correo === normalizado);
      if (!encontrado) return { ok: false, error: "No existe una cuenta con ese correo." };
      if (CREDENCIALES_DEMO[normalizado] !== clave)
        return { ok: false, error: "La contraseña no es correcta." };
      setUsuario(encontrado);
      if (typeof window !== "undefined")
        window.localStorage.setItem(SESION_KEY, normalizado);
      return { ok: true };
    },
    [usuarios],
  );

  const cerrarSesion = useCallback(() => {
    setUsuario(null);
    if (typeof window !== "undefined") window.localStorage.removeItem(SESION_KEY);
  }, []);

  const actualizarPerfil = useCallback(
    (datos: Partial<Usuario>) => {
      setUsuario((prev) => (prev ? { ...prev, ...datos } : prev));
      setUsuarios((prev) =>
        prev.map((u) => (u.id === usuario?.id ? { ...u, ...datos } : u)),
      );
    },
    [usuario?.id],
  );

  const value = useMemo<StoreValue>(() => {
    const miResidente = usuario?.residenteId
      ? (residentes.find((r) => r.id === usuario.residenteId) ?? null)
      : null;
    const miVivienda = miResidente
      ? (viviendas.find((v) => v.id === miResidente.viviendaId) ?? null)
      : null;

    const permisos: PermisoAcceso[] = [
      ...residentes.map<PermisoAcceso>((r) => ({
        id: `p-${r.id}`,
        persona: `${r.nombre} ${r.apellido}`,
        tipo: "Residente",
        viviendaId: r.viviendaId,
        metodo: "Biometría multimodal",
        inicio: r.fechaRegistro,
        fin: null,
        estado: r.estado === "Activo" ? "Activo" : "Revocado",
      })),
      ...invitados.map<PermisoAcceso>((i) => ({
        id: `p-${i.id}`,
        persona: `${i.nombre} ${i.apellido}`,
        tipo: "Invitado",
        viviendaId: i.viviendaId,
        metodo: "Permiso temporal",
        inicio: i.inicio,
        fin: i.fin,
        estado: i.estado,
      })),
    ];

    return {
      usuario,
      cargado,
      iniciarSesion,
      cerrarSesion,
      usuarios,
      actualizarPerfil,
      residentes,
      crearResidente: (r) =>
        setResidentes((prev) => [
          {
            ...r,
            id: nuevoId("r"),
            fechaRegistro: new Date().toISOString().slice(0, 10),
          },
          ...prev,
        ]),
      actualizarResidente: (id, datos) =>
        setResidentes((prev) => prev.map((r) => (r.id === id ? { ...r, ...datos } : r))),
      viviendas,
      crearVivienda: (v) => setViviendas((prev) => [{ ...v, id: nuevoId("v") }, ...prev]),
      actualizarVivienda: (id, datos) =>
        setViviendas((prev) => prev.map((v) => (v.id === id ? { ...v, ...datos } : v))),
      invitados,
      crearInvitado: (i) => setInvitados((prev) => [{ ...i, id: nuevoId("i") }, ...prev]),
      actualizarInvitado: (id, datos) =>
        setInvitados((prev) => prev.map((i) => (i.id === id ? { ...i, ...datos } : i))),
      dispositivos,
      crearDispositivo: (d) =>
        setDispositivos((prev) => [
          { ...d, id: nuevoId("d"), ultimaConexion: "hace instantes" },
          ...prev,
        ]),
      actualizarDispositivo: (id, datos) =>
        setDispositivos((prev) => prev.map((d) => (d.id === id ? { ...d, ...datos } : d))),
      eventos,
      biometria,
      permisos,
      miResidente,
      miVivienda,
      nombreVivienda: (id) => viviendas.find((v) => v.id === id)?.codigo ?? "—",
      nombreResidente: (id) => {
        const r = residentes.find((x) => x.id === id);
        return r ? `${r.nombre} ${r.apellido}` : "—";
      },
      nombreDispositivo: (id) => dispositivos.find((d) => d.id === id)?.nombre ?? "—",
    };
  }, [
    usuario,
    cargado,
    usuarios,
    iniciarSesion,
    cerrarSesion,
    actualizarPerfil,
    residentes,
    viviendas,
    invitados,
    dispositivos,
    eventos,
    biometria,
  ]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore debe usarse dentro de StoreProvider");
  return ctx;
}
