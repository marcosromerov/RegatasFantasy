-- Grupo de nivel por jugador (1 = mayor nivel, 4 = menor)
alter table public.jugadores
  add column if not exists grupo integer check (grupo between 1 and 4);

-- RPC para carga masiva desde admin (bypasea RLS, solo admin puede llamarla)
create or replace function public.set_grupos(p_rows jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r jsonb;
begin
  if not public.is_admin() then
    raise exception 'Solo admin puede asignar grupos.';
  end if;
  for r in select * from jsonb_array_elements(p_rows)
  loop
    update public.jugadores
    set grupo = (r->>'grupo')::int
    where id   = (r->>'jugador_id')::int;
  end loop;
end;
$$;
