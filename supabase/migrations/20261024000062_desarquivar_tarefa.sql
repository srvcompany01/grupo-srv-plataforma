-- Desarquivar uma tarefa traz de volta as subtarefas (e netas) arquivadas JUNTO com ela (mesmo archived_at);
-- as que já estavam arquivadas antes continuam arquivadas. security invoker: vale a RLS de quem chama.
create function public.desarquivar_tarefa(p_id uuid) returns integer
language plpgsql security invoker set search_path = public
as $$
declare
  quando timestamptz;
  nivel uuid[];
  total integer := 0;
  n integer;
begin
  select archived_at into quando from tasks where id = p_id;
  if quando is null then raise exception 'Tarefa não encontrada ou não está arquivada' using errcode = 'P0001'; end if;
  update tasks set archived_at = null where id = p_id;
  get diagnostics n = row_count;
  if n = 0 then raise exception 'Sem permissão para desarquivar esta tarefa' using errcode = '42501'; end if;
  total := 1;
  nivel := array[p_id];
  loop
    with voltou as (update tasks set archived_at = null where parent_task_id = any (nivel) and archived_at = quando returning id)
    select array_agg(id) into nivel from voltou;
    exit when nivel is null;
    total := total + cardinality(nivel);
  end loop;
  return total;
end $$;
