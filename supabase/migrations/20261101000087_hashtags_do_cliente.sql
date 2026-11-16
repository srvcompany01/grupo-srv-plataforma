-- Hashtags fixas de cada cliente, por plataforma (a primeira é o Instagram). Entram sozinhas na legenda quando o post é publicado.
create table public.client_platform_hashtags (
  client_id uuid not null references public.clients(id) on delete cascade,
  platform text not null,
  hashtags text not null default '',
  updated_at timestamptz not null default now(),
  primary key (client_id, platform)
);
alter table public.client_platform_hashtags enable row level security;
create policy client_platform_hashtags_equipe on public.client_platform_hashtags for all to authenticated
  using (is_team()) with check (is_team());

-- As hashtags que já estavam na ficha de conteúdo viram as do Instagram.
insert into public.client_platform_hashtags (client_id, platform, hashtags)
select client_id, 'instagram', hashtags from public.client_content_profiles where btrim(hashtags) <> ''
on conflict (client_id, platform) do nothing;
