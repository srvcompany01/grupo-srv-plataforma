-- Fase de teste do WhatsApp (Evolution API): guarda, sem interpretar, o que a Evolution manda no webhook, para desenhar as
-- regras de lead, canal e venda em cima do formato real. Só o admin lê; quem grava é o endpoint (chave de serviço) depois
-- de conferir o segredo. O endpoint apaga o que tiver mais de 7 dias.

create table public.wa_eventos_teste (
  id uuid primary key default gen_random_uuid(),
  instancia text not null default '' check (length(instancia) <= 80),
  evento text not null default '' check (length(evento) <= 80),
  recebido_em timestamptz not null default now(),
  corpo jsonb not null
);
create index wa_eventos_teste_recebido_idx on public.wa_eventos_teste (recebido_em desc);
alter table public.wa_eventos_teste enable row level security;
create policy wa_eventos_teste_ler on public.wa_eventos_teste for select to authenticated using (is_admin());
