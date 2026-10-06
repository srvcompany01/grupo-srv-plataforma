-- Comentários e histórico de atividades das tarefas.

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  author_id uuid not null references public.profiles (id) default auth.uid(),
  body text not null check (btrim(body) <> ''),
  is_internal boolean not null default true,
  created_at timestamptz not null default now(),
  edited_at timestamptz
);
create index comments_task_idx on public.comments (task_id);

create table public.task_activity (
  id bigint generated always as identity primary key,
  task_id uuid not null references public.tasks (id) on delete cascade,
  actor_id uuid references public.profiles (id),
  action text not null check (action in (
    'created', 'updated', 'moved', 'archived', 'assignee_added', 'assignee_removed', 'tag_added', 'tag_removed'
  )),
  field text,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz not null default clock_timestamp()
);
create index task_activity_task_idx on public.task_activity (task_id);

-- ============================================================ comentários

create function public.preparar_comentario() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if auth.uid() is not null then
      new.author_id := auth.uid();
    end if;
    -- Comentário de cliente é sempre visível no portal.
    if exists (select 1 from profiles where id = new.author_id and role = 'cliente') then
      new.is_internal := false;
    end if;
  else
    new.author_id := old.author_id;
    new.task_id := old.task_id;
    new.created_at := old.created_at;
    if new.body is distinct from old.body then
      new.edited_at := now();
    end if;
  end if;
  return new;
end $$;

create trigger preparar_comentario before insert or update on public.comments
for each row execute function public.preparar_comentario();

-- ============================================================ histórico (só gatilhos escrevem)

create function public.registrar_atividade_tarefa() returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  campo text;
begin
  -- Mudanças em cascata (subtarefas movidas junto com a mãe) não poluem o histórico.
  if pg_trigger_depth() > 1 then
    return null;
  end if;

  if tg_op = 'INSERT' then
    insert into task_activity (task_id, actor_id, action) values (new.id, auth.uid(), 'created');
    return null;
  end if;

  if new.list_id is distinct from old.list_id then
    insert into task_activity (task_id, actor_id, action, field, old_value, new_value)
    values (new.id, auth.uid(), 'moved', 'list_id', to_jsonb(old.list_id), to_jsonb(new.list_id));
  end if;

  foreach campo in array array[
    'title', 'description', 'status_id', 'priority', 'start_date', 'due_date', 'estimate_minutes', 'visible_to_client'
  ] loop
    -- Ao mudar de lista o status é trocado automaticamente; o "moved" já conta a história.
    continue when campo = 'status_id' and new.list_id is distinct from old.list_id;
    if to_jsonb(old) -> campo is distinct from to_jsonb(new) -> campo then
      insert into task_activity (task_id, actor_id, action, field, old_value, new_value)
      values (new.id, auth.uid(), 'updated', campo, to_jsonb(old) -> campo, to_jsonb(new) -> campo);
    end if;
  end loop;

  if new.archived_at is not null and old.archived_at is null then
    insert into task_activity (task_id, actor_id, action) values (new.id, auth.uid(), 'archived');
  end if;
  return null;
end $$;

create trigger registrar_atividade_tarefa after insert or update on public.tasks
for each row execute function public.registrar_atividade_tarefa();

create function public.registrar_atividade_relacao() returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  chave text := case when tg_table_name = 'task_assignees' then 'user_id' else 'tag_id' end;
  linha jsonb;
  tarefa uuid;
  valor jsonb;
  acao text;
begin
  if tg_op = 'INSERT' then
    linha := to_jsonb(new);
  else
    linha := to_jsonb(old);
  end if;
  tarefa := (linha ->> 'task_id')::uuid;
  valor := jsonb_build_object(chave, linha -> chave);
  -- A tarefa inteira está sendo apagada.
  if not exists (select 1 from tasks where id = tarefa) then
    return null;
  end if;
  acao := case when tg_table_name = 'task_assignees' then 'assignee_' else 'tag_' end
       || case when tg_op = 'INSERT' then 'added' else 'removed' end;
  insert into task_activity (task_id, actor_id, action, old_value, new_value)
  values (
    tarefa, auth.uid(), acao,
    case when tg_op = 'DELETE' then valor end,
    case when tg_op = 'INSERT' then valor end
  );
  return null;
end $$;

create trigger registrar_atividade_responsavel after insert or delete on public.task_assignees
for each row execute function public.registrar_atividade_relacao();

create trigger registrar_atividade_etiqueta after insert or delete on public.task_tags
for each row execute function public.registrar_atividade_relacao();

-- ============================================================ RLS

alter table public.comments enable row level security;
alter table public.task_activity enable row level security;

create policy comments_select on public.comments for select to authenticated using (can_read_task(task_id));
create policy comments_insert on public.comments for insert to authenticated with check (can_read_task(task_id));
create policy comments_update on public.comments for update to authenticated
  using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy comments_delete on public.comments for delete to authenticated using (author_id = auth.uid());

create policy task_activity_select on public.task_activity for select to authenticated
  using (can_read_task(task_id));
