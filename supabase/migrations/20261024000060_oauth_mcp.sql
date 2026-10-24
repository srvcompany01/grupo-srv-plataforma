-- Login por OAuth no MCP da plataforma, para o app do Claude (claude.ai, desktop e celular) se conectar sozinho:
-- o app registra-se (registro dinâmico), a pessoa entra na plataforma e autoriza, e recebe um token srv_ normal
-- (api_tokens) com renovação. Tabelas só da chave mestra (sem políticas): as rotas /api/oauth/* fazem tudo.

create table public.oauth_clients (
  client_id text primary key check (client_id ~ '^mcp_[A-Za-z0-9]{32}$'),
  name text not null default '' check (length(name) <= 120),
  redirect_uris text[] not null check (cardinality(redirect_uris) between 1 and 10),
  created_at timestamptz not null default now()
);

create table public.oauth_codes (
  code_hash text primary key check (code_hash ~ '^[0-9a-f]{64}$'),
  client_id text not null references public.oauth_clients (client_id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  redirect_uri text not null,
  code_challenge text not null,
  scope text not null check (scope in ('read', 'write')),
  expires_at timestamptz not null,
  used_at timestamptz
);

create table public.oauth_refresh_tokens (
  token_hash text primary key check (token_hash ~ '^[0-9a-f]{64}$'),
  client_id text not null references public.oauth_clients (client_id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  api_token_id uuid references public.api_tokens (id) on delete set null,
  scope text not null check (scope in ('read', 'write')),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.oauth_clients enable row level security;
alter table public.oauth_codes enable row level security;
alter table public.oauth_refresh_tokens enable row level security;
