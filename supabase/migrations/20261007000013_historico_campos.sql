-- Histórico ao definir, trocar ou limpar o valor de um campo personalizado da tarefa.

create function public.registrar_atividade_campo() returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  antigo jsonb;
  novo jsonb;
  linha record;
begin
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
  if antigo is not distinct from novo then
    return null;
  end if;
  -- A tarefa inteira está sendo apagada.
  if not exists (select 1 from tasks where id = linha.task_id) then
    return null;
  end if;
  insert into task_activity (task_id, actor_id, action, field, old_value, new_value)
  values (linha.task_id, auth.uid(), 'field_set', linha.field_id::text, antigo, novo);
  return null;
end $$;

create trigger registrar_atividade_campo after insert or update or delete on public.task_custom_field_values
for each row execute function public.registrar_atividade_campo();

revoke execute on function public.registrar_atividade_campo() from public, anon;
