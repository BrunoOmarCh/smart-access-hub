
CREATE TYPE public.app_role AS ENUM ('admin', 'residente');

-- Perfiles de usuario (datos personales básicos)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre text NOT NULL DEFAULT '',
  apellido text NOT NULL DEFAULT '',
  correo text NOT NULL DEFAULT '',
  telefono text NOT NULL DEFAULT '',
  documento text NOT NULL DEFAULT '',
  vivienda_solicitada text NOT NULL DEFAULT '',
  estado text NOT NULL DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente','Activo','Inactivo','Rechazado')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "ver mis roles" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Dominio
CREATE TABLE public.viviendas (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  codigo text NOT NULL,
  torre text NOT NULL DEFAULT '',
  piso int NOT NULL DEFAULT 1,
  estado text NOT NULL DEFAULT 'Disponible',
  residente_principal text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.residentes (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id uuid UNIQUE,
  nombre text NOT NULL,
  apellido text NOT NULL,
  documento text NOT NULL DEFAULT '',
  correo text NOT NULL DEFAULT '',
  telefono text NOT NULL DEFAULT '',
  vivienda_id text REFERENCES public.viviendas(id),
  estado text NOT NULL DEFAULT 'Activo',
  fecha_registro text NOT NULL DEFAULT to_char(now(), 'YYYY-MM-DD'),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.mi_residente_id()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.residentes WHERE user_id = auth.uid() LIMIT 1
$$;
CREATE OR REPLACE FUNCTION public.mi_vivienda_id()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT vivienda_id FROM public.residentes WHERE user_id = auth.uid() LIMIT 1
$$;

CREATE TABLE public.invitados (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  nombre text NOT NULL,
  apellido text NOT NULL,
  documento text NOT NULL DEFAULT '',
  anfitrion_id text NOT NULL REFERENCES public.residentes(id),
  vivienda_id text REFERENCES public.viviendas(id),
  inicio timestamptz NOT NULL,
  fin timestamptz NOT NULL,
  estado text NOT NULL DEFAULT 'Pendiente',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.dispositivos (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  nombre text NOT NULL,
  tipo text NOT NULL,
  ubicacion text NOT NULL DEFAULT '',
  estado text NOT NULL DEFAULT 'Online',
  ultima_conexion text NOT NULL DEFAULT 'hace instantes',
  identificador text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.eventos (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  fecha text NOT NULL,
  hora text NOT NULL,
  persona text NOT NULL,
  vivienda_id text,
  metodo text NOT NULL,
  resultado text NOT NULL,
  dispositivo_id text,
  motivo text NOT NULL DEFAULT '',
  origen text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.biometria (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  residente_id text NOT NULL REFERENCES public.residentes(id),
  tipo text NOT NULL,
  estado text NOT NULL,
  fecha_registro text NOT NULL DEFAULT '—',
  fecha_actualizacion text NOT NULL DEFAULT '—'
);

CREATE TABLE public.notificaciones (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  residente_id text NOT NULL,
  tipo text NOT NULL,
  titulo text NOT NULL,
  mensaje text NOT NULL,
  fecha timestamptz NOT NULL DEFAULT now(),
  leida boolean NOT NULL DEFAULT false
);

CREATE TABLE public.auditoria (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  fecha timestamptz NOT NULL DEFAULT now(),
  actor_id uuid,
  actor text NOT NULL,
  rol text NOT NULL,
  accion text NOT NULL,
  entidad text NOT NULL,
  detalle text NOT NULL DEFAULT ''
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.viviendas, public.residentes, public.invitados, public.dispositivos, public.eventos, public.biometria, public.notificaciones TO authenticated;
GRANT SELECT, INSERT ON public.auditoria TO authenticated;
GRANT ALL ON public.viviendas, public.residentes, public.invitados, public.dispositivos, public.eventos, public.biometria, public.notificaciones, public.auditoria TO service_role;

ALTER TABLE public.viviendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.residentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispositivos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.biometria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditoria ENABLE ROW LEVEL SECURITY;

-- Perfiles
CREATE POLICY "ver perfil" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "editar perfil" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Un usuario no administrador no puede cambiar su estado ni su correo
CREATE OR REPLACE FUNCTION public.proteger_perfil()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') AND auth.uid() IS NOT NULL THEN
    NEW.estado := OLD.estado;
    NEW.correo := OLD.correo;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER proteger_perfil BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.proteger_perfil();

-- Viviendas y dispositivos: lectura para usuarios activos, escritura admin
CREATE POLICY "leer viviendas" ON public.viviendas FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin viviendas" ON public.viviendas FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "leer dispositivos" ON public.dispositivos FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin dispositivos" ON public.dispositivos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Residentes
CREATE POLICY "admin residentes" ON public.residentes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "ver mi ficha" ON public.residentes FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "editar mi ficha" ON public.residentes FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE OR REPLACE FUNCTION public.proteger_residente()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') AND auth.uid() IS NOT NULL THEN
    NEW.estado := OLD.estado; NEW.vivienda_id := OLD.vivienda_id; NEW.correo := OLD.correo;
    NEW.user_id := OLD.user_id; NEW.documento := OLD.documento;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER proteger_residente BEFORE UPDATE ON public.residentes
  FOR EACH ROW EXECUTE FUNCTION public.proteger_residente();

-- Invitados
CREATE POLICY "admin invitados" ON public.invitados FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "ver mis invitados" ON public.invitados FOR SELECT TO authenticated
  USING (anfitrion_id = public.mi_residente_id());
CREATE POLICY "crear mis invitados" ON public.invitados FOR INSERT TO authenticated
  WITH CHECK (anfitrion_id = public.mi_residente_id() AND estado = 'Pendiente');
CREATE POLICY "revocar mis invitados" ON public.invitados FOR UPDATE TO authenticated
  USING (anfitrion_id = public.mi_residente_id())
  WITH CHECK (anfitrion_id = public.mi_residente_id() AND estado IN ('Pendiente','Revocado'));

-- Eventos
CREATE POLICY "admin eventos" ON public.eventos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "ver eventos de mi vivienda" ON public.eventos FOR SELECT TO authenticated
  USING (vivienda_id IS NOT NULL AND vivienda_id = public.mi_vivienda_id());

-- Biometría (solo estados)
CREATE POLICY "admin biometria" ON public.biometria FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "ver mi biometria" ON public.biometria FOR SELECT TO authenticated
  USING (residente_id = public.mi_residente_id());

-- Notificaciones
CREATE POLICY "admin notificaciones" ON public.notificaciones FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "ver mis notificaciones" ON public.notificaciones FOR SELECT TO authenticated
  USING (residente_id = public.mi_residente_id());
CREATE POLICY "leer mis notificaciones" ON public.notificaciones FOR UPDATE TO authenticated
  USING (residente_id = public.mi_residente_id()) WITH CHECK (residente_id = public.mi_residente_id());

-- Auditoría
CREATE POLICY "admin ve auditoria" ON public.auditoria FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "registrar auditoria" ON public.auditoria FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid());

-- Perfil automático al registrarse (siempre queda pendiente de aprobación)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, nombre, apellido, correo, telefono, documento, vivienda_solicitada)
  VALUES (
    NEW.id,
    coalesce(NEW.raw_user_meta_data->>'nombre', ''),
    coalesce(NEW.raw_user_meta_data->>'apellido', ''),
    lower(coalesce(NEW.email, '')),
    coalesce(NEW.raw_user_meta_data->>'telefono', ''),
    coalesce(NEW.raw_user_meta_data->>'documento', ''),
    coalesce(NEW.raw_user_meta_data->>'vivienda', '')
  );
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Aprobación de solicitudes por el administrador
CREATE OR REPLACE FUNCTION public.aprobar_usuario(_user_id uuid, _vivienda_id text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p public.profiles; rid text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Solo un administrador puede aprobar cuentas'; END IF;
  SELECT * INTO p FROM public.profiles WHERE id = _user_id;
  IF p.id IS NULL THEN RAISE EXCEPTION 'Solicitud no encontrada'; END IF;
  UPDATE public.profiles SET estado = 'Activo' WHERE id = _user_id;
  INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, 'residente') ON CONFLICT DO NOTHING;
  SELECT id INTO rid FROM public.residentes WHERE user_id = _user_id OR (user_id IS NULL AND lower(correo) = p.correo) LIMIT 1;
  IF rid IS NULL THEN
    INSERT INTO public.residentes (user_id, nombre, apellido, documento, correo, telefono, vivienda_id, estado)
    VALUES (_user_id, p.nombre, p.apellido, p.documento, p.correo, p.telefono, _vivienda_id, 'Activo') RETURNING id INTO rid;
  ELSE
    UPDATE public.residentes SET user_id = _user_id, vivienda_id = coalesce(_vivienda_id, vivienda_id), estado = 'Activo' WHERE id = rid;
  END IF;
  RETURN rid;
END $$;

CREATE OR REPLACE FUNCTION public.rechazar_usuario(_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Solo un administrador puede rechazar cuentas'; END IF;
  UPDATE public.profiles SET estado = 'Rechazado' WHERE id = _user_id;
END $$;

REVOKE EXECUTE ON FUNCTION public.aprobar_usuario(uuid, text), public.rechazar_usuario(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.aprobar_usuario(uuid, text), public.rechazar_usuario(uuid) TO authenticated;

-- Datos de demostración
INSERT INTO public.viviendas (id, codigo, torre, piso, estado, residente_principal) VALUES
 ('v1','A-101','A',1,'Ocupada','r1'),('v2','A-102','A',1,'Ocupada','r2'),('v3','A-201','A',2,'Ocupada','r3'),
 ('v4','A-202','A',2,'Disponible',NULL),('v5','B-101','B',1,'Ocupada','r4'),('v6','B-102','B',1,'Inactiva',NULL);

INSERT INTO public.residentes (id, nombre, apellido, documento, correo, telefono, vivienda_id, estado, fecha_registro) VALUES
 ('r1','Lucía','Herrera','45872103','residente@smartaccess.demo','+51 987 112 334','v1','Activo','2026-02-11'),
 ('r2','Marco','Delgado','40219876','marco.delgado@demo.test','+51 987 220 145','v2','Activo','2026-02-18'),
 ('r3','Ana','Ríos','47731260','ana.rios@demo.test','+51 981 554 902','v3','Activo','2026-03-02'),
 ('r4','Diego','Salas','42908311','diego.salas@demo.test','+51 999 331 087','v5','Inactivo','2026-01-27');

INSERT INTO public.invitados (id, nombre, apellido, documento, anfitrion_id, vivienda_id, inicio, fin, estado) VALUES
 ('i1','Javier','Paredes','70112233','r1','v1', now() - interval '1 day', now() + interval '30 days','Activo'),
 ('i2','Carmen','Vega','71993410','r1','v1', now() + interval '2 days', now() + interval '3 days','Pendiente'),
 ('i3','Renato','Quispe','72330198','r2','v2', now() - interval '10 days', now() - interval '8 days','Expirado'),
 ('i4','Patricia','Lam','70884512','r3','v3', now() - interval '3 days', now() + interval '4 days','Revocado');

INSERT INTO public.dispositivos (id, nombre, tipo, ubicacion, estado, ultima_conexion, identificador) VALUES
 ('d1','Puerta principal','Lector biométrico','Ingreso peatonal','Online','hace 2 min','ESP32-CAM-001'),
 ('d2','Garaje sur','Controlador de acceso','Estacionamiento nivel -1','Offline','hace 3 h','ESP32-CTRL-004'),
 ('d3','Acceso visitantes','Cámara','Lobby Torre A','Online','hace 1 min','ESP32-CAM-002'),
 ('d4','Cerradura Torre B','Cerradura/Relé','Ingreso Torre B','Mantenimiento','hace 1 día','RELE-B-011'),
 ('d5','Sensor azotea','Sensor','Azotea Torre A','Online','hace 6 min','SENS-A-207');

INSERT INTO public.eventos (id, fecha, hora, persona, vivienda_id, metodo, resultado, dispositivo_id, motivo, origen) VALUES
 ('e1', to_char(now(),'YYYY-MM-DD'),'09:42','Lucía Herrera','v1','Reconocimiento facial','Autorizado','d1','Coincidencia biométrica válida','Demo'),
 ('e2', to_char(now(),'YYYY-MM-DD'),'09:45','Javier Paredes (invitado)','v1','Invitado','Autorizado','d3','Permiso de invitado vigente','Demo'),
 ('e3', to_char(now(),'YYYY-MM-DD'),'09:51','Persona no reconocida',NULL,'Reconocimiento facial','Rechazado','d1','Sin coincidencia biométrica','Demo'),
 ('e4', to_char(now(),'YYYY-MM-DD'),'08:18','Ana Ríos','v3','Huella dactilar','Autorizado','d1','Coincidencia biométrica válida','Demo'),
 ('e5', to_char(now() - interval '1 day','YYYY-MM-DD'),'19:05','Marco Delgado','v2','Reconocimiento facial','Autorizado','d3','Coincidencia biométrica válida','Demo'),
 ('e6', to_char(now() - interval '1 day','YYYY-MM-DD'),'21:33','Renato Quispe (invitado)','v2','Invitado','Rechazado','d2','Permiso expirado','Demo'),
 ('e7', to_char(now() - interval '2 days','YYYY-MM-DD'),'07:12','Diego Salas','v5','Huella dactilar','Rechazado','d1','Residente inactivo','Demo'),
 ('e8', to_char(now() - interval '2 days','YYYY-MM-DD'),'12:48','María Castro',NULL,'Administrador','Autorizado','d4','Apertura manual autorizada','Demo'),
 ('e9', to_char(now() - interval '3 days','YYYY-MM-DD'),'17:26','Lucía Herrera','v1','Huella dactilar','Autorizado','d1','Coincidencia biométrica válida','Demo'),
 ('e10', to_char(now() - interval '4 days','YYYY-MM-DD'),'10:02','Carmen Vega (invitado)','v1','Invitado','Autorizado','d3','Permiso de invitado vigente','Demo');

INSERT INTO public.biometria (id, residente_id, tipo, estado, fecha_registro, fecha_actualizacion) VALUES
 ('b1','r1','Rostro','Registrada','2026-02-12','2026-08-04'),
 ('b2','r1','Huella','Registrada','2026-02-12','2026-02-12'),
 ('b3','r2','Rostro','Pendiente','2026-03-01','2026-03-01'),
 ('b4','r3','Huella','Registrada','2026-03-05','2026-07-19'),
 ('b5','r4','Rostro','No registrada','—','—');

INSERT INTO public.auditoria (id, fecha, actor, rol, accion, entidad, detalle) VALUES
 ('a0', now() - interval '1 day','Sistema','Sistema','Inicializó','Condominio','Carga de datos de demostración en la base de datos');
