-- Fase 0 — Migraciones iniciales
-- F0.1: tabla staff_partidos
-- F0.2: histórico por fecha en equipo_usuario
-- F0.3: drop tabla ranking (vacía, no se usa)

-- =========================================================
-- F0.1 — staff_partidos
-- =========================================================
create table if not exists public.staff_partidos (
  id           bigserial primary key,
  staff_id     bigint not null references public."Staff"(id) on delete cascade,
  fecha        integer not null,
  resultado_p1 char(1) not null check (resultado_p1 in ('G','E','P')),
  resultado_p2 char(1) not null check (resultado_p2 in ('G','E','P')),
  created_at   timestamptz not null default now(),
  unique (staff_id, fecha)
);

alter table public.staff_partidos enable row level security;

drop policy if exists "staff_partidos_select_all" on public.staff_partidos;
create policy "staff_partidos_select_all"
  on public.staff_partidos
  for select
  using (true);

-- =========================================================
-- F0.2 — equipo_usuario: histórico por fecha + staff
-- =========================================================
alter table public.equipo_usuario
  add column if not exists fecha    integer,
  add column if not exists staff_id bigint references public."Staff"(id);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'equipo_usuario_user_fecha_unique'
      and conrelid = 'public.equipo_usuario'::regclass
  ) then
    alter table public.equipo_usuario
      add constraint equipo_usuario_user_fecha_unique unique (user_id, fecha);
  end if;
end$$;

-- =========================================================
-- F0.3 — drop ranking (vacía)
-- =========================================================
drop table if exists public.ranking;
