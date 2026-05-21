-- F2.0 — UNIQUE (jugador_id, fecha) en rendimiento_jugador
-- Necesario para que el upsert del panel admin (CSV) actualice
-- la fila existente en vez de duplicar.

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'rendimiento_jugador_jugador_fecha_unique'
      and conrelid = 'public.rendimiento_jugador'::regclass
  ) then
    alter table public.rendimiento_jugador
      add constraint rendimiento_jugador_jugador_fecha_unique
        unique (jugador_id, fecha);
  end if;
end$$;
