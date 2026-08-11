-- Función pública para obtener los top 5 equipos de una jornada.
-- SECURITY DEFINER para bypassear RLS de equipo_usuario (solo lectura, no escribe nada).
create or replace function public.get_top5_jornada(p_jornada integer)
returns table(
  user_id  uuid,
  nombre   text,
  apellido text,
  puntos   integer,
  jugadores json
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    puj.user_id,
    u.nombre,
    u.apellido,
    puj.puntos,
    eu.jugadores
  from public.puntos_usuario_jornada puj
  join public.usuarios u on u.id = puj.user_id
  join public.equipo_usuario eu
    on eu.user_id = puj.user_id and eu.jornada = p_jornada
  where puj.jornada = p_jornada
  order by puj.puntos desc
  limit 5;
end;
$$;
