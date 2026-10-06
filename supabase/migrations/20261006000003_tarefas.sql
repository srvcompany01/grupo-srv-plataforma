-- Tarefas (com subtarefas ilimitadas), responsáveis e etiquetas.

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.lists (id),
  client_id uuid not null references public.clients (id),
  parent_task_id uuid references public.tasks (id),
  title text not null check (btrim(title) <> ''),
  description jsonb,
  status_id uuid not null references public.list_statuses (id),
  priority text not null default 'normal' check (priority in ('urgente', 'alta', 'normal', 'baixa')),
  start_date date,
  due_date date,
  estimate_minutes integer check (estimate_minutes >= 0),
  visible_to_client boolean not null default false,
  completed_at timestamptz,
  position text collate "C" not null,
  created_by uuid references public.profiles (id) default auth.uid(),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (parent_task_id is distinct from id)
);
create index tasks_list_idx on public.tasks (list_id);
create index tasks_parent_idx on public.tasks (parent_task_id);
create index tasks_client_idx on public.tasks (client_id);
create index tasks_status_idx on public.tasks (status_id);
create index tasks_due_idx on public.tasks (due_date);

create table public.task_assignees (
  task_id uuid not null references public.tasks (id) on delete cascade,
  user_id uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  primary key (task_id, user_id)
);
create index task_assignees_user_idx on public.task_assignees (user_id);

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id),
  name text not null check (btrim(name) <> ''),
  color text not null default '#87909e',
  created_at timestamptz not null default now()
);
create index tags_space_idx on public.tags (space_id);

create table public.task_tags (
  task_id uuid not null references public.tasks (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  primary key (task_id, tag_id)
);

-- ============================================================ funções de acesso

create function public.is_assignee(task uuid) returns boolean
language sql stable security definer set search_path = public
as $$ select is_team() and exists (select 1 from task_assignees where task_id = task and user_id = auth.uid()) $$;

create function public.can_read_task(task uuid) returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from tasks t where t.id = task and (is_space_member(list_space(t.list_id)) or is_assignee(t.id))
  )
$$;

-- Na Fase 1a quem lê a tarefa também a edita.
create function public.can_edit_task(task uuid) returns boolean
language sql stable security definer set search_path = public
as $$ select can_read_task(task) $$;

create or replace function public.can_read_list(list uuid) returns boolean
language sql stable security definer set search_path = public
as $$
  select is_space_member(list_space(list)) or (is_team() and exists (
    select 1 from tasks t join task_assignees a on a.task_id = t.id
    where t.list_id = list and t.archived_at is null and a.user_id = auth.uid()
  ))
$$;

-- ============================================================ regras da tarefa

create function public.preparar_tarefa() returns trigger
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

create function public.primeiro_status_a_fazer(list uuid) returns uuid
language sql stable security definer set search_path = public
as $$ select id from list_statuses where list_id = list and category = 'todo' order by position limit 1 $$;

create trigger preparar_tarefa before insert or update on public.tasks
for each row execute function public.preparar_tarefa();

-- Mover a tarefa leva as subtarefas (cada filha, ao mudar, leva as suas).
create function public.mover_subtarefas() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  update tasks set list_id = new.list_id where parent_task_id = new.id and list_id <> new.list_id;
  return null;
end $$;

create trigger mover_subtarefas after update of list_id on public.tasks
for each row when (new.list_id is distinct from old.list_id)
execute function public.mover_subtarefas();

-- Pelo menos um responsável, conferido no fim da transação.
create function public.checar_responsaveis() returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  tarefa uuid;
begin
  if tg_table_name = 'tasks' then
    tarefa := new.id;
  else
    tarefa := old.task_id;
  end if;
  if exists (select 1 from tasks where id = tarefa and archived_at is null)
     and not exists (select 1 from task_assignees where task_id = tarefa) then
    raise exception 'A tarefa precisa de pelo menos um responsável';
  end if;
  return null;
end $$;

create constraint trigger checar_responsaveis_tarefa after insert on public.tasks
deferrable initially deferred for each row execute function public.checar_responsaveis();

create constraint trigger checar_responsaveis_remocao after delete on public.task_assignees
deferrable initially deferred for each row execute function public.checar_responsaveis();

create trigger exigir_papel_equipe before insert or update on public.task_assignees
for each row execute function public.exigir_papel_equipe();

create function public.validar_etiqueta() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if not exists (
    select 1 from tasks t
    join lists l on l.id = t.list_id
    join spaces s on s.id = l.space_id
    join tags g on g.id = new.tag_id
    where t.id = new.task_id and g.space_id in (s.id, s.parent_id)
  ) then
    raise exception 'A etiqueta precisa ser do departamento da tarefa';
  end if;
  return new;
end $$;

create trigger validar_etiqueta before insert or update on public.task_tags
for each row execute function public.validar_etiqueta();

create function public.proteger_cliente_da_lista() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if exists (select 1 from tasks where list_id = new.id) then
    raise exception 'Não é possível trocar o cliente de uma lista com tarefas';
  end if;
  return new;
end $$;

create trigger proteger_cliente_da_lista before update of client_id on public.lists
for each row when (new.client_id is distinct from old.client_id)
execute function public.proteger_cliente_da_lista();

-- ============================================================ RLS

alter table public.tasks enable row level security;
alter table public.task_assignees enable row level security;
alter table public.tags enable row level security;
alter table public.task_tags enable row level security;

create policy tasks_select on public.tasks for select to authenticated
  using (is_space_member(list_space(list_id)) or is_assignee(id));
create policy tasks_insert on public.tasks for insert to authenticated
  with check (is_team() and is_space_member(list_space(list_id)));
create policy tasks_update on public.tasks for update to authenticated
  using (is_space_member(list_space(list_id)) or is_assignee(id))
  with check (is_team() and (is_space_member(list_space(list_id)) or is_assignee(id)));

create policy task_assignees_select on public.task_assignees for select to authenticated
  using (can_read_task(task_id));
create policy task_assignees_insert on public.task_assignees for insert to authenticated
  with check (can_edit_task(task_id));
create policy task_assignees_delete on public.task_assignees for delete to authenticated
  using (can_edit_task(task_id));

create policy tags_select on public.tags for select to authenticated using (is_space_member(space_id));
create policy tags_insert on public.tags for insert to authenticated with check (is_space_manager(space_id));
create policy tags_update on public.tags for update to authenticated
  using (is_space_manager(space_id)) with check (is_space_manager(space_id));
create policy tags_delete on public.tags for delete to authenticated using (is_space_manager(space_id));

create policy task_tags_select on public.task_tags for select to authenticated using (can_read_task(task_id));
create policy task_tags_insert on public.task_tags for insert to authenticated with check (can_edit_task(task_id));
create policy task_tags_delete on public.task_tags for delete to authenticated using (can_edit_task(task_id));
