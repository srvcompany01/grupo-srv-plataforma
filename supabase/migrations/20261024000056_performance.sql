-- Performance dos clientes: leads (pagos e orgânicos), investimento e faturamento, mês a mês.
-- 1) WhatsApp do cliente e o link da bio da plataforma (/l/<slug>): conta os cliques e abre o WhatsApp com uma
--    mensagem pronta; a equipe confirma cada lead que chegou por ali.
-- 2) Resultado do mês por cliente (faturamento e número de vendas), lançado pela equipe.

alter table public.clients
  add column whatsapp text check (whatsapp is null or whatsapp ~ '^[0-9]{10,15}$'),
  add column bio_slug text unique check (bio_slug is null or bio_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  add column bio_mensagem text not null default 'Olá! Vim pelo Instagram 😊' check (length(bio_mensagem) <= 300);

-- Cliques no link da bio, por dia (sem dado pessoal).
create table public.bio_clicks (
  client_id uuid not null references public.clients (id) on delete cascade,
  day date not null,
  clicks integer not null default 0,
  primary key (client_id, day)
);
alter table public.bio_clicks enable row level security;
create policy bio_clicks_ler on public.bio_clicks for select to authenticated using (is_team());

-- Visita ao link da bio (público): soma um clique e devolve para onde mandar (WhatsApp do cliente + mensagem).
create function public.registrar_clique_bio(p_slug text) returns table (whatsapp text, mensagem text)
language plpgsql security definer set search_path = public
as $$
declare
  c record;
begin
  select id, clients.whatsapp, bio_mensagem into c from clients where bio_slug = p_slug and status <> 'encerrado';
  if c.id is null then return; end if;
  insert into bio_clicks (client_id, day, clicks) values (c.id, (now() at time zone 'America/Belem')::date, 1)
  on conflict (client_id, day) do update set clicks = bio_clicks.clicks + 1;
  return query select c.whatsapp, c.bio_mensagem;
end $$;
revoke execute on function public.registrar_clique_bio(text) from public;
grant execute on function public.registrar_clique_bio(text) to anon, authenticated;

-- Leads confirmados pela equipe (ex.: conversa que chegou pelo WhatsApp com a mensagem da bio).
create table public.lead_confirmations (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  origem text not null default 'instagram_bio' check (origem in ('instagram_bio')),
  day date not null default (now() at time zone 'America/Belem')::date,
  observacao text not null default '' check (length(observacao) <= 200),
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
create index lead_confirmations_cliente_idx on public.lead_confirmations (client_id, day);
alter table public.lead_confirmations enable row level security;
create policy lead_confirmations_ler on public.lead_confirmations for select to authenticated using (is_team());
create policy lead_confirmations_criar on public.lead_confirmations for insert to authenticated with check (is_team());
create policy lead_confirmations_excluir on public.lead_confirmations for delete to authenticated using (is_team());

-- Resultado do mês (faturamento e vendas) informado pela equipe.
create table public.client_monthly_results (
  client_id uuid not null references public.clients (id) on delete cascade,
  month date not null check (extract(day from month) = 1),
  revenue numeric(14, 2) check (revenue is null or revenue >= 0),
  sales integer check (sales is null or sales >= 0),
  notes text not null default '' check (length(notes) <= 500),
  updated_by uuid references public.profiles (id) on delete set null default auth.uid(),
  updated_at timestamptz not null default now(),
  primary key (client_id, month)
);
alter table public.client_monthly_results enable row level security;
create policy client_monthly_results_ler on public.client_monthly_results for select to authenticated using (is_team());
create policy client_monthly_results_escrever on public.client_monthly_results for all to authenticated using (is_team()) with check (is_team());
