-- ─── foto_url en jugadores ────────────────────────────────────────────────────
ALTER TABLE public.jugadores
  ADD COLUMN IF NOT EXISTS foto_url TEXT;

-- ─── Tabla MVPs por jornada ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.mvp_jornada (
  jornada                  INT PRIMARY KEY,
  -- Mejor forward
  forward_jugador_id       INT REFERENCES public.jugadores(id) ON DELETE SET NULL,
  forward_foto_url         TEXT,   -- foto cutout (opcional, overridea jugadores.foto_url)
  forward_apodo            TEXT,
  forward_peso_kg          INT,
  forward_altura_cm        INT,
  -- Mejor 3/4
  trescuartos_jugador_id   INT REFERENCES public.jugadores(id) ON DELETE SET NULL,
  trescuartos_foto_url     TEXT,
  trescuartos_apodo        TEXT,
  trescuartos_peso_kg      INT,
  trescuartos_altura_cm    INT,
  updated_at               TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.mvp_jornada ENABLE ROW LEVEL SECURITY;

CREATE POLICY "todos pueden leer mvp" ON public.mvp_jornada
  FOR SELECT USING (TRUE);

CREATE POLICY "admin puede escribir mvp" ON public.mvp_jornada
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid() AND "Role" = 'admin'
    )
  );

-- ─── Función: jugadores más elegidos de una jornada ──────────────────────────
CREATE OR REPLACE FUNCTION public.get_mas_elegidos(p_jornada INT, p_limit INT DEFAULT 3)
RETURNS TABLE(
  jugador_id   INT,
  nombre       TEXT,
  apellido     TEXT,
  posicion     TEXT,
  foto_url     TEXT,
  cantidad     BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH slots AS (
    SELECT jsonb_array_elements(eu.jugadores) AS slot
    FROM public.equipo_usuario eu
    WHERE eu.jornada = p_jornada
      AND eu.jugadores IS NOT NULL
      AND jsonb_typeof(eu.jugadores) = 'array'
  ),
  picks AS (
    SELECT (slot -> 'selectedPlayer' ->> 'id')::INT AS jug_id
    FROM slots
    WHERE slot ->> 'selected' = 'true'
      AND slot -> 'selectedPlayer' IS NOT NULL
      AND slot -> 'selectedPlayer' ->> 'id' IS NOT NULL
  ),
  counts AS (
    SELECT jug_id, COUNT(*) AS cnt
    FROM picks
    WHERE jug_id IS NOT NULL
    GROUP BY jug_id
  )
  SELECT j.id, j.nombre, j.apellido, j.posicion, j.foto_url, c.cnt
  FROM counts c
  JOIN public.jugadores j ON j.id = c.jug_id
  ORDER BY c.cnt DESC
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_mas_elegidos(INT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_mas_elegidos(INT, INT) TO anon;
