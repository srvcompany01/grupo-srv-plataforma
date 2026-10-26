-- Expediente de atendimento de cada cliente (o tempo de resposta conta só dentro dele) e controle dos avisos de conversa sem resposta.
alter table public.clients
  add column atend_abre smallint not null default 480 check (atend_abre between 0 and 1439),
  add column atend_fecha smallint not null default 1080 check (atend_fecha between 1 and 1440),
  add column atend_dias smallint[] not null default '{1,2,3,4,5}' check (atend_dias <@ array[0,1,2,3,4,5,6]::smallint[]),
  add constraint clients_atend_ordem check (atend_fecha > atend_abre);

-- Uma linha por mensagem do cliente que já gerou aviso: não avisa duas vezes a mesma espera.
create table public.wa_alertas (
  talk_id bigint not null,
  mensagem_em timestamptz not null,
  client_id uuid not null references public.clients (id) on delete cascade,
  avisado_em timestamptz not null default now(),
  primary key (talk_id, mensagem_em)
);
alter table public.wa_alertas enable row level security;
create policy wa_alertas_ler on public.wa_alertas for select to authenticated using (is_team());
