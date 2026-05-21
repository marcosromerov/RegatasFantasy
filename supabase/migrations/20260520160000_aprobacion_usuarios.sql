-- F4.1.1 — Aprobación manual de usuarios nuevos
--
-- Flujo: register inserta con aprobado=false (default).
-- Admin aprueba desde la app, lo que setea aprobado=true.
-- Login bloquea acceso si aprobado=false.

-- 1) Columna nueva
alter table public.usuarios
  add column if not exists aprobado boolean not null default false;

-- 2) Los usuarios que ya existían (antes de este sistema) los marco como aprobados
--    para que no queden trabados.
update public.usuarios set aprobado = true where aprobado = false;

-- 3) Policies de RLS para que admin pueda aprobar/rechazar desde la app.
--    Si RLS está OFF en usuarios, estas policies son inertes (no rompen nada).
--    Si está ON, habilitan las operaciones de admin.

drop policy if exists "usuarios_admin_update" on public.usuarios;
create policy "usuarios_admin_update"
  on public.usuarios
  for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "usuarios_admin_delete" on public.usuarios;
create policy "usuarios_admin_delete"
  on public.usuarios
  for delete
  using (public.is_admin());
