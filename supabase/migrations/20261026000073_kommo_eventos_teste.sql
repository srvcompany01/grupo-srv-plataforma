-- Fase de teste do Kommo (antigo amoCRM): guarda, sem interpretar, o que o webhook do Kommo manda, para desenhar as regras
-- de venda, funil e origem em cima do formato real. Só o admin lê; quem grava é o endpoint (chave de serviço) depois de
-- conferir o segredo. O endpoint apaga o que tiver mais de 7 dias.

create table public.kommo_eventos_teste (
  id uuid primary key default gen_random_uuid(),
  conta text not null default '' check (length(conta) <= 80),
  recebido_em timestamptz not null default now(),
  corpo jsonb not null
);
create index kommo_eventos_teste_recebido_idx on public.kommo_eventos_teste (recebido_em desc);
alter table public.kommo_eventos_teste enable row level security;
create policy kommo_eventos_teste_ler on public.kommo_eventos_teste for select to authenticated using (is_admin());
