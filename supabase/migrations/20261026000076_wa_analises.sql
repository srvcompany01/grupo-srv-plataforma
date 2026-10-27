-- Auditoria de qualidade das conversas de WhatsApp feita pela IA: uma análise por conversa. O texto da análise não cita
-- nomes nem contatos (a IA é instruída a não citar), então ela fica mesmo depois que o texto da conversa é apagado (90 dias).
create table public.wa_analises (
  talk_id bigint primary key,
  client_id uuid not null references public.clients (id) on delete cascade,
  conversa_em timestamptz not null,
  analisada_em timestamptz not null default now(),
  mensagens integer not null,
  nota smallint not null check (nota between 0 and 100),
  resultado text not null check (resultado in ('venda', 'perdido', 'em_andamento', 'sem_resposta')),
  resumo text not null default '' check (length(resumo) <= 600),
  motivo_perda text not null default '' check (length(motivo_perda) <= 200),
  objecoes text[] not null default '{}',
  pontos_fortes text[] not null default '{}',
  melhorias text[] not null default '{}'
);
create index wa_analises_cliente_idx on public.wa_analises (client_id, conversa_em desc);
alter table public.wa_analises enable row level security;
create policy wa_analises_ler on public.wa_analises for select to authenticated using (is_team());
