-- Rastreamento de tempo: cronômetro por pessoa (um ativo por vez) e lançamentos manuais.
-- Tempo é informação interna: cliente nunca lê.

alter table public.task_activity drop constraint task_activity_action_check;
alter table public.task_activity add constraint task_activity_action_check check (action in (
  'created', 'updated', 'moved', 'archived', 'assignee_added', 'assignee_removed', 'tag_added', 'tag_removed',
  'time_logged', 'field_set'
));

create table public.time_entries (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  user_id uuid not null references public.profiles (id) default auth.uid(),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_seconds integer check (duration_seconds >= 0),
  note text,
  source text not null default 'timer' check (source in ('timer', 'manual')),
  created_at timestamptz not null default now(),
  check ((ended_at is null) = (duration_seconds is null))
);
create index time_entries_task_idx on public.time_entries (task_id);
create unique index time_entries_um_ativo on public.time_entries (user_id) where ended_at is null;

-- ============================================================ regras

create function public.preparar_registro_tempo() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if auth.uid() is not null then
      new.user_id := auth.uid();
    end if;
    if new.ended_at is not null and new.duration_seconds is null then
      new.duration_seconds := greatest(0, extract(epoch from new.ended_at - new.started_at))::int;
    elsif new.duration_seconds is not null and new.ended_at is null then
      new.ended_at := new.started_at + make_interval(secs => new.duration_seconds);
    end if;
    return new;
  end if;

  new.task_id := old.task_id;
  new.user_id := old.user_id;
  new.source := old.source;
  new.started_at := old.started_at;
  new.created_at := old.created_at;

  if old.ended_at is null then
    if new.ended_at is null then
      if new.duration_seconds is not null then
        raise exception 'Pare o cronômetro antes de editar a duração';
      end if;
    else
      -- Fechando o cronômetro.
      new.duration_seconds := greatest(0, extract(epoch from new.ended_at - old.started_at))::int;
    end if;
  else
    if new.duration_seconds is null then
      new.duration_seconds := old.duration_seconds;
    end if;
    new.ended_at := old.started_at + make_interval(secs => new.duration_seconds);
  end if;
  return new;
end $$;

create trigger preparar_registro_tempo before insert or update on public.time_entries
for each row execute function public.preparar_registro_tempo();

create function public.registrar_tempo_no_historico() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.ended_at is not null and (tg_op = 'INSERT' or old.ended_at is null) then
    insert into task_activity (task_id, actor_id, action, new_value)
    values (new.task_id, new.user_id, 'time_logged', jsonb_build_object('seconds', new.duration_seconds));
  end if;
  return null;
end $$;

create trigger registrar_tempo_no_historico after insert or update on public.time_entries
for each row execute function public.registrar_tempo_no_historico();

-- ============================================================ RPCs (rodam como o usuário: RLS vale)

create function public.parar_cronometro() returns uuid
language plpgsql security invoker set search_path = public
as $$
declare
  fechado uuid;
begin
  update time_entries set ended_at = now()
  where user_id = auth.uid() and ended_at is null
  returning id into fechado;
  return fechado;
end $$;

create function public.iniciar_cronometro(p_task uuid) returns uuid
language plpgsql security invoker set search_path = public
as $$
declare
  novo uuid;
begin
  perform parar_cronometro();
  insert into time_entries (task_id, started_at, source) values (p_task, now(), 'timer')
  returning id into novo;
  return novo;
end $$;

create function public.lancar_tempo(p_task uuid, p_data date, p_minutos integer, p_nota text default null)
returns uuid
language plpgsql security invoker set search_path = public
as $$
declare
  novo uuid;
begin
  if p_minutos is null or p_minutos < 1 or p_minutos > 1440 then
    raise exception 'O tempo lançado deve ficar entre 1 e 1440 minutos';
  end if;
  insert into time_entries (task_id, started_at, duration_seconds, note, source)
  values (p_task, (p_data + time '12:00') at time zone 'America/Belem', p_minutos * 60, nullif(btrim(p_nota), ''), 'manual')
  returning id into novo;
  return novo;
end $$;

-- ============================================================ RLS

alter table public.time_entries enable row level security;

create policy time_entries_select on public.time_entries for select to authenticated
  using (is_team() and can_read_task(task_id));
create policy time_entries_insert on public.time_entries for insert to authenticated
  with check (user_id = auth.uid() and is_team() and can_read_task(task_id));
create policy time_entries_update on public.time_entries for update to authenticated
  using (is_team() and (user_id = auth.uid()
    or can_manage_space_target(list_space((select t.list_id from tasks t where t.id = task_id)))))
  with check (is_team() and (user_id = auth.uid()
    or can_manage_space_target(list_space((select t.list_id from tasks t where t.id = task_id)))));
create policy time_entries_delete on public.time_entries for delete to authenticated
  using (is_team() and (user_id = auth.uid()
    or can_manage_space_target(list_space((select t.list_id from tasks t where t.id = task_id)))));

revoke execute on function public.preparar_registro_tempo() from public, anon;
revoke execute on function public.registrar_tempo_no_historico() from public, anon;
revoke execute on function public.parar_cronometro() from public, anon;
revoke execute on function public.iniciar_cronometro(uuid) from public, anon;
revoke execute on function public.lancar_tempo(uuid, date, integer, text) from public, anon;
grant execute on function public.parar_cronometro() to authenticated, service_role;
grant execute on function public.iniciar_cronometro(uuid) to authenticated, service_role;
grant execute on function public.lancar_tempo(uuid, date, integer, text) to authenticated, service_role;
