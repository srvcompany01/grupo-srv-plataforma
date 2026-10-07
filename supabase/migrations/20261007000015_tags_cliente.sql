-- Cada cliente funciona como uma tag obrigatoria da lista/tarefas.
alter table public.clients
  add column color text not null default '#64748b';

alter table public.clients
  add constraint clients_color_hex check (color ~ '^#[0-9A-Fa-f]{6}$');

-- Distribui cores iniciais para os clientes ja existentes.
with ordenados as (
  select id, row_number() over (order by is_internal desc, name, id) as ordem
  from public.clients
), paleta as (
  select array[
    '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#10b981',
    '#06b6d4', '#6366f1', '#ef4444', '#f59e0b', '#84cc16', '#a855f7'
  ]::text[] as cores
)
update public.clients c
set color = p.cores[1 + ((o.ordem - 1) % array_length(p.cores, 1))]
from ordenados o cross join paleta p
where c.id = o.id;

-- A tag e obrigatoria porque lists.client_id e tasks.client_id continuam NOT NULL.
-- Trocar a tag da lista atualiza todas as tarefas, inclusive toda a arvore de subtarefas.
drop trigger if exists proteger_cliente_da_lista on public.lists;
drop function if exists public.proteger_cliente_da_lista();

create function public.sincronizar_cliente_da_lista() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  update tasks
  set client_id = new.client_id
  where list_id = new.id
    and client_id is distinct from new.client_id;
  return null;
end $$;

create trigger sincronizar_cliente_da_lista
after update of client_id on public.lists
for each row when (new.client_id is distinct from old.client_id)
execute function public.sincronizar_cliente_da_lista();
