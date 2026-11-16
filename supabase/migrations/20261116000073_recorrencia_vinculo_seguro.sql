-- Correção A1 (revisão de segurança): o vínculo tasks.recurrence_source_id era gravável por qualquer membro. Como o gatilho
-- "criar ao concluir" é SECURITY DEFINER e confiava nele, dava para criar tarefas numa lista restrita.
-- 1) Só a geração interna (funções do banco) grava ou muda o vínculo; usuários (papel authenticated/anon) não, nem no INSERT.
-- 2) A regra passa a guardar o autor (quem criou ou editou a regra). Cron e "ao concluir" só geram se esse autor ainda
--    estiver ativo e puder ver a tarefa-modelo (assumido por quem criou o modelo ou o primeiro responsável nas regras antigas).
-- 3) Ao concluir uma cópia, a série só continua se a cópia ainda está na lista e no cliente do modelo.

-- ------------------------------------------------------------ 1) vínculo só interno
create function public.proteger_vinculo_serie() returns trigger
language plpgsql set search_path = public
as $$
begin
  -- current_user é o papel que executa o comando: nas funções SECURITY DEFINER da série é o dono do banco; pela API é authenticated.
  if current_user in ('authenticated', 'anon') then
    if tg_op = 'INSERT' and new.recurrence_source_id is not null then
      raise exception 'O vínculo com a série é gravado só pelo sistema' using errcode = '42501';
    end if;
    if tg_op = 'UPDATE' and new.recurrence_source_id is distinct from old.recurrence_source_id then
      raise exception 'O vínculo com a série é gravado só pelo sistema' using errcode = '42501';
    end if;
  end if;
  return new;
end $$;
create trigger proteger_vinculo_serie before insert or update on public.tasks
for each row execute function public.proteger_vinculo_serie();

-- ------------------------------------------------------------ 2) autor da regra
alter table public.task_recurrences add column author_id uuid references public.profiles (id) on delete set null;

update public.task_recurrences r set author_id = coalesce(
  (select t.created_by from tasks t where t.id = r.task_id),
  (select a.user_id from task_assignees a where a.task_id = r.task_id order by a.created_at, a.user_id limit 1)
);

create function public.registrar_autor_regra() returns trigger
language plpgsql set search_path = public
as $$
begin
  if auth.uid() is null then return new; end if;
  if tg_op = 'INSERT' then
    new.author_id := auth.uid();
  elsif (new.frequency, new.every, new.anchor_date, new.lead_days, new.active, new.weekdays, new.month_mode, new.ends_on, new.max_count, new.create_mode, new.copy_assignees, new.copy_subtasks, new.copy_fields)
        is distinct from (old.frequency, old.every, old.anchor_date, old.lead_days, old.active, old.weekdays, old.month_mode, old.ends_on, old.max_count, old.create_mode, old.copy_assignees, old.copy_subtasks, old.copy_fields) then
    new.author_id := auth.uid();   -- editou a regra: passa a responder por ela
  else
    new.author_id := old.author_id; -- só o contador (generated) mudou: o autor continua o mesmo
  end if;
  return new;
end $$;
create trigger registrar_autor_regra before insert or update on public.task_recurrences
for each row execute function public.registrar_autor_regra();

-- O autor ainda pode gerar? Ativo, da equipe, e com acesso à lista do modelo (espaço aberto à equipe, membro do espaço, ou responsável).
create function public.autor_pode_gerar(p_autor uuid, p_modelo uuid) returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from tasks t
    join profiles p on p.id = coalesce(p_autor, t.created_by, (select a.user_id from task_assignees a where a.task_id = t.id order by a.created_at, a.user_id limit 1))
    where t.id = p_modelo
      and p.active and p.role in ('admin', 'gestor', 'membro')
      and (
        p.role = 'admin'
        or exists (select 1 from task_assignees a where a.task_id = t.id and a.user_id = p.id)
        or exists (select 1 from spaces s where s.id = list_space(t.list_id) and s.team_open)
        or exists (select 1 from spaces s join space_members sm on sm.space_id in (s.id, s.parent_id) where s.id = list_space(t.list_id) and sm.user_id = p.id)
      )
  )
$$;
revoke execute on function public.autor_pode_gerar(uuid, uuid) from public, anon, authenticated;

-- ------------------------------------------------------------ 3) geração revalida o autor
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
    -- O autor da regra perdeu o acesso (ou foi desativado): a série para até alguém editar a regra.
    if not autor_pode_gerar(r.author_id, r.task_id) then continue; end if;
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

create or replace function public.criar_proxima_ao_concluir() returns trigger
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
  -- Uma cópia que mudou de lista ou de cliente saiu da série: concluir não gera nada na lista do modelo.
  if new.id <> serie and (new.list_id <> modelo.list_id or new.client_id is distinct from modelo.client_id) then return null; end if;
  -- Quem responde pela regra precisa continuar ativo e com acesso ao modelo (não vale o acesso de quem concluiu).
  if not autor_pode_gerar(r.author_id, serie) then return null; end if;
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
