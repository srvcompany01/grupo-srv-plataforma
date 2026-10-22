-- 1) Time: presença (site aberto / ativo), status escolhido pela pessoa e minutos ativos por dia.
--    O navegador chama registrar_presenca(ativo) a cada minuto; "ativo" = mexeu na tela nos últimos 5 minutos.
--    Vários dispositivos abertos não contam em dobro (um minuto por vez, no máximo a cada 50 segundos).
-- 2) Collab: até 3 @ do Instagram convidados como coautores do post (feed, Reels e carrossel; não Stories).

create table public.team_presence (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  last_seen_at timestamptz,
  last_active_at timestamptz,
  status text not null default 'disponivel' check (status in ('disponivel', 'reuniao', 'intervalo', 'foco', 'gravando', 'externo', 'ausente')),
  status_text text not null default '' check (length(status_text) <= 80),
  status_until timestamptz,
  updated_at timestamptz not null default now()
);

create table public.team_activity (
  user_id uuid not null references public.profiles (id) on delete cascade,
  day date not null,
  active_minutes integer not null default 0,
  first_at timestamptz,
  last_at timestamptz,
  primary key (user_id, day)
);
create index team_activity_dia_idx on public.team_activity (day);

alter table public.team_presence enable row level security;
alter table public.team_activity enable row level security;
create policy team_presence_select on public.team_presence for select to authenticated using (is_team());
-- Minutos ativos: cada um vê os seus; admin e gestor veem os de todos (relatório).
create policy team_activity_select on public.team_activity for select to authenticated
  using (user_id = auth.uid() or exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'gestor') and active));
-- Escrita só pelas funções abaixo (cada pessoa só mexe na própria presença).

create function public.registrar_presenca(p_ativo boolean) returns void
language plpgsql security definer set search_path = public
as $$
declare
  eu uuid := auth.uid();
  anterior timestamptz;
  dia date := (now() at time zone 'America/Belem')::date;
begin
  if eu is null or not is_team() then return; end if;
  select last_active_at into anterior from team_presence where user_id = eu for update;
  insert into team_presence (user_id, last_seen_at, last_active_at) values (eu, now(), case when p_ativo then now() end)
  on conflict (user_id) do update set
    last_seen_at = now(),
    last_active_at = case when p_ativo then now() else team_presence.last_active_at end,
    updated_at = now();
  if p_ativo and (anterior is null or anterior < now() - interval '50 seconds') then
    insert into team_activity (user_id, day, active_minutes, first_at, last_at) values (eu, dia, 1, now(), now())
    on conflict (user_id, day) do update set active_minutes = team_activity.active_minutes + 1, last_at = now();
  end if;
  -- Status com prazo vencido volta a "disponível".
  update team_presence set status = 'disponivel', status_text = '', status_until = null
  where user_id = eu and status_until is not null and status_until < now();
end $$;

create function public.definir_status(p_status text, p_texto text, p_ate timestamptz) returns void
language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is null or not is_team() then raise exception 'Sem acesso.' using errcode = '42501'; end if;
  insert into team_presence (user_id, status, status_text, status_until) values (auth.uid(), p_status, coalesce(p_texto, ''), p_ate)
  on conflict (user_id) do update set status = excluded.status, status_text = excluded.status_text, status_until = excluded.status_until, updated_at = now();
end $$;

revoke execute on function public.registrar_presenca(boolean) from public, anon;
revoke execute on function public.definir_status(text, text, timestamptz) from public, anon;
grant execute on function public.registrar_presenca(boolean) to authenticated;
grant execute on function public.definir_status(text, text, timestamptz) to authenticated;

alter table public.content_posts add column collaborators text[] not null default '{}' check (cardinality(collaborators) <= 3);
