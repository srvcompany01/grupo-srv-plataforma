-- A tag de cliente passa a ser da TAREFA (e da sua árvore de subtarefas), não mais da lista inteira.
-- Antes, o gatilho preparar_tarefa forçava tasks.client_id = lists.client_id em todo insert/update, então duas
-- tarefas mãe de clientes diferentes na mesma lista eram impossíveis. lists.client_id vira o cliente PADRÃO
-- para tarefas novas. Não há dado a migrar: hoje toda tarefa já tem o cliente da sua lista.

create or replace function public.preparar_tarefa() returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  categoria_nova text;
  categoria_antiga text;
begin
  if new.parent_task_id is not null then
    if tg_op = 'UPDATE' and new.parent_task_id is distinct from old.parent_task_id and exists (
      with recursive acima as (
        select id, parent_task_id from tasks where id = new.parent_task_id
        union all
        select t.id, t.parent_task_id from tasks t join acima on t.id = acima.parent_task_id
      )
      select 1 from acima where id = new.id
    ) then
      raise exception 'Subtarefa não pode conter a tarefa mãe';
    end if;
    select list_id into strict new.list_id from tasks where id = new.parent_task_id;
  end if;

  if tg_op = 'UPDATE' and auth.uid() is not null then
    if new.parent_task_id is distinct from old.parent_task_id and new.parent_task_id is not null
       and not can_read_task(new.parent_task_id) then
      raise exception 'Você não tem acesso à tarefa mãe escolhida';
    end if;
    if new.list_id is distinct from old.list_id and not can_access_space_target(list_space(new.list_id)) then
      raise exception 'Você não tem acesso à lista de destino';
    end if;
  end if;

  -- Tag de cliente é da tarefa: subtarefa nasce com a da mãe; tarefa raiz nasce com a informada ou a da lista.
  -- Mudar de lista adota o cliente da lista de destino; fora isso, a tag escolhida na tarefa é preservada.
  if tg_op = 'INSERT' then
    if new.parent_task_id is not null then
      select client_id into strict new.client_id from tasks where id = new.parent_task_id;
    elsif new.client_id is null then
      select client_id into strict new.client_id from lists where id = new.list_id;
    end if;
  elsif new.list_id is distinct from old.list_id then
    select client_id into strict new.client_id from lists where id = new.list_id;
  end if;
  if new.status_id is null then
    new.status_id := primeiro_status_a_fazer(new.list_id);
  elsif not exists (select 1 from list_statuses where id = new.status_id and list_id = new.list_id) then
    if tg_op = 'UPDATE' and new.list_id <> old.list_id then
      new.status_id := primeiro_status_a_fazer(new.list_id);
    else
      raise exception 'Status não pertence à lista';
    end if;
  end if;

  select category into categoria_nova from list_statuses where id = new.status_id;
  if tg_op = 'UPDATE' then
    select category into categoria_antiga from list_statuses where id = old.status_id;
  end if;
  if categoria_nova = 'done' and categoria_antiga is distinct from 'done' then
    new.completed_at := now();
  elsif categoria_nova <> 'done' then
    new.completed_at := null;
  end if;

  if tg_op = 'UPDATE' then
    if new.archived_at is distinct from old.archived_at and auth.uid() is not null
       and not can_manage_list(new.list_id) then
      raise exception 'Só gestores arquivam tarefas';
    end if;
    new.updated_at := now();
  end if;
  return new;
end $$;

-- Trocar o cliente padrão da lista só move as tarefas que ainda seguiam o cliente antigo.
-- Tarefas com tag própria (diferente do padrão anterior) são preservadas.
create or replace function public.sincronizar_cliente_da_lista() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  update tasks
  set client_id = new.client_id
  where list_id = new.id
    and client_id = old.client_id;
  return null;
end $$;
