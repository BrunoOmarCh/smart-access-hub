ALTER TABLE public.invitados
  ADD COLUMN qr_token text NOT NULL DEFAULT gen_random_uuid()::text,
  ADD COLUMN qr_usado_at timestamptz;

CREATE UNIQUE INDEX invitados_qr_token_key ON public.invitados (qr_token);

CREATE OR REPLACE FUNCTION public.proteger_qr_invitado()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') AND auth.uid() IS NOT NULL THEN
    NEW.qr_token := OLD.qr_token;
    NEW.qr_usado_at := OLD.qr_usado_at;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER proteger_qr_invitado
  BEFORE UPDATE ON public.invitados
  FOR EACH ROW EXECUTE FUNCTION public.proteger_qr_invitado();

CREATE OR REPLACE FUNCTION public.consumir_pase(_token text, _dispositivo_id text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitado public.invitados%ROWTYPE;
  v_ahora timestamptz := now();
  v_autorizado boolean := false;
  v_motivo text;
  v_persona text := 'Pase QR no reconocido';
  v_vivienda_id text;
  v_evento_id text;
  v_fecha text;
  v_hora text;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Solo un administrador puede operar el kiosco';
  END IF;

  SELECT * INTO v_invitado
  FROM public.invitados
  WHERE qr_token = _token
  FOR UPDATE;

  IF NOT FOUND THEN
    v_motivo := 'Código QR inválido o alterado';
  ELSE
    v_persona := v_invitado.nombre || ' ' || v_invitado.apellido || ' (invitado)';
    v_vivienda_id := v_invitado.vivienda_id;

    IF v_invitado.qr_usado_at IS NOT NULL THEN
      v_motivo := 'Este pase ya fue usado';
    ELSIF v_invitado.estado <> 'Activo' THEN
      v_motivo := 'El pase no está activo';
    ELSIF v_ahora < v_invitado.inicio::timestamptz OR v_ahora > v_invitado.fin::timestamptz THEN
      v_motivo := 'Pase fuera de su horario de vigencia';
    ELSE
      v_autorizado := true;
      v_motivo := 'Pase vigente y de un solo uso';
      UPDATE public.invitados
      SET qr_usado_at = v_ahora
      WHERE id = v_invitado.id;
    END IF;
  END IF;

  v_fecha := to_char(v_ahora AT TIME ZONE 'UTC', 'YYYY-MM-DD');
  v_hora := to_char(v_ahora AT TIME ZONE 'UTC', 'HH24:MI');

  INSERT INTO public.eventos (
    fecha, hora, persona, vivienda_id, metodo, resultado, dispositivo_id, motivo, origen
  )
  VALUES (
    v_fecha, v_hora, v_persona, v_vivienda_id, 'Invitado',
    CASE WHEN v_autorizado THEN 'Autorizado' ELSE 'Rechazado' END,
    _dispositivo_id, v_motivo, 'Kiosco'
  )
  RETURNING id INTO v_evento_id;

  RETURN jsonb_build_object(
    'autorizado', v_autorizado,
    'persona', v_persona,
    'vivienda_id', v_vivienda_id,
    'motivo', v_motivo,
    'evento_id', v_evento_id,
    'fecha', v_fecha,
    'hora', v_hora,
    'invitado_id', CASE WHEN v_invitado.id IS NULL THEN NULL ELSE v_invitado.id END,
    'qr_usado_at', CASE WHEN v_autorizado THEN v_ahora ELSE v_invitado.qr_usado_at END
  );
END;
$$;

REVOKE ALL ON FUNCTION public.consumir_pase(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.consumir_pase(text, text) TO authenticated;
