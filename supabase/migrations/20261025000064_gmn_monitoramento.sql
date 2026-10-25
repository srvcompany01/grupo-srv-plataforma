-- Geogrid agendado: palavras-chave que a rotina varre toda segunda-feira, avisando no sino quando a posição piora.
create table public.gmn_monitors (
  client_id uuid not null references public.clients (id) on delete cascade,
  palavra text not null check (length(palavra) between 2 and 80),
  grade integer not null check (grade in (3, 5, 7, 9)),
  raio_km numeric(5, 2) not null check (raio_km > 0 and raio_km <= 50),
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  primary key (client_id, palavra)
);
alter table public.gmn_monitors enable row level security;
create policy gmn_monitors_ler on public.gmn_monitors for select to authenticated using (is_team());
create policy gmn_monitors_criar on public.gmn_monitors for insert to authenticated with check (is_team());
create policy gmn_monitors_editar on public.gmn_monitors for update to authenticated using (is_team()) with check (is_team());
create policy gmn_monitors_parar on public.gmn_monitors for delete to authenticated using (is_team());
