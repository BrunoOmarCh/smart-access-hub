// Datos de demostración de SmartAccess.
// Todos los registros son ficticios y sirven únicamente para el MVP.
// La forma de las entidades sigue el modelo conceptual del proyecto para que
// más adelante puedan conectarse a un backend real sin rediseñar la interfaz.

export type Rol = "Administrador" | "Residente";

export interface Usuario {
  id: string;
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  rol: Rol;
  estado: "Activo" | "Inactivo";
  /** Solo para residentes: vínculo con su ficha de residente. */
  residenteId?: string;
}

export interface Vivienda {
  id: string;
  codigo: string;
  torre: string;
  piso: number;
  estado: "Ocupada" | "Disponible" | "Inactiva";
  residentePrincipal?: string;
}

export interface Residente {
  id: string;
  nombre: string;
  apellido: string;
  documento: string;
  correo: string;
  telefono: string;
  viviendaId: string;
  estado: "Activo" | "Inactivo";
  fechaRegistro: string;
}

export type EstadoInvitado = "Pendiente" | "Activo" | "Expirado" | "Revocado";

export interface Invitado {
  id: string;
  nombre: string;
  apellido: string;
  documento: string;
  anfitrionId: string;
  viviendaId: string;
  inicio: string; // ISO
  fin: string; // ISO
  estado: EstadoInvitado;
}

export type TipoDispositivo =
  | "Controlador de acceso"
  | "Cámara"
  | "Lector biométrico"
  | "Sensor"
  | "Cerradura/Relé";

export interface Dispositivo {
  id: string;
  nombre: string;
  tipo: TipoDispositivo;
  ubicacion: string;
  estado: "Online" | "Offline" | "Mantenimiento";
  ultimaConexion: string;
  identificador: string;
}

export type MetodoAcceso =
  | "Reconocimiento facial"
  | "Huella dactilar"
  | "Invitado"
  | "Administrador";

export interface EventoAcceso {
  id: string;
  fecha: string; // YYYY-MM-DD
  hora: string; // HH:MM
  persona: string;
  viviendaId?: string;
  metodo: MetodoAcceso;
  resultado: "Autorizado" | "Rechazado";
  dispositivoId: string;
  motivo: string;
}

export interface ReferenciaBiometrica {
  id: string;
  residenteId: string;
  tipo: "Rostro" | "Huella";
  estado: "Registrada" | "Pendiente" | "No registrada";
  fechaRegistro: string;
  fechaActualizacion: string;
}

export interface PermisoAcceso {
  id: string;
  persona: string;
  tipo: "Residente" | "Invitado";
  viviendaId: string;
  metodo: string;
  inicio: string;
  fin: string | null;
  estado: "Activo" | "Pendiente" | "Expirado" | "Revocado";
}

export const CONDOMINIO = {
  nombre: "Residencial SmartAccess",
  direccion: "Av. Los Álamos 240, Lima",
  viviendas: 6,
  descripcion:
    "Condominio de demostración con dos torres, control de acceso multimodal y registro de eventos.",
};

export const viviendasSeed: Vivienda[] = [
  { id: "v1", codigo: "A-101", torre: "A", piso: 1, estado: "Ocupada", residentePrincipal: "r1" },
  { id: "v2", codigo: "A-102", torre: "A", piso: 1, estado: "Ocupada", residentePrincipal: "r2" },
  { id: "v3", codigo: "A-201", torre: "A", piso: 2, estado: "Ocupada", residentePrincipal: "r3" },
  { id: "v4", codigo: "A-202", torre: "A", piso: 2, estado: "Disponible" },
  { id: "v5", codigo: "B-101", torre: "B", piso: 1, estado: "Ocupada", residentePrincipal: "r4" },
  { id: "v6", codigo: "B-102", torre: "B", piso: 1, estado: "Inactiva" },
];

export const residentesSeed: Residente[] = [
  {
    id: "r1",
    nombre: "Lucía",
    apellido: "Herrera",
    documento: "45872103",
    correo: "residente@smartaccess.demo",
    telefono: "+51 987 112 334",
    viviendaId: "v1",
    estado: "Activo",
    fechaRegistro: "2026-02-11",
  },
  {
    id: "r2",
    nombre: "Marco",
    apellido: "Delgado",
    documento: "40219876",
    correo: "marco.delgado@demo.test",
    telefono: "+51 987 220 145",
    viviendaId: "v2",
    estado: "Activo",
    fechaRegistro: "2026-02-18",
  },
  {
    id: "r3",
    nombre: "Ana",
    apellido: "Ríos",
    documento: "47731260",
    correo: "ana.rios@demo.test",
    telefono: "+51 981 554 902",
    viviendaId: "v3",
    estado: "Activo",
    fechaRegistro: "2026-03-02",
  },
  {
    id: "r4",
    nombre: "Diego",
    apellido: "Salas",
    documento: "42908311",
    correo: "diego.salas@demo.test",
    telefono: "+51 999 331 087",
    viviendaId: "v5",
    estado: "Inactivo",
    fechaRegistro: "2026-01-27",
  },
];

