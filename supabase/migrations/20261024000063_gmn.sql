-- Aba GMN (Google Meu Negócio) com dados públicos da Places API do Google, sem depender da API do Business Profile:
-- o lugar do cliente no Google, cache dos lugares (cliente e concorrentes), varreduras do geogrid e a foto diária da
-- nota e do número de avaliações.

alter table public.clients add column google_place_id text check (google_place_id is null or (google_place_id ~ '^[A-Za-z0-9_-]{10,}$' and length(google_place_id) <= 300));

-- Cache dos detalhes de cada lugar (evita repetir consulta paga): nome, nota, avaliações e o resto em `dados`.
create table public.google_places (
  id text primary key check (id ~ '^[A-Za-z0-9_-]{10,}$' and length(id) <= 300),
  nome text not null default '',
  endereco text not null default '',
  nota numeric(2, 1),
  avaliacoes integer,
  lat double precision,
  lng double precision,
  dados jsonb not null default '{}'::jsonb,
  atualizado_em timestamptz not null default now()
);
alter table public.google_places enable row level security;
create policy google_places_ler on public.google_places for select to authenticated using (is_team());
create policy google_places_gravar on public.google_places for insert to authenticated with check (is_team());
create policy google_places_atualizar on public.google_places for update to authenticated using (is_team()) with check (is_team());

-- Varredura do geogrid: a posição do cliente em cada ponto da grade para uma palavra-chave.
create table public.gmn_scans (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  palavra text not null check (length(palavra) between 2 and 80),
  grade integer not null check (grade in (3, 5, 7, 9)),
  raio_km numeric(5, 2) not null check (raio_km > 0 and raio_km <= 50),
  centro_lat double precision not null,
  centro_lng double precision not null,
  -- [{ lat, lng, posicao (1..60 ou null = fora), top: [place ids dos 3 primeiros] }]
  pontos jsonb not null,
  metricas jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
create index gmn_scans_cliente_idx on public.gmn_scans (client_id, created_at desc);
alter table public.gmn_scans enable row level security;
create policy gmn_scans_ler on public.gmn_scans for select to authenticated using (is_team());
create policy gmn_scans_criar on public.gmn_scans for insert to authenticated with check (is_team());

-- Foto diária do perfil público (para a evolução da nota e das avaliações e o alerta de avaliação nova).
create table public.gmn_snapshots (
  client_id uuid not null references public.clients (id) on delete cascade,
  dia date not null,
  nota numeric(2, 1),
  avaliacoes integer,
  primary key (client_id, dia)
);
alter table public.gmn_snapshots enable row level security;
create policy gmn_snapshots_ler on public.gmn_snapshots for select to authenticated using (is_team());
