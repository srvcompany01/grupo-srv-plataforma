-- Imita o que o Supabase já traz pronto, para as migrações rodarem no PGlite.
-- Manter alinhado com o Supabase real: se uma migração falhar só lá, corrigir aqui também.

create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;

create schema auth;

create table auth.users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  raw_user_meta_data jsonb not null default '{}',
  raw_app_meta_data jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create function auth.uid() returns uuid
language sql stable
-- Mesma definição do Supabase.
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;

grant usage on schema public, auth to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated, service_role;

-- O Supabase concede tudo nas tabelas do schema public; quem protege é a RLS.
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
