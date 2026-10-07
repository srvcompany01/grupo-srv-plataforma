-- Pastas e listas podem existir na raiz, sem pertencer a um espaço.
-- Na raiz, toda a equipe pode visualizar e apenas administradores podem gerenciar.

alter table public.folders alter column space_id drop not null;
alter table public.lists alter column space_id drop not null;

create function public.can_access_space_target(space uuid) returns boolean
language sql stable security definer set search_path = public
as $$
  select case when space is null then is_team() else is_space_member(space) end
$$;

create function public.can_manage_space_target(space uuid) returns boolean
language sql stable security definer set search_path = public
as $$
  select case when space is null then is_admin() else is_space_manager(space) end
$$;

create function public.can_manage_list(list uuid) returns boolean
language sql stable security definer set search_path = public
as $$ select can_manage_space_target(list_space(list)) $$;

revoke execute on function public.can_access_space_target(uuid) from public, anon;
revoke execute on function public.can_manage_space_target(uuid) from public, anon;
revoke execute on function public.can_manage_list(uuid) from public, anon;
grant execute on function public.can_access_space_target(uuid) to authenticated, service_role;
grant execute on function public.can_manage_space_target(uuid) to authenticated, service_role;
grant execute on function public.can_manage_list(uuid) to authenticated, service_role;

create or replace function public.can_read_list(list uuid) returns boolean
language sql stable security definer set search_path = public
as $$
  select can_access_space_target(list_space(list)) or (is_team() and exists (
    select 1 from tasks t join task_assignees a on a.task_id = t.id
    where t.list_id = list and t.archived_at is null and a.user_id = auth.uid()
  ))
$$;

create or replace function public.can_read_task(task uuid) returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from tasks t
    where t.id = task and (can_access_space_target(list_space(t.list_id)) or is_assignee(t.id))
  )
$$;

create or replace function public.validar_lista() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.folder_id is not null and not exists (
    select 1 from folders where id = new.folder_id and space_id is not distinct from new.space_id
  ) then
    raise exception 'A pasta precisa estar no mesmo local da lista';
  end if;
  return new;
end $$;

create function public.sincronizar_espaco_da_pasta() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  update lists set space_id = new.space_id where folder_id = new.id;
  return null;
end $$;

create trigger sincronizar_espaco_da_pasta after update of space_id on public.folders
for each row when (new.space_id is distinct from old.space_id)
execute function public.sincronizar_espaco_da_pasta();

drop policy folders_select on public.folders;
drop policy folders_insert on public.folders;
drop policy folders_update on public.folders;
create policy folders_select on public.folders for select to authenticated
  using (can_access_space_target(space_id));
create policy folders_insert on public.folders for insert to authenticated
  with check (can_manage_space_target(space_id));
create policy folders_update on public.folders for update to authenticated
  using (can_manage_space_target(space_id)) with check (can_manage_space_target(space_id));

drop policy lists_select on public.lists;
drop policy lists_insert on public.lists;
drop policy lists_update on public.lists;
create policy lists_select on public.lists for select to authenticated using (can_read_list(id));
create policy lists_insert on public.lists for insert to authenticated
  with check (can_manage_space_target(space_id));
create policy lists_update on public.lists for update to authenticated
  using (can_manage_space_target(space_id)) with check (can_manage_space_target(space_id));

drop policy list_statuses_insert on public.list_statuses;
drop policy list_statuses_update on public.list_statuses;
drop policy list_statuses_delete on public.list_statuses;
create policy list_statuses_insert on public.list_statuses for insert to authenticated
  with check (can_manage_list(list_id));
create policy list_statuses_update on public.list_statuses for update to authenticated
  using (can_manage_list(list_id)) with check (can_manage_list(list_id));
create policy list_statuses_delete on public.list_statuses for delete to authenticated
  using (can_manage_list(list_id));

drop policy tasks_select on public.tasks;
drop policy tasks_insert on public.tasks;
drop policy tasks_update on public.tasks;
create policy tasks_select on public.tasks for select to authenticated
  using (can_access_space_target(list_space(list_id)) or is_assignee(id));
create policy tasks_insert on public.tasks for insert to authenticated
  with check (is_team() and can_access_space_target(list_space(list_id)));
create policy tasks_update on public.tasks for update to authenticated
  using (can_read_task(id))
  with check (is_team() and (can_access_space_target(list_space(list_id)) or is_assignee(id)));

drop policy list_custom_fields_insert on public.list_custom_fields;
drop policy list_custom_fields_update on public.list_custom_fields;
drop policy list_custom_fields_delete on public.list_custom_fields;
create policy list_custom_fields_insert on public.list_custom_fields for insert to authenticated
  with check (can_manage_list(list_id));
create policy list_custom_fields_update on public.list_custom_fields for update to authenticated
  using (can_manage_list(list_id)) with check (can_manage_list(list_id));
create policy list_custom_fields_delete on public.list_custom_fields for delete to authenticated
  using (can_manage_list(list_id));

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

  select client_id into strict new.client_id from lists where id = new.list_id;
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
