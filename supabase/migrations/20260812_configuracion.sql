create table if not exists public.configuracion (
  clave      text primary key,
  valor      text not null,
  updated_at timestamptz default now()
);

alter table public.configuracion enable row level security;

create policy "config_select_all" on public.configuracion
  for select using (true);

create policy "config_admin_write" on public.configuracion
  for all using (public.is_admin()) with check (public.is_admin());

insert into public.configuracion (clave, valor)
values ('edicion_bloqueada', 'false')
on conflict (clave) do nothing;
