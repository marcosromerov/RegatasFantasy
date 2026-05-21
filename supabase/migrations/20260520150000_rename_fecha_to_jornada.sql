-- F2.0.1 — Estandarizar el nombre del nº de fecha del torneo a `jornada`
-- en todas las tablas. Defensivo: si una columna ya fue renombrada manualmente,
-- el bloque correspondiente no hace nada.

-- rendimiento_jugador.fecha -> jornada
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'rendimiento_jugador'
      and column_name = 'fecha'
  ) then
    alter table public.rendimiento_jugador rename column fecha to jornada;
  end if;
end$$;

-- staff_partidos.fecha -> jornada
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'staff_partidos'
      and column_name = 'fecha'
  ) then
    alter table public.staff_partidos rename column fecha to jornada;
  end if;
end$$;

-- equipo_usuario.fecha -> jornada
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'equipo_usuario'
      and column_name = 'fecha'
  ) then
    alter table public.equipo_usuario rename column fecha to jornada;
  end if;
end$$;

-- Renombrar constraints también (cosmético, para que el nombre refleje la columna).
do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'rendimiento_jugador_jugador_fecha_unique'
      and conrelid = 'public.rendimiento_jugador'::regclass
  ) then
    alter table public.rendimiento_jugador
      rename constraint rendimiento_jugador_jugador_fecha_unique
                     to rendimiento_jugador_jugador_jornada_unique;
  end if;

  if exists (
    select 1 from pg_constraint
    where conname = 'equipo_usuario_user_fecha_unique'
      and conrelid = 'public.equipo_usuario'::regclass
  ) then
    alter table public.equipo_usuario
      rename constraint equipo_usuario_user_fecha_unique
                     to equipo_usuario_user_jornada_unique;
  end if;
end$$;
