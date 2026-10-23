-- Controle dos anúncios pela plataforma (Meta e Google Ads):
-- 1) Histórico de tudo o que foi alterado (pausar, ativar, orçamento, criar), pela tela ou pela IA.
-- 2) Propostas da IA que gastam dinheiro (ativar, mudar orçamento): ficam pendentes até admin ou gestor aprovar.
-- 3) Biblioteca de criativos por cliente (arquivo no R2), usada pela IA para montar campanhas na Meta.

create function public.is_gestor_ou_admin() returns boolean
language sql stable security definer set search_path = public
as $$ select exists (select 1 from profiles where id = auth.uid() and active and role in ('admin', 'gestor')) $$;

create table public.ad_changes (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  plataforma text not null check (plataforma in ('meta', 'google')),
  nivel text not null check (nivel in ('campanha', 'conjunto', 'anuncio')),
  objeto_id text not null check (length(objeto_id) <= 60),
  objeto_nome text not null default '' check (length(objeto_nome) <= 300),
  acao text not null check (acao in ('pausar', 'ativar', 'orcamento', 'criar')),
  antes text not null default '' check (length(antes) <= 200),
  depois text not null default '' check (length(depois) <= 200),
  origem text not null default 'plataforma' check (origem in ('plataforma', 'ia')),
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
create index ad_changes_cliente_idx on public.ad_changes (client_id, created_at desc);
alter table public.ad_changes enable row level security;
create policy ad_changes_ler on public.ad_changes for select to authenticated using (is_team());
create policy ad_changes_criar on public.ad_changes for insert to authenticated with check (is_team());

create table public.ad_proposals (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  plataforma text not null check (plataforma in ('meta', 'google')),
  nivel text not null check (nivel in ('campanha', 'conjunto', 'anuncio')),
  objeto_id text not null check (length(objeto_id) <= 60),
  objeto_nome text not null default '' check (length(objeto_nome) <= 300),
  acao text not null check (acao in ('ativar', 'orcamento')),
  valor_atual numeric(12, 2),
  valor_novo numeric(12, 2) check (valor_novo is null or valor_novo > 0),
  motivo text not null default '' check (length(motivo) <= 500),
  status text not null default 'pendente' check (status in ('pendente', 'aprovada', 'recusada', 'erro')),
  erro text check (length(erro) <= 500),
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  decided_by uuid references public.profiles (id) on delete set null,
  decided_at timestamptz,
  check (acao <> 'orcamento' or valor_novo is not null)
);
create index ad_proposals_pendentes_idx on public.ad_proposals (status, created_at desc);
alter table public.ad_proposals enable row level security;
create policy ad_proposals_ler on public.ad_proposals for select to authenticated using (is_team());
create policy ad_proposals_criar on public.ad_proposals for insert to authenticated with check (is_team() and status = 'pendente');
create policy ad_proposals_decidir on public.ad_proposals for update to authenticated using (is_gestor_ou_admin()) with check (is_gestor_ou_admin());

create table public.ad_creatives (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  nome text not null check (length(nome) between 1 and 200),
  tipo text not null check (tipo in ('imagem', 'video')),
  chave text not null check (length(chave) <= 300),
  mime text not null,
  tamanho bigint not null check (tamanho > 0),
  -- Envio já feito para cada conta da Meta: {"<conta>": "<hash da imagem ou id do vídeo>"}.
  meta jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
create index ad_creatives_cliente_idx on public.ad_creatives (client_id, created_at desc);
alter table public.ad_creatives enable row level security;
create policy ad_creatives_ler on public.ad_creatives for select to authenticated using (is_team());
create policy ad_creatives_criar on public.ad_creatives for insert to authenticated with check (is_team());
create policy ad_creatives_editar on public.ad_creatives for update to authenticated using (is_team()) with check (is_team());
create policy ad_creatives_excluir on public.ad_creatives for delete to authenticated using (is_team());
