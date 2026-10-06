-- Funções chamadas pelo app. Rodam como o usuário logado (security invoker): a RLS vale normalmente.

create function public.criar_tarefa(
  p_list uuid,
  p_title text,
  p_assignees uuid[],
  p_parent uuid default null,
  p_status uuid default null,
  p_position text default 'a0'
) returns uuid
language plpgsql security invoker set search_path = public
as $$
declare
  nova uuid;
begin
  if coalesce(cardinality(p_assignees), 0) = 0 then
    raise exception 'A tarefa precisa de pelo menos um responsável';
  end if;
  insert into tasks (list_id, title, parent_task_id, status_id, position)
  values (p_list, p_title, p_parent, p_status, coalesce(p_position, 'a0'))
  returning id into nova;
  insert into task_assignees (task_id, user_id) select nova, unnest(p_assignees);
  return nova;
end $$;

-- Substitui o conjunto inteiro de responsáveis.
create function public.definir_responsaveis(p_task uuid, p_assignees uuid[]) returns void
language plpgsql security invoker set search_path = public
as $$
begin
  if coalesce(cardinality(p_assignees), 0) = 0 then
    raise exception 'A tarefa precisa de pelo menos um responsável';
  end if;
  insert into task_assignees (task_id, user_id)
  select p_task, u from unnest(p_assignees) u
  on conflict do nothing;
  delete from task_assignees where task_id = p_task and user_id <> all (p_assignees);
end $$;

create function public.mover_tarefa(p_task uuid, p_status uuid, p_position text) returns void
language plpgsql security invoker set search_path = public
as $$
begin
  update tasks set status_id = p_status, position = p_position where id = p_task;
  if not found then
    raise exception 'Tarefa não encontrada';
  end if;
end $$;
