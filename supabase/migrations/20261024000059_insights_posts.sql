-- Análise dos posts publicados (aba Posts): a nota (bom, mediano, ruim) vem da comparação das métricas com a média
-- do próprio perfil; a IA (Gemini, que assiste o vídeo) explica o que deu certo, o que não deu e o que replicar.
create table public.post_insights (
  task_id uuid primary key references public.content_posts (task_id) on delete cascade,
  nota text not null check (nota in ('bom', 'mediano', 'ruim')),
  tipo text not null default '' check (length(tipo) <= 120),
  resumo text not null default '' check (length(resumo) <= 1500),
  deu_certo jsonb not null default '[]'::jsonb,
  nao_deu_certo jsonb not null default '[]'::jsonb,
  replicar jsonb not null default '[]'::jsonb,
  evitar jsonb not null default '[]'::jsonb,
  -- Métricas e média do perfil no momento da análise (para comparar depois).
  metricas jsonb not null default '{}'::jsonb,
  referencia jsonb not null default '{}'::jsonb,
  assistiu_video boolean not null default false,
  analisado_por uuid references public.profiles (id) on delete set null default auth.uid(),
  analisado_em timestamptz not null default now()
);
alter table public.post_insights enable row level security;
create policy post_insights_ler on public.post_insights for select to authenticated using (is_team());
create policy post_insights_criar on public.post_insights for insert to authenticated with check (is_team());
create policy post_insights_editar on public.post_insights for update to authenticated using (is_team()) with check (is_team());
