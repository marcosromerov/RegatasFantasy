-- F5 — Motor de puntos (sumatoria por jornada) + RLS en equipo_usuario
--
-- Flujo:
--  1) El admin sube el CSV de puntajes → upsert en rendimiento_jugador (ya existía).
--  2) La app llama recalcular_jornada(j) → suma los 15 jugadores de cada usuario
--     para esa jornada y actualiza usuarios.puntos.
--
-- Suma SIMPLE (sin potenciadores por ahora).

-- =========================================================
-- F5.1 — Tabla de puntos por usuario y jornada (histórico + idempotencia)
-- =========================================================
-- usuarios.puntos pasa a ser la SUMA de esta tabla. Guardar por jornada permite
-- recalcular sin duplicar si el admin corrige el CSV y lo vuelve a subir.
create table if not exists public.puntos_usuario_jornada (
  id         bigserial primary key,
  user_id    uuid not null references public.usuarios(id) on delete cascade,
  jornada    integer not null,
  puntos     integer not null default 0,
  creado_at  timestamptz not null default now(),
  unique (user_id, jornada)
);

alter table public.puntos_usuario_jornada enable row level security;

-- Lectura pública (para armar rankings/históricos por jornada más adelante).
drop policy if exists "puj_select_all" on public.puntos_usuario_jornada;
create policy "puj_select_all"
  on public.puntos_usuario_jornada
  for select
  using (true);

-- Escritura: solo admin (aunque la función es SECURITY DEFINER, dejamos la policy
-- por si algún día se escribe directo).
drop policy if exists "puj_admin_write" on public.puntos_usuario_jornada;
create policy "puj_admin_write"
  on public.puntos_usuario_jornada
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- =========================================================
-- F5.2 — Función que recalcula una jornada
-- =========================================================
-- Para cada usuario con equipo en la jornada j:
--   puntos_jornada = Σ rendimiento_jugador.puntos de los jugador_id de su equipo.
-- Después refresca usuarios.puntos = Σ de todas sus jornadas.
--
-- SECURITY DEFINER: corre con permisos del owner (saltea RLS), pero validamos
-- que quien la llama sea admin.
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

  -- 1) Puntos por usuario para esta jornada.
  insert into public.puntos_usuario_jornada (user_id, jornada, puntos)
  select
    eu.user_id,
    p_jornada,
    coalesce(sum(rj.puntos), 0) as puntos
  from public.equipo_usuario eu
  cross join lateral jsonb_array_elements(eu.jugadores::jsonb) as elem
  join public.rendimiento_jugador rj
    on rj.jugador_id = (elem->>'jugador_id')::bigint
   and rj.jornada    = p_jornada
  where eu.jornada = p_jornada
  group by eu.user_id
  on conflict (user_id, jornada)
  do update set puntos = excluded.puntos, creado_at = now();

  -- 2) Refrescar el acumulado de TODOS los usuarios.
  update public.usuarios u
  set puntos = coalesce((
    select sum(puj.puntos)
    from public.puntos_usuario_jornada puj
    where puj.user_id = u.id
  ), 0);
end;
$$;

-- Permitir que los usuarios autenticados (admins, validado adentro) la ejecuten.
grant execute on function public.recalcular_jornada(integer) to authenticated;

-- =========================================================
-- F5.3 — RLS en equipo_usuario (cada uno maneja SU equipo)
-- =========================================================
-- Antes estaba UNRESTRICTED: cualquiera con la anon key podía leer/editar
-- el equipo de cualquier otro. Lo cerramos.
alter table public.equipo_usuario enable row level security;

drop policy if exists "equipo_select_own" on public.equipo_usuario;
create policy "equipo_select_own"
  on public.equipo_usuario
  for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "equipo_insert_own" on public.equipo_usuario;
create policy "equipo_insert_own"
  on public.equipo_usuario
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "equipo_update_own" on public.equipo_usuario;
create policy "equipo_update_own"
  on public.equipo_usuario
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "equipo_delete_own" on public.equipo_usuario;
create policy "equipo_delete_own"
  on public.equipo_usuario
  for delete
  using (auth.uid() = user_id or public.is_admin());
