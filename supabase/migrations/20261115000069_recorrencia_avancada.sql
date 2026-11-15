-- Recorrência avançada: dias úteis, dias da semana, mensal por posição, fim (data ou contagem),
-- "criar ao concluir", escolha do que copiar (responsáveis, subtarefas, etiquetas e campos) e vínculo
-- da cópia com a série (tasks.recurrence_source_id aponta para a tarefa-modelo).
-- Parar a série continua sendo apagar a regra: as cópias já criadas ficam e guardam o vínculo.

alter table public.task_recurrences
  add column weekdays smallint[],  -- 1 = segunda ... 7 = domingo (só na frequência semanal; nulo = o dia da âncora)
  add column month_mode text not null default 'day' check (month_mode in ('day', 'weekday_position')),
  add column ends_on date,         -- última data possível de uma cópia
  add column max_count integer check (max_count between 1 and 1000), -- máximo de ocorrências
  add column create_mode text not null default 'schedule' check (create_mode in ('schedule', 'on_complete')),
  add column copy_assignees boolean not null default true,
  add column copy_subtasks boolean not null default true,
  add column copy_fields boolean not null default true, -- etiquetas e campos personalizados
  add constraint task_recurrences_weekdays_check check (
    weekdays is null or (cardinality(weekdays) between 1 and 7 and weekdays <@ array[1, 2, 3, 4, 5, 6, 7]::smallint[])
  );

alter table public.task_recurrences drop constraint task_recurrences_frequency_check;
alter table public.task_recurrences add constraint task_recurrences_frequency_check
  check (frequency in ('daily', 'weekdays', 'weekly', 'monthly'));

alter table public.tasks add column recurrence_source_id uuid references public.tasks (id) on delete set null;
create index tasks_recurrence_source_idx on public.tasks (recurrence_source_id) where recurrence_source_id is not null;

-- Data da n-ésima ocorrência (n começa em 0), sempre a partir da âncora.
-- Mesma regra do TypeScript em src/dominio/recorrencia.ts (há teste que compara as duas).
drop function public.prazo_da_recorrencia(date, text, integer, integer);
create function public.prazo_da_recorrencia(
  p_anchor date, p_frequency text, p_every integer, p_n integer,
  p_weekdays smallint[] default null, p_month_mode text default 'day'
) returns date language plpgsql immutable
as $$
declare
  dias smallint[];
  dow integer := extract(isodow from p_anchor)::integer;
  inicio date;
  d integer;
  total integer;
  segunda date;
  primeira integer;
  qtd integer;
  idx integer;
  mes date;
  pos integer;
  primeiro date;
  r date;
begin
  if p_frequency = 'daily' then
    return p_anchor + (p_every * p_n);
  elsif p_frequency = 'weekdays' then
    inicio := p_anchor + case dow when 6 then 2 when 7 then 1 else 0 end;
    d := extract(isodow from inicio)::integer - 1;
    total := d + p_n;
    return inicio - d + (total / 5) * 7 + (total % 5);
  elsif p_frequency = 'weekly' then
    select array_agg(x order by x) into dias from (select distinct unnest(p_weekdays) as x) s;
    if dias is null then dias := array[dow::smallint]; end if;
    segunda := p_anchor - (dow - 1);
    qtd := cardinality(dias);
    select count(*) into primeira from unnest(dias) x where x >= dow;
    if p_n < primeira then
      return segunda + (dias[(qtd - primeira) + p_n + 1] - 1);
    end if;
    idx := p_n - primeira;
    return segunda + (7 * p_every * (1 + idx / qtd)) + (dias[(idx % qtd) + 1] - 1);
  elsif p_month_mode = 'weekday_position' then
    mes := ((p_anchor - (extract(day from p_anchor)::integer - 1)) + make_interval(months => p_every * p_n))::date;
    pos := (extract(day from p_anchor)::integer + 6) / 7;
    primeiro := mes + ((dow - extract(isodow from mes)::integer + 7) % 7);
    if pos >= 5 then
      r := primeiro + 28;
      if r >= (mes + make_interval(months => 1))::date then r := r - 7; end if;
      return r;
    end if;
    return primeiro + 7 * (pos - 1);
  end if;
  return (p_anchor + make_interval(months => p_every * p_n))::date;
end $$;

-- Cria uma cópia do modelo (ou de uma subtarefa dele) com o prazo da vez, respeitando o que a regra manda copiar.
-- Toda tarefa precisa de um responsável: sem "copiar responsáveis", fica só o primeiro.
create function public.copiar_para_serie(p_origem public.tasks, p_regra public.task_recurrences, p_pai uuid, p_prazo date, p_referencia date)
returns uuid language plpgsql security definer set search_path = public
as $$
declare
  copia uuid;
  filha tasks%rowtype;
  prazo_filha date;
