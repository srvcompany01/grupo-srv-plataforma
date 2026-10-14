-- Lista é só uma lista: o cliente deixa de ser obrigatório na lista e na tarefa.
-- A tag de cliente continua existindo por tarefa (opcional). Tarefa nova herda o cliente da lista, se a lista tiver um.

alter table public.lists alter column client_id drop not null;
alter table public.tasks alter column client_id drop not null;

-- Trocar o cliente padrão da lista move as tarefas que seguiam o antigo, inclusive as que não tinham cliente.
create or replace function public.sincronizar_cliente_da_lista() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  update tasks
  set client_id = new.client_id
  where list_id = new.id
    and client_id is not distinct from old.client_id;
  return null;
end $$;

-- Duplica a estrutura de uma lista (nome, visual, mês, status e campos). As tarefas NÃO são copiadas.
-- security invoker: vale a RLS de quem chama. A cópia entra logo depois da original.
create function public.duplicar_lista(p_list uuid) returns uuid
language plpgsql security invoker set search_path = public
as $$
declare
  origem lists%rowtype;
  nova uuid;
  padrao uuid[];
begin
  select * into origem from lists where id = p_list and archived_at is null;
  if not found then raise exception 'Lista não encontrada'; end if;

  insert into lists (space_id, folder_id, client_id, name, reference_month, color, icon, emoji, kind, position)
  values (origem.space_id, origem.folder_id, origem.client_id, origem.name || ' (cópia)', origem.reference_month,
          origem.color, origem.icon, origem.emoji, origem.kind, origem.position || 'V')
  returning id into nova;

  -- O gatilho já criou os 3 status padrão; troca pelos da original (copia primeiro, apaga depois).
  select array_agg(id) into padrao from list_statuses where list_id = nova;
  insert into list_statuses (list_id, name, color, category, approval_state, position)
    select nova, name, color, category, approval_state, position from list_statuses where list_id = p_list;
  delete from list_statuses where id = any (padrao);

  insert into list_custom_fields (list_id, field_id, position)
    select nova, field_id, position from list_custom_fields where list_id = p_list;
  return nova;
end $$;
revoke execute on function public.duplicar_lista(uuid) from public, anon;
grant execute on function public.duplicar_lista(uuid) to authenticated, service_role;
