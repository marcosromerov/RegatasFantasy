-- Fix — pg-safeupdate bloquea UPDATE sin WHERE (error 21000).
-- La función recalcular_jornada terminaba con "update usuarios set puntos=..." sin WHERE.
-- Le agregamos "where u.id is not null" (siempre verdadero → actualiza a todos, pero pasa el guard).

create or replace function public.recalcular_jornada(p_jornada integer)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Solo un admin puede recalcular jornadas.';
  end if;

  insert into public.puntos_usuario_jornada (user_id, jornada, puntos)
  select
    eu.user_id, p_jornada,
    round(
      coalesce(sum(t.puntos), 0)
      + case when eu.potenciadores->'activos' ? 'cap'
             then coalesce(sum(t.puntos) filter (where t.jugador_id = (eu.potenciadores->>'capitan_id')::bigint), 0) else 0 end
      + case when eu.potenciadores->'activos' ? 'kick_k'
             then coalesce(sum(t.puntos) filter (where t.jugador_id = (eu.potenciadores->>'pateador_id')::bigint), 0) else 0 end
      + case when eu.potenciadores->'activos' ? 'forward_p'
             then coalesce(max(t.puntos) filter (where t.posicion_id between 1 and 8), 0) else 0 end
      + case when eu.potenciadores->'activos' ? 'back_a'
             then coalesce(max(t.puntos) filter (where t.posicion_id between 9 and 15), 0) else 0 end
    )::int
  from public.equipo_usuario eu
  cross join lateral (
    select (elem->>'jugador_id')::bigint as jugador_id, (elem->>'posicion_id')::int as posicion_id, rj.puntos as puntos
    from jsonb_array_elements(eu.jugadores::jsonb) as elem
    join public.rendimiento_jugador rj
      on rj.jugador_id = (elem->>'jugador_id')::bigint and rj.jornada = p_jornada
  ) t
  where eu.jornada = p_jornada
  group by eu.id
  on conflict (user_id, jornada) do update set puntos = excluded.puntos, creado_at = now();

  update public.usuarios u
  set puntos = coalesce((
    select sum(puj.puntos) from public.puntos_usuario_jornada puj where puj.user_id = u.id
  ), 0)
  where u.id is not null;
end;
$$;
