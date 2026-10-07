-- Configurações globais da plataforma (chave → JSON). Primeira chave: 'tema' (cores da interface).
-- Leitura liberada para quem está logado (cores não são sigilosas); escrita só para admin.
create table public.app_settings (
  key text primary key check (key ~ '^[a-z_]{1,40}$'),
  value jsonb not null check (jsonb_typeof(value) = 'object'),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);

alter table public.app_settings enable row level security;

create policy app_settings_select on public.app_settings for select to authenticated using (true);
create policy app_settings_insert on public.app_settings for insert to authenticated with check (is_admin());
create policy app_settings_update on public.app_settings for update to authenticated
  using (is_admin()) with check (is_admin());
create policy app_settings_delete on public.app_settings for delete to authenticated using (is_admin());
