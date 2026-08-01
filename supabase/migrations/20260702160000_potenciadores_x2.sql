-- F6.3 — Todos los potenciadores multiplican x2
--
-- Antes: Pack y Línea eran x1.5 (+50%). Ahora los 4 son x2 (+100% = se suman de nuevo
-- los puntos del jugador objetivo). Capitán/Pateador apuntan a un jugador elegido;
-- Pack/Línea al MEJOR forward / MEJOR back del equipo en esa jornada.

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
      -- Pack x2 → suma otra vez el mejor forward (posiciones 1-8)
      + case when eu.potenciadores->'activos' ? 'forward_p'
             then coalesce(max(t.puntos) filter (where t.posicion_id between 1 and 8), 0)
             else 0 end
      -- Línea x2 → suma otra vez el mejor back (posiciones 9-15)
      + case when eu.potenciadores->'activos' ? 'back_a'
             then coalesce(max(t.puntos) filter (where t.posicion_id between 9 and 15), 0)
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
