-- Google Ads e Google Meu Negócio (Perfil da Empresa).
-- 1) A agência conecta UMA conta Google (a que gerencia a MCC do Google Ads e os perfis do Meu Negócio).
--    O refresh token fica numa tabela fechada (sem política: só a chave mestra lê).
-- 2) Cada cliente aponta a conta do Google Ads (10 dígitos) e o perfil do Meu Negócio (accounts/…/locations/…).
-- 3) Post de conteúdo pode ir também para o Google Meu Negócio.

create table public.google_agency_link (
  id boolean primary key default true check (id),
  email text not null default '',
  refresh_token text not null,
  connected_by uuid references public.profiles (id) on delete set null,
  connected_at timestamptz not null default now()
);
alter table public.google_agency_link enable row level security;

alter table public.clients
  add column google_ads_customer_id text check (google_ads_customer_id ~ '^\d{10}$'),
  add column google_location text check (google_location ~ '^accounts/\d+/locations/\d+$'),
  add column google_location_title text;

alter table public.content_posts drop constraint if exists content_posts_publish_targets_check;
alter table public.content_posts
  add constraint content_posts_publish_targets_check check (publish_targets <@ array['instagram', 'facebook', 'google']::text[]),
  add column gbp_post_name text,
  add column gbp_link text;
