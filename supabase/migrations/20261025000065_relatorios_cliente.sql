-- Relatório que a agência envia ao cliente: a foto dos números do período, aberta por link público com token
-- (/r/<token>, lida no servidor pela chave mestra). A equipe gera, lista e copia o texto do WhatsApp.
create table public.client_reports (
  id uuid primary key default gen_random_uuid(),
  token text not null unique check (token ~ '^[A-Za-z0-9]{32}$'),
  client_id uuid not null references public.clients (id) on delete cascade,
  de date not null,
  ate date not null check (ate >= de),
  dados jsonb not null,
  automatico boolean not null default false,
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
create index client_reports_cliente_idx on public.client_reports (client_id, created_at desc);
alter table public.client_reports enable row level security;
create policy client_reports_ler on public.client_reports for select to authenticated using (is_team());
create policy client_reports_criar on public.client_reports for insert to authenticated with check (is_team());