export const usuariosSeed: Usuario[] = [
  {
    id: "u1",
    nombre: "María",
    apellido: "Castro",
    correo: "admin@smartaccess.demo",
    telefono: "+51 987 000 111",
    rol: "Administrador",
    estado: "Activo",
  },
  {
    id: "u2",
    nombre: "Lucía",
    apellido: "Herrera",
    correo: "residente@smartaccess.demo",
    telefono: "+51 987 112 334",
    rol: "Residente",
    estado: "Activo",
    residenteId: "r1",
  },
];

/** Credenciales de demostración (MVP sin backend). */
export const CREDENCIALES_DEMO: Record<string, string> = {
  "admin@smartaccess.demo": "demo1234",
  "residente@smartaccess.demo": "demo1234",
};

const hoy = new Date();
const iso = (d: Date) => d.toISOString().slice(0, 16);
const dias = (n: number) => {
  const d = new Date(hoy);
  d.setDate(d.getDate() + n);
  return d;
};

export const invitadosSeed: Invitado[] = [
  {
    id: "i1",
    nombre: "Javier",
    apellido: "Paredes",
    documento: "70112233",
    anfitrionId: "r1",
    viviendaId: "v1",
    inicio: iso(dias(-1)),
    fin: iso(dias(1)),
    estado: "Activo",
  },
  {
    id: "i2",
    nombre: "Carmen",
    apellido: "Vega",
    documento: "71993410",
    anfitrionId: "r1",
    viviendaId: "v1",
    inicio: iso(dias(2)),
    fin: iso(dias(3)),
    estado: "Pendiente",
  },
  {
    id: "i3",
    nombre: "Renato",
    apellido: "Quispe",
    documento: "72330198",
    anfitrionId: "r2",
    viviendaId: "v2",
    inicio: iso(dias(-10)),
    fin: iso(dias(-8)),
    estado: "Expirado",
  },
  {
    id: "i4",
    nombre: "Patricia",
    apellido: "Lam",
    documento: "70884512",
    anfitrionId: "r3",
    viviendaId: "v3",
    inicio: iso(dias(-3)),
    fin: iso(dias(4)),
    estado: "Revocado",
  },
];

export const dispositivosSeed: Dispositivo[] = [
  {
    id: "d1",
    nombre: "Puerta principal",
    tipo: "Lector biométrico",
    ubicacion: "Ingreso peatonal",
    estado: "Online",
    ultimaConexion: "hace 2 min",
    identificador: "ESP32-CAM-001",
  },
  {
    id: "d2",
    nombre: "Garaje sur",
    tipo: "Controlador de acceso",
    ubicacion: "Estacionamiento nivel -1",
    estado: "Offline",
    ultimaConexion: "hace 3 h",
    identificador: "ESP32-CTRL-004",
  },
  {
    id: "d3",
    nombre: "Acceso visitantes",
    tipo: "Cámara",
    ubicacion: "Lobby Torre A",
    estado: "Online",
    ultimaConexion: "hace 1 min",
    identificador: "ESP32-CAM-002",
  },
  {
    id: "d4",
    nombre: "Cerradura Torre B",
    tipo: "Cerradura/Relé",
    ubicacion: "Ingreso Torre B",
    estado: "Mantenimiento",
    ultimaConexion: "hace 1 día",
    identificador: "RELE-B-011",
  },
  {
    id: "d5",
    nombre: "Sensor azotea",
    tipo: "Sensor",
    ubicacion: "Azotea Torre A",
    estado: "Online",
    ultimaConexion: "hace 6 min",
    identificador: "SENS-A-207",
  },
];

const fechaTexto = (n: number) => dias(n).toISOString().slice(0, 10);

