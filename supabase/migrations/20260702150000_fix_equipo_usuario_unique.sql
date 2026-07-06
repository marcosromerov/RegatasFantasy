-- Fix — el modelo de equipo es POR JORNADA, pero quedaba una restricción legacy
-- `unique_user_id` sobre equipo_usuario(user_id) SOLO. Eso obligaba a 1 equipo por
-- usuario y rompía el upsert onConflict (user_id, jornada) con error 23505.

-- 1) Limpiamos filas viejas sin jornada (guardadas con el modelo anterior, ya no sirven).
delete from public.equipo_usuario where jornada is null;

-- 2) Sacamos la unique legacy sobre user_id solo.
alter table public.equipo_usuario drop constraint if exists unique_user_id;

-- 3) Aseguramos la unique compuesta (user_id, jornada) que sí corresponde al modelo.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'equipo_usuario_user_jornada_unique'
      and conrelid = 'public.equipo_usuario'::regclass
  ) then
    alter table public.equipo_usuario
      add constraint equipo_usuario_user_jornada_unique unique (user_id, jornada);
  end if;
end$$;
