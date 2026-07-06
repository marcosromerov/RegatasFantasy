-- F6 — Potenciadores en la sumatoria
--
-- El usuario elige hasta 2 potenciadores (además del capitán/pateador que apuntan
-- a un jugador puntual). Se guardan en equipo_usuario.potenciadores (jsonb):
--   { "activos": ["cap","forward_p"], "capitan_id": 123, "pateador_id": 456 }
--
-- Efectos (bonus que se SUMA al puntaje base de la jornada):
--   cap        (Capitán)            → el jugador elegido cuenta x2   (bonus = +1x sus puntos)
--   kick_k     (Pateador de fecha)  → el jugador elegido cuenta x2   (bonus = +1x sus puntos)
--   forward_p  (Pack Potenciador)   → el MEJOR forward (1-8) x1.5     (bonus = +0.5x)
--   back_a     (Línea Potenciadora) → el MEJOR back (9-15) x1.5       (bonus = +0.5x)

-- =========================================================
-- F6.1 — Columna potenciadores
-- =========================================================
alter table public.equipo_usuario
  add column if not exists potenciadores jsonb;

-- =========================================================
-- F6.2 — recalcular_jornada con potenciadores
-- =========================================================
create or replace function public.recalcular_jornada(p_jornada integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Solo un admin puede recalcular jornadas.';
  end if;

  insert into public.puntos_usuario_jornada (user_id, jornada, puntos)
  select
    eu.user_id,
    p_jornada,
    round(
      -- base: suma simple de los 15
      coalesce(sum(t.puntos), 0)
      -- Capitán x2 → suma otra vez los puntos del capitán
      + case when eu.potenciadores->'activos' ? 'cap'
             then coalesce(sum(t.puntos) filter (where t.jugador_id = (eu.potenciadores->>'capitan_id')::bigint), 0)
             else 0 end
      -- Pateador x2 → suma otra vez los puntos del pateador
      + case when eu.potenciadores->'activos' ? 'kick_k'
             then coalesce(sum(t.puntos) filter (where t.jugador_id = (eu.potenciadores->>'pateador_id')::bigint), 0)
             else 0 end
      -- Pack x1.5 → +50% del mejor forward (posiciones 1-8)
      + case when eu.potenciadores->'activos' ? 'forward_p'
             then 0.5 * coalesce(max(t.puntos) filter (where t.posicion_id between 1 and 8), 0)
             else 0 end
      -- Línea x1.5 → +50% del mejor back (posiciones 9-15)
      + case when eu.potenciadores->'activos' ? 'back_a'
             then 0.5 * coalesce(max(t.puntos) filter (where t.posicion_id between 9 and 15), 0)
             else 0 end
    )::int as puntos
  from public.equipo_usuario eu
  cross join lateral (
    select
      (elem->>'jugador_id')::bigint as jugador_id,
      (elem->>'posicion_id')::int   as posicion_id,
      rj.puntos                     as puntos
    from jsonb_array_elements(eu.jugadores::jsonb) as elem
    join public.rendimiento_jugador rj
      on rj.jugador_id = (elem->>'jugador_id')::bigint
     and rj.jornada = p_jornada
  ) t
  where eu.jornada = p_jornada
  group by eu.id
  on conflict (user_id, jornada)
  do update set puntos = excluded.puntos, creado_at = now();

  update public.usuarios u
  set puntos = coalesce((
    select sum(puj.puntos)
    from public.puntos_usuario_jornada puj
    where puj.user_id = u.id
  ), 0);
end;
$$;
