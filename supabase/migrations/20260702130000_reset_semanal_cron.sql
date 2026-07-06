-- F5.4 — Reset automático de equipos los martes a primera hora
--
-- Los equipos son POR JORNADA. Cada martes ~06:00 (hora Argentina) se borran
-- todos los equipos del finde, así el miércoles cada usuario arranca de cero
-- para la fecha siguiente.
--
-- ⚠️ IMPORTANTE: esto NO calcula puntos. El admin DEBE haber subido el CSV de
--    puntajes (sáb–lun) ANTES del martes, o esa jornada se pierde.
--
-- ⚠️ REQUISITO: la extensión pg_cron tiene que estar habilitada en Supabase
--    (Dashboard → Database → Extensions → pg_cron). Si `create extension` falla
--    por permisos, activala desde ahí y volvé a correr solo el `cron.schedule`.

create extension if not exists pg_cron;

-- Cron corre en UTC. Martes = day-of-week 2.
-- 06:00 ART (UTC-3) = 09:00 UTC  →  '0 9 * * 2'
-- Si ya existe un job con este nombre, lo re-agenda (unschedule + schedule).
do $$
begin
  perform cron.unschedule('reset-equipos-martes');
exception when others then
  -- no existía; seguimos
  null;
end$$;

select cron.schedule(
  'reset-equipos-martes',
  '0 9 * * 2',
  $$ delete from public.equipo_usuario $$
);
