-- F2.2-RLS — políticas para que admin pueda cargar CSVs desde la app.
-- También: default en rendimiento_jugador.creado_at para que el insert no falle.

alter table public.rendimiento_jugador
  alter column creado_at set default now();

--
-- Lógica: un usuario es admin si en `usuarios` su columna "Role" = 'admin'.
-- Esta función se usa en todas las policies para no repetir el subquery.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.usuarios
    where id = auth.uid()
      and "Role" = 'admin'
  );
$$;

-- =========================================================
-- rendimiento_jugador
-- =========================================================
alter table public.rendimiento_jugador enable row level security;

drop policy if exists "rendimiento_select_all" on public.rendimiento_jugador;
create policy "rendimiento_select_all"
  on public.rendimiento_jugador
  for select
  using (true);

drop policy if exists "rendimiento_admin_insert" on public.rendimiento_jugador;
create policy "rendimiento_admin_insert"
  on public.rendimiento_jugador
  for insert
  with check (public.is_admin());

drop policy if exists "rendimiento_admin_update" on public.rendimiento_jugador;
create policy "rendimiento_admin_update"
  on public.rendimiento_jugador
  for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "rendimiento_admin_delete" on public.rendimiento_jugador;
create policy "rendimiento_admin_delete"
  on public.rendimiento_jugador
  for delete
  using (public.is_admin());

-- =========================================================
-- staff_partidos
-- =========================================================
-- (RLS ya estaba habilitado, y el SELECT policy ya existe; agregamos write.)

drop policy if exists "staff_partidos_admin_insert" on public.staff_partidos;
create policy "staff_partidos_admin_insert"
  on public.staff_partidos
  for insert
  with check (public.is_admin());

drop policy if exists "staff_partidos_admin_update" on public.staff_partidos;
create policy "staff_partidos_admin_update"
  on public.staff_partidos
  for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "staff_partidos_admin_delete" on public.staff_partidos;
create policy "staff_partidos_admin_delete"
  on public.staff_partidos
  for delete
  using (public.is_admin());
