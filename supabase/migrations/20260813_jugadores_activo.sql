-- Flag activo en jugadores (default true, admin puede desactivar)
alter table public.jugadores
  add column if not exists activo boolean not null default true;

-- Política para que admin pueda actualizar jugadores
drop policy if exists "jugadores_admin_update" on public.jugadores;
create policy "jugadores_admin_update" on public.jugadores
  for update using (public.is_admin()) with check (public.is_admin());
