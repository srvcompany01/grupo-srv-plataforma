-- Estratégia do cliente (aba Estratégia): um documento por cliente e método
-- (publico, jornada, posicionamento, receita, swot) com textos, listas e itens marcados.
create table public.client_strategy (
  client_id uuid not null references public.clients(id) on delete cascade,
  method text not null check (method in ('publico', 'jornada', 'posicionamento', 'receita', 'swot')),
  data jsonb not null default '{}'::jsonb check (pg_column_size(data) <= 200000),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null default auth.uid(),
  primary key (client_id, method)
);
alter table public.client_strategy enable row level security;
create policy client_strategy_equipe on public.client_strategy for all to authenticated
  using (is_team()) with check (is_team());
