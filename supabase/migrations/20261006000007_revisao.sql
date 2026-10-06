-- Correções da revisão final da Fase 1a.

-- ============================================================ 1. mover tarefa exige acesso ao destino
create or replace function public.preparar_tarefa() returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  categoria_nova text;
  categoria_antiga text;
begin
  -- 1. Subtarefa: mesma lista da mãe, sem ciclos.
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

  -- 1b. Ao mudar de lista ou de mãe, quem altera precisa ter acesso ao destino
  -- (ser responsável dá direito a editar a tarefa, não a levá-la para outro departamento/cliente).
  if tg_op = 'UPDATE' and auth.uid() is not null then
    if new.parent_task_id is distinct from old.parent_task_id and new.parent_task_id is not null
       and not can_read_task(new.parent_task_id) then
      raise exception 'Você não tem acesso à tarefa mãe escolhida';
    end if;
    if new.list_id is distinct from old.list_id and not is_space_member(list_space(new.list_id)) then
      raise exception 'Você não tem acesso à lista de destino';
    end if;
  end if;

  -- 2. Cliente sempre o da lista.
  select client_id into strict new.client_id from lists where id = new.list_id;

  -- 3. Status da própria lista.
  if new.status_id is null then
    new.status_id := primeiro_status_a_fazer(new.list_id);
  elsif not exists (select 1 from list_statuses where id = new.status_id and list_id = new.list_id) then
    if tg_op = 'UPDATE' and new.list_id <> old.list_id then
      new.status_id := primeiro_status_a_fazer(new.list_id);
    else
      raise exception 'Status não pertence à lista';
    end if;
  end if;

  -- 4. Data de conclusão acompanha a categoria "concluído".
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
       and not is_space_manager(list_space(new.list_id)) then
      raise exception 'Só gestores arquivam tarefas';
    end if;
    new.updated_at := now();
  end if;
  return new;
end $$;


-- ============================================================ 2. arquivamento em cascata

create function public.arquivar_subtarefas() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  update tasks set archived_at = new.archived_at where parent_task_id = new.id and archived_at is null;
  return null;
end $$;

create trigger arquivar_subtarefas after update of archived_at on public.tasks
for each row when (new.archived_at is not null and old.archived_at is null)
execute function public.arquivar_subtarefas();

create function public.arquivar_listas_da_pasta() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  update lists set archived_at = new.archived_at where folder_id = new.id and archived_at is null;
  return null;
end $$;

create trigger arquivar_listas_da_pasta after update of archived_at on public.folders
for each row when (new.archived_at is not null and old.archived_at is null)
execute function public.arquivar_listas_da_pasta();

create function public.arquivar_conteudo_do_espaco() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  update spaces set archived_at = new.archived_at where parent_id = new.id and archived_at is null;
  update folders set archived_at = new.archived_at where space_id = new.id and archived_at is null;
  update lists set archived_at = new.archived_at where space_id = new.id and archived_at is null;
  return null;
end $$;

create trigger arquivar_conteudo_do_espaco after update of archived_at on public.spaces
for each row when (new.archived_at is not null and old.archived_at is null)
execute function public.arquivar_conteudo_do_espaco();

-- Desarquivar também exige ao menos um responsável.
create constraint trigger checar_responsaveis_desarquivar after update of archived_at on public.tasks
deferrable initially deferred for each row
when (new.archived_at is null and old.archived_at is not null)
execute function public.checar_responsaveis();

-- ============================================================ 3. visitante não executa funções

revoke execute on all functions in schema public from public, anon;
grant execute on all functions in schema public to authenticated, service_role;
alter default privileges in schema public revoke execute on functions from public, anon;
alter default privileges revoke execute on functions from public;