begin
  if p_pai is null then
    prazo_filha := p_prazo;
  elsif p_origem.due_date is not null and p_referencia is not null then
    prazo_filha := p_prazo + (p_origem.due_date - p_referencia);
  end if;

  insert into tasks (list_id, client_id, parent_task_id, title, description, priority, estimate_minutes, due_date, position, recurrence_source_id)
  values (p_origem.list_id, p_origem.client_id, p_pai, p_origem.title, p_origem.description, p_origem.priority, p_origem.estimate_minutes,
          prazo_filha,
          case when p_pai is null then 'a1' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISSUS') || '1' else p_origem.position end,
          case when p_pai is null then p_regra.task_id end)
  returning id into copia;

  if p_regra.copy_assignees then
    insert into task_assignees (task_id, user_id) select copia, user_id from task_assignees where task_id = p_origem.id;
  else
    insert into task_assignees (task_id, user_id)
      select copia, user_id from task_assignees where task_id = p_origem.id order by created_at, user_id limit 1;
  end if;
  if p_regra.copy_fields then
    insert into task_tags (task_id, tag_id) select copia, tag_id from task_tags where task_id = p_origem.id;
    insert into task_custom_field_values (task_id, field_id, value)
      select copia, field_id, value from task_custom_field_values where task_id = p_origem.id;
  end if;
  if p_regra.copy_subtasks then
    for filha in select * from tasks where parent_task_id = p_origem.id and archived_at is null order by position loop
      perform copiar_para_serie(filha, p_regra, copia, p_prazo, p_referencia);
    end loop;
  end if;
  return copia;
end $$;
revoke execute on function public.copiar_para_serie(public.tasks, public.task_recurrences, uuid, date, date) from public, anon, authenticated;

-- Cria as cópias que já venceram até `p_hoje` (no máximo 12 por regra por execução). Devolve quantas criou.
-- Só as regras "na data programada"; as de "ao concluir" são tratadas pelo gatilho abaixo.
create or replace function public.gerar_recorrencias(p_hoje date) returns integer
language plpgsql security definer set search_path = public
as $$
declare
  r task_recurrences%rowtype;
  modelo tasks%rowtype;
  prazo date;
  criadas integer := 0;
  rodadas integer;
begin
  for r in select * from task_recurrences where active and create_mode = 'schedule' for update skip locked loop
    select * into modelo from tasks where id = r.task_id and archived_at is null;
    if not found then continue; end if;
    rodadas := 0;
    loop
      exit when rodadas >= 12 or (r.max_count is not null and r.generated >= r.max_count);
      prazo := prazo_da_recorrencia(r.anchor_date, r.frequency, r.every, r.generated, r.weekdays, r.month_mode);
      exit when (r.ends_on is not null and prazo > r.ends_on) or prazo - r.lead_days > p_hoje;

      perform copiar_para_serie(modelo, r, null, prazo, modelo.due_date);
      r.generated := r.generated + 1;
      rodadas := rodadas + 1;
      criadas := criadas + 1;
    end loop;
    update task_recurrences set generated = r.generated, updated_at = now() where task_id = r.task_id;
  end loop;
  return criadas;
end $$;

-- "Criar ao concluir": ao concluir a tarefa-modelo ou uma cópia da série, cria a próxima ocorrência
-- (a primeira data de hoje em diante e depois do prazo da tarefa concluída). Só uma cópia aberta por vez.
create function public.criar_proxima_ao_concluir() returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  serie uuid := coalesce(new.recurrence_source_id, new.id);
  r task_recurrences%rowtype;
  modelo tasks%rowtype;
  hoje date := (now() at time zone 'America/Belem')::date;
  n integer;
  prazo date;
begin
  select * into r from task_recurrences where task_id = serie and active and create_mode = 'on_complete' for update;
  if not found then return null; end if;
  select * into modelo from tasks where id = serie and archived_at is null;
  if not found then return null; end if;
  if exists (select 1 from tasks where recurrence_source_id = serie and id <> new.id and completed_at is null and archived_at is null) then
    return null;
  end if;

  n := r.generated;
  loop
    if (r.max_count is not null and n >= r.max_count) or n > r.generated + 1000 then return null; end if;
    prazo := prazo_da_recorrencia(r.anchor_date, r.frequency, r.every, n, r.weekdays, r.month_mode);
    exit when prazo >= hoje and (new.due_date is null or prazo > new.due_date);
    n := n + 1;
  end loop;
  if r.ends_on is not null and prazo > r.ends_on then return null; end if;

  perform copiar_para_serie(modelo, r, null, prazo, modelo.due_date);
  update task_recurrences set generated = n + 1, updated_at = now() where task_id = serie;
  return null;
end $$;
revoke execute on function public.criar_proxima_ao_concluir() from public, anon, authenticated;

create trigger criar_proxima_ao_concluir after update on public.tasks
for each row when (old.completed_at is null and new.completed_at is not null and new.parent_task_id is null)
execute function public.criar_proxima_ao_concluir();
