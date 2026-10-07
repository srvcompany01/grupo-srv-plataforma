-- Correções da revisão da tela da tarefa.

-- Quem perdeu acesso à tarefa ainda enxerga e para o próprio cronômetro aberto.
drop policy time_entries_select on public.time_entries;
create policy time_entries_select on public.time_entries for select to authenticated
  using (is_team() and (can_read_task(task_id) or (user_id = auth.uid() and ended_at is null)));

-- Trava por pessoa: dois "Start" simultâneos terminam com o último clique valendo, sem erro.
create or replace function public.parar_cronometro() returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  fechado uuid;
begin
  if auth.uid() is null then
    return null;
  end if;
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text, 0));
  update time_entries set ended_at = now()
  where user_id = auth.uid() and ended_at is null
  returning id into fechado;
  return fechado;
end $$;

-- Apagar um campo personalizado não gera histórico em cada tarefa.
create or replace function public.registrar_atividade_campo() returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  antigo jsonb;
  novo jsonb;
  linha record;
begin
  if pg_trigger_depth() > 1 then
    return null;
  end if;
  if tg_op = 'DELETE' then
    linha := old;
  else
    linha := new;
  end if;
  if tg_op <> 'INSERT' then
    antigo := old.value;
  end if;
  if tg_op <> 'DELETE' then
    novo := new.value;
  end if;
  if antigo is not distinct from novo
     or not exists (select 1 from tasks where id = linha.task_id)
     or not exists (select 1 from custom_fields where id = linha.field_id) then
    return null;
  end if;
  insert into task_activity (task_id, actor_id, action, field, old_value, new_value)
  values (linha.task_id, auth.uid(), 'field_set', linha.field_id::text, antigo, novo);
  return null;
end $$;

revoke execute on function public.parar_cronometro() from public, anon;
grant execute on function public.parar_cronometro() to authenticated, service_role;
