INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  confirmation_token,
  email_confirmed_at,
  recovery_token,
  email_change_token_new,
  email_change,
  email_change_token_current,
  phone,
  phone_change_token,
  reauthentication_token,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
VALUES
  (
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'admin@smartaccess.demo',
    crypt('demo1234', gen_salt('bf')),
    '',
    now(),
    '',
    '',
    '',
    '',
    NULL,
    '',
    '',
    '{"provider":"email","providers":["email"]}',
    '{"nombre":"Administración","apellido":"SmartAccess","telefono":"","documento":"","vivienda":""}',
    now(),
    now()
  ),
  (
    '00000000-0000-4000-8000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'residente@smartaccess.demo',
    crypt('demo1234', gen_salt('bf')),
    '',
    now(),
    '',
    '',
    '',
    '',
    NULL,
    '',
    '',
    '{"provider":"email","providers":["email"]}',
    '{"nombre":"Lucía","apellido":"Herrera","telefono":"+51 987 112 334","documento":"45872103","vivienda":"A-101"}',
    now(),
    now()
  )
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  encrypted_password = EXCLUDED.encrypted_password,
  confirmation_token = '',
  email_confirmed_at = now(),
  recovery_token = '',
  email_change_token_new = '',
  email_change = '',
  email_change_token_current = '',
  phone = NULL,
  phone_change_token = '',
  reauthentication_token = '',
  raw_app_meta_data = EXCLUDED.raw_app_meta_data,
  raw_user_meta_data = EXCLUDED.raw_user_meta_data,
  updated_at = now();

INSERT INTO auth.identities (
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
SELECT
  id::text,
  id,
  jsonb_build_object('sub', id::text, 'email', email, 'email_verified', true),
  'email',
  now(),
  now(),
  now()
FROM auth.users
WHERE email IN ('admin@smartaccess.demo', 'residente@smartaccess.demo')
ON CONFLICT (provider_id, provider) DO UPDATE SET
  identity_data = EXCLUDED.identity_data,
  updated_at = now();

INSERT INTO public.profiles (id, nombre, apellido, correo, telefono, documento, vivienda_solicitada, estado)
VALUES
  ('00000000-0000-4000-8000-000000000001', 'Administración', 'SmartAccess', 'admin@smartaccess.demo', '', '', '', 'Activo'),
  ('00000000-0000-4000-8000-000000000002', 'Lucía', 'Herrera', 'residente@smartaccess.demo', '+51 987 112 334', '45872103', 'A-101', 'Activo')
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  apellido = EXCLUDED.apellido,
  correo = EXCLUDED.correo,
  telefono = EXCLUDED.telefono,
  documento = EXCLUDED.documento,
  vivienda_solicitada = EXCLUDED.vivienda_solicitada,
  estado = EXCLUDED.estado;

INSERT INTO public.user_roles (user_id, role)
VALUES
  ('00000000-0000-4000-8000-000000000001', 'admin'),
  ('00000000-0000-4000-8000-000000000002', 'residente')
ON CONFLICT (user_id, role) DO NOTHING;

UPDATE public.residentes
SET user_id = '00000000-0000-4000-8000-000000000002'
WHERE lower(correo) = 'residente@smartaccess.demo';
