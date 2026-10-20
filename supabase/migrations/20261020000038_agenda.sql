-- Agenda da equipe.
--  * agenda_events: compromissos. visibility: 'privado' (só quem criou), 'equipe' (todos) ou 'selecionados'
--    (quem criou + as pessoas de agenda_event_people). repeat: compromisso fixo (diário, semanal ou mensal, até repeat_until).
--    Membro só cria compromisso privado; admin e gestor também criam para a equipe ou para pessoas escolhidas.
--  * google_calendar_links / agenda_google_events: vínculo de cada pessoa com o Google Agenda (refresh token) e o id do
--    evento criado no Google de cada pessoa. Sem políticas: só o servidor (chave mestra) lê e grava.

create table public.agenda_events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(btrim(title)) between 1 and 120),
  description text not null default '' check (length(description) <= 2000),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  all_day boolean not null default false,
  visibility text not null default 'privado' check (visibility in ('privado', 'equipe', 'selecionados')),
  repeat text not null default 'nunca' check (repeat in ('nunca', 'diario', 'semanal', 'mensal')),
  repeat_until date,
  created_by uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index agenda_events_inicio_idx on public.agenda_events (starts_at);

create table public.agenda_event_people (
  event_id uuid not null references public.agenda_events (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  primary key (event_id, user_id)
);
create index agenda_event_people_usuario_idx on public.agenda_event_people (user_id);

create function public.agenda_events_tocar() returns trigger
language plpgsql as $$
begin new.updated_at := now(); return new; end $$;
create trigger agenda_events_tocar before update on public.agenda_events for each row execute function public.agenda_events_tocar();

-- security definer: as políticas de agenda_event_people consultam o compromisso sem recursão.
create function public.can_read_agenda_event(ev uuid) returns boolean
language sql stable security definer set search_path = public
as $$
  select is_team() and exists (
    select 1 from agenda_events e
    where e.id = ev and (
      e.created_by = auth.uid() or e.visibility = 'equipe'
      or (e.visibility = 'selecionados' and exists (select 1 from agenda_event_people p where p.event_id = ev and p.user_id = auth.uid()))
    )
  )
$$;

create function public.can_edit_agenda_event(ev uuid) returns boolean
language sql stable security definer set search_path = public
as $$ select is_team() and exists (select 1 from agenda_events e where e.id = ev and (e.created_by = auth.uid() or is_admin())) $$;

alter table public.agenda_events enable row level security;
-- Regra escrita aqui (e não só na função) para o `returning` do insert enxergar a linha nova.
create policy agenda_events_select on public.agenda_events for select to authenticated using (
  is_team() and (
    created_by = auth.uid() or visibility = 'equipe'
    or (visibility = 'selecionados' and exists (select 1 from agenda_event_people p where p.event_id = id and p.user_id = auth.uid()))
  )
);
create policy agenda_events_insert on public.agenda_events for insert to authenticated
  with check (is_team() and created_by = auth.uid() and (visibility = 'privado' or my_role() in ('admin', 'gestor')));
create policy agenda_events_update on public.agenda_events for update to authenticated
  using (is_team() and (created_by = auth.uid() or is_admin()))
  with check (is_team() and (visibility = 'privado' or my_role() in ('admin', 'gestor')));
create policy agenda_events_delete on public.agenda_events for delete to authenticated
  using (is_team() and (created_by = auth.uid() or is_admin()));

alter table public.agenda_event_people enable row level security;
create policy agenda_event_people_select on public.agenda_event_people for select to authenticated using (can_read_agenda_event(event_id));
create policy agenda_event_people_insert on public.agenda_event_people for insert to authenticated with check (can_edit_agenda_event(event_id));
create policy agenda_event_people_delete on public.agenda_event_people for delete to authenticated using (can_edit_agenda_event(event_id));

create table public.google_calendar_links (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  email text not null default '',
  refresh_token text not null,
  created_at timestamptz not null default now()
);
alter table public.google_calendar_links enable row level security;

create table public.agenda_google_events (
  event_id uuid not null references public.agenda_events (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  google_event_id text not null,
  primary key (event_id, user_id)
);
alter table public.agenda_google_events enable row level security;
