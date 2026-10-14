-- Tarefas recorrentes: a tarefa com regra é o MODELO. Quando chega a hora, o banco cria uma cópia
-- (título, descrição, prioridade, estimativa, responsáveis, etiquetas e campos personalizados) com o prazo da vez.
-- Subtarefas, anexos e comentários não são copiados. O disparo é diário (cron chama gerar_recorrencias).

create table public.task_recurrences (
  task_id uuid primary key references public.tasks (id) on delete cascade,
  frequency text not null check (frequency in ('daily', 'weekly', 'monthly')),
  every integer not null default 1 check (every between 1 and 365),
  anchor_date date not null,            -- prazo da primeira cópia
  generated integer not null default 0, -- cópias já criadas
  lead_days integer not null default 0 check (lead_days between 0 and 60), -- cria a cópia com essa antecedência
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Prazo da n-ésima cópia, sempre a partir da âncora (31 de jan + 1 mês = 28 de fev, mas + 2 meses = 31 de mar).
create function public.prazo_da_recorrencia(p_anchor date, p_frequency text, p_every integer, p_n integer)
returns date language sql immutable
as $$
  select case p_frequency
    when 'daily' then p_anchor + (p_every * p_n)
    when 'weekly' then p_anchor + (7 * p_every * p_n)
    else (p_anchor + make_interval(months => p_every * p_n))::date
  end
$$;

alter table public.task_recurrences enable row level security;
create policy task_recurrences_all on public.task_recurrences for all to authenticated
  using (is_team() and can_read_task(task_id)) with check (is_team() and can_read_task(task_id));

-- Cria as cópias que já venceram até `p_hoje` (no máximo 12 por regra por execução). Devolve quantas criou.
create function public.gerar_recorrencias(p_hoje date) returns integer
language plpgsql security definer set search_path = public
as $$
declare
  r task_recurrences%rowtype;
  modelo tasks%rowtype;
  prazo date;
  copia uuid;
  criadas integer := 0;
  rodadas integer;
begin
  for r in select * from task_recurrences where active for update skip locked loop
    select * into modelo from tasks where id = r.task_id and archived_at is null;
    if not found then continue; end if;
    rodadas := 0;
    loop
      prazo := prazo_da_recorrencia(r.anchor_date, r.frequency, r.every, r.generated);
      exit when prazo - r.lead_days > p_hoje or rodadas >= 12;

      insert into tasks (list_id, client_id, title, description, priority, estimate_minutes, due_date, position)
      values (modelo.list_id, modelo.client_id, modelo.title, modelo.description, modelo.priority, modelo.estimate_minutes, prazo,
              'a1' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISSUS') || '1')
      returning id into copia;
      insert into task_assignees (task_id, user_id) select copia, user_id from task_assignees where task_id = modelo.id;
      insert into task_tags (task_id, tag_id) select copia, tag_id from task_tags where task_id = modelo.id;
      insert into task_custom_field_values (task_id, field_id, value)
        select copia, field_id, value from task_custom_field_values where task_id = modelo.id;

      r.generated := r.generated + 1;
      rodadas := rodadas + 1;
      criadas := criadas + 1;
    end loop;
    update task_recurrences set generated = r.generated, updated_at = now() where task_id = r.task_id;
  end loop;
  return criadas;
end $$;
revoke execute on function public.gerar_recorrencias(date) from public, anon, authenticated;
grant execute on function public.gerar_recorrencias(date) to service_role;
