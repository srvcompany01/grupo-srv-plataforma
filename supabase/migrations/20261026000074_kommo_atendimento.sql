-- Atendimento por WhatsApp via Kommo: funis ligados a cada cliente, negócios (venda = etapa 142), conversas e mensagens.
-- O texto das mensagens é guardado já mascarado (telefone, CPF, CNPJ, e-mail, cartão) e apagado depois de 90 dias; o nome da
-- pessoa nunca é guardado. Só a equipe lê; quem grava é o webhook (chave de serviço).

-- Qual funil do Kommo é de qual cliente (só os funis ligados aqui entram nas contas).
create table public.kommo_funis (
  pipeline_id bigint primary key,
  client_id uuid not null references public.clients (id) on delete cascade,
  nome text not null default '',
  created_at timestamptz not null default now()
);
alter table public.kommo_funis enable row level security;
create policy kommo_funis_ler on public.kommo_funis for select to authenticated using (is_team());
create policy kommo_funis_gerir on public.kommo_funis for all to authenticated using (is_gestor_ou_admin()) with check (is_gestor_ou_admin());

create table public.kommo_negocios (
  id bigint primary key,
  client_id uuid not null references public.clients (id) on delete cascade,
  pipeline_id bigint not null,
  status_id bigint,
  valor numeric(14, 2) not null default 0 check (valor >= 0),
  etiquetas text[] not null default '{}',
  responsavel_id bigint,
  criado_em timestamptz,
  ganho_em timestamptz,
  perdido_em timestamptz,
  excluido_em timestamptz,
  atualizado_em timestamptz not null default now()
);
create index kommo_negocios_cliente_idx on public.kommo_negocios (client_id, criado_em desc);
create index kommo_negocios_ganho_idx on public.kommo_negocios (client_id, ganho_em) where ganho_em is not null;
alter table public.kommo_negocios enable row level security;
create policy kommo_negocios_ler on public.kommo_negocios for select to authenticated using (is_team());

create table public.wa_conversas (
  talk_id bigint primary key,
  client_id uuid not null references public.clients (id) on delete cascade,
  lead_id bigint,
  contato_id bigint,
  origem text not null default '',
  criada_em timestamptz not null,
  atualizada_em timestamptz not null
);
create index wa_conversas_cliente_idx on public.wa_conversas (client_id, criada_em desc);
alter table public.wa_conversas enable row level security;
create policy wa_conversas_ler on public.wa_conversas for select to authenticated using (is_team());

create table public.wa_mensagens (
  id text primary key,
  client_id uuid not null references public.clients (id) on delete cascade,
  talk_id bigint not null,
  lead_id bigint,
  papel text not null check (papel in ('cliente', 'atendente', 'robo')),
  autor_tipo text not null default '',
  autor_id text not null default '',
  texto text not null default '' check (length(texto) <= 4000),
  criada_em timestamptz not null
);
create index wa_mensagens_cliente_idx on public.wa_mensagens (client_id, criada_em desc);
create index wa_mensagens_conversa_idx on public.wa_mensagens (talk_id, criada_em);
alter table public.wa_mensagens enable row level security;
create policy wa_mensagens_ler on public.wa_mensagens for select to authenticated using (is_team());

-- Retenção: o texto some depois de 90 dias (a rotina diária chama isto); as métricas já calculadas não dependem dele.
create function public.apagar_mensagens_antigas() returns integer
language sql security definer set search_path = public
as $$
  with apagadas as (delete from wa_mensagens where criada_em < now() - interval '90 days' returning 1)
  select count(*)::integer from apagadas
$$;
revoke execute on function public.apagar_mensagens_antigas() from public, anon, authenticated;