export const eventosSeed: EventoAcceso[] = [
  {
    id: "e1",
    fecha: fechaTexto(0),
    hora: "09:42",
    persona: "Lucía Herrera",
    viviendaId: "v1",
    metodo: "Reconocimiento facial",
    resultado: "Autorizado",
    dispositivoId: "d1",
    motivo: "Coincidencia biométrica válida",
  },
  {
    id: "e2",
    fecha: fechaTexto(0),
    hora: "09:45",
    persona: "Javier Paredes (invitado)",
    viviendaId: "v1",
    metodo: "Invitado",
    resultado: "Autorizado",
    dispositivoId: "d3",
    motivo: "Permiso de invitado vigente",
  },
  {
    id: "e3",
    fecha: fechaTexto(0),
    hora: "09:51",
    persona: "Persona no reconocida",
    metodo: "Reconocimiento facial",
    resultado: "Rechazado",
    dispositivoId: "d1",
    motivo: "Sin coincidencia biométrica",
  },
  {
    id: "e4",
    fecha: fechaTexto(0),
    hora: "08:18",
    persona: "Ana Ríos",
    viviendaId: "v3",
    metodo: "Huella dactilar",
    resultado: "Autorizado",
    dispositivoId: "d1",
    motivo: "Coincidencia biométrica válida",
  },
  {
    id: "e5",
    fecha: fechaTexto(-1),
    hora: "19:05",
    persona: "Marco Delgado",
    viviendaId: "v2",
    metodo: "Reconocimiento facial",
    resultado: "Autorizado",
    dispositivoId: "d3",
    motivo: "Coincidencia biométrica válida",
  },
  {
    id: "e6",
    fecha: fechaTexto(-1),
    hora: "21:33",
    persona: "Renato Quispe (invitado)",
    viviendaId: "v2",
    metodo: "Invitado",
    resultado: "Rechazado",
    dispositivoId: "d2",
    motivo: "Permiso expirado",
  },
  {
    id: "e7",
    fecha: fechaTexto(-2),
    hora: "07:12",
    persona: "Diego Salas",
    viviendaId: "v5",
    metodo: "Huella dactilar",
    resultado: "Rechazado",
    dispositivoId: "d1",
    motivo: "Residente inactivo",
  },
  {
    id: "e8",
    fecha: fechaTexto(-2),
    hora: "12:48",
    persona: "María Castro",
    metodo: "Administrador",
    resultado: "Autorizado",
    dispositivoId: "d4",
    motivo: "Apertura manual autorizada",
  },
  {
    id: "e9",
    fecha: fechaTexto(-3),
    hora: "17:26",
    persona: "Lucía Herrera",
    viviendaId: "v1",
    metodo: "Huella dactilar",
    resultado: "Autorizado",
    dispositivoId: "d1",
    motivo: "Coincidencia biométrica válida",
  },
  {
    id: "e10",
    fecha: fechaTexto(-4),
    hora: "10:02",
    persona: "Carmen Vega (invitado)",
    viviendaId: "v1",
    metodo: "Invitado",
    resultado: "Autorizado",
    dispositivoId: "d3",
    motivo: "Permiso de invitado vigente",
  },
];

export const biometriaSeed: ReferenciaBiometrica[] = [
  {
    id: "b1",
    residenteId: "r1",
    tipo: "Rostro",
    estado: "Registrada",
    fechaRegistro: "2026-02-12",
    fechaActualizacion: "2026-08-04",
  },
  {
    id: "b2",
    residenteId: "r1",
    tipo: "Huella",
    estado: "Registrada",
    fechaRegistro: "2026-02-12",
    fechaActualizacion: "2026-02-12",
  },
  {
    id: "b3",
    residenteId: "r2",
    tipo: "Rostro",
    estado: "Pendiente",
    fechaRegistro: "2026-03-01",
    fechaActualizacion: "2026-03-01",
  },
  {
    id: "b4",
    residenteId: "r3",
    tipo: "Huella",
    estado: "Registrada",
    fechaRegistro: "2026-03-05",
    fechaActualizacion: "2026-07-19",
  },
  {
    id: "b5",
    residenteId: "r4",
    tipo: "Rostro",
    estado: "No registrada",
    fechaRegistro: "—",
    fechaActualizacion: "—",
  },
];

/** Accesos por día para la visualización simple del dashboard. */
export const accesosPorDia = [
  { dia: "Lun", total: 42 },
  { dia: "Mar", total: 55 },
  { dia: "Mié", total: 38 },
  { dia: "Jue", total: 61 },
  { dia: "Vie", total: 74 },
  { dia: "Sáb", total: 49 },
  { dia: "Dom", total: 31 },
];
