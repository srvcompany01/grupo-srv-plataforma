-- Blog: campos do "modelo mestre de artigos" (SEO, descoberta por IA, autoridade e conversão).
-- 1) Artigo: subtítulo, tags, breadcrumb, canonical e robots próprios, Open Graph, legenda/crédito da capa,
--    CTAs próprios, relacionados escolhidos, entidades, briefing (estratégia editorial em JSON), aviso editorial,
--    histórico de atualização, revisão humana (status "revisao" + quem aprovou) e data para revisar de novo.
-- 2) Contexto da marca (uma linha só): usado pela IA e pelos dados estruturados da empresa.
-- 3) Eventos de leitura agregados por dia (rolagem, cliques no CTA, origem da visita), sem dado pessoal.

alter table public.blog_posts
  add column subtitle text not null default '' check (length(subtitle) <= 200),
  add column tags text[] not null default '{}' check (cardinality(tags) <= 10),
  add column breadcrumb_title text not null default '' check (length(breadcrumb_title) <= 60),
  add column canonical_url text not null default '' check (canonical_url = '' or canonical_url ~ '^https://'),
  add column robots_index boolean not null default true,
  add column og_title text not null default '' check (length(og_title) <= 100),
  add column og_description text not null default '' check (length(og_description) <= 300),
  add column cover_caption text not null default '' check (length(cover_caption) <= 200),
  add column cover_credit text not null default '' check (length(cover_credit) <= 120),
  add column cta_label text not null default '' check (length(cta_label) <= 80),
  add column cta_url text not null default '' check (cta_url = '' or cta_url ~ '^(/|https://)'),
  add column cta_context text not null default '' check (length(cta_context) <= 300),
  add column cta2_label text not null default '' check (length(cta2_label) <= 80),
  add column cta2_url text not null default '' check (cta2_url = '' or cta2_url ~ '^(/|https://)'),
  add column cta_position text not null default 'ambos' check (cta_position in ('meio', 'final', 'ambos')),
  add column related_ids uuid[] not null default '{}' check (cardinality(related_ids) <= 4),
  add column entities text[] not null default '{}' check (cardinality(entities) <= 20),
  add column briefing jsonb not null default '{}' check (jsonb_typeof(briefing) = 'object' and length(briefing::text) <= 30000),
  add column disclosure text not null default '' check (length(disclosure) <= 300),
  add column update_note text not null default '' check (length(update_note) <= 300),
  add column review_due date,
  add column reviewed_by uuid references public.profiles (id) on delete set null,
  add column reviewed_at timestamptz;

-- Novo status "revisao" (pronto para a revisão humana). Publicado continua exigindo data.
alter table public.blog_posts drop constraint blog_posts_status_check;
alter table public.blog_posts add constraint blog_posts_status_check check (status in ('rascunho', 'revisao', 'publicado'));
alter table public.blog_posts drop constraint blog_posts_check;
alter table public.blog_posts add constraint blog_posts_check check (status <> 'publicado' or published_at is not null);

alter table public.blog_authors add column links text[] not null default '{}' check (cardinality(links) <= 8);

create table public.blog_settings (
  id boolean primary key default true check (id),
  data jsonb not null default '{}' check (jsonb_typeof(data) = 'object' and length(data::text) <= 20000),
  updated_at timestamptz not null default now()
);
alter table public.blog_settings enable row level security;
-- Leitura pública: alimenta os dados estruturados da empresa nas páginas do blog (nada sigiloso aqui).
create policy blog_settings_ler on public.blog_settings for select to anon, authenticated using (true);
create policy blog_settings_escrever on public.blog_settings for all to authenticated using (is_team()) with check (is_team());
insert into public.blog_settings (data) values (jsonb_build_object(
  'brand_name', 'Grupo SRV',
  'founder_name', 'Fabrício Saraiva',
  'brand_description', 'A Grupo SRV implementa a Máquina de Vendas: um fluxo contínuo, previsível, controlável e escalável de vendas pela internet.',
  'main_product', 'Máquina de Vendas',
  'main_offer', 'Implementação de fluxo contínuo, previsível, controlável e escalável através da internet',
  'main_promise', 'Implementação e resultados concretos em até 90 dias, com ressalvas responsáveis',
  'main_mechanism', 'Aquisição, preparação da decisão, operação comercial e inteligência de receita',
  'revenue_engineering', 'Oferta + Demanda + Conversão → Receita',
  'four_gears', 'Contínuo, Previsível, Controlável e Escalável',
  'tone_of_voice', 'Empresarial, direto, didático, estratégico e concreto',
  'forbidden_claims', 'Garantias, números sem prova, urgência falsa, cases fictícios',
  'allow_ai_training', false
));

create table public.blog_post_events (
  post_id uuid not null references public.blog_posts (id) on delete cascade,
  day date not null,
  event text not null check (event ~ '^[a-z0-9_:.-]{1,60}$'),
  count integer not null default 0,
  primary key (post_id, day, event)
);
alter table public.blog_post_events enable row level security;
create policy blog_post_events_ler on public.blog_post_events for select to authenticated using (is_team());

-- Eventos de leitura vindos do navegador (público): só nomes conhecidos, até 20 por envio, sem dado pessoal.
-- page_view também soma na contagem de visitas do artigo.
create function public.blog_registrar_eventos(p_slug text, p_eventos text[]) returns void
language plpgsql security definer set search_path = public
as $$
declare
  artigo uuid;
  ev text;
  hoje date := (now() at time zone 'America/Belem')::date;
begin
  select id into artigo from blog_posts where slug = p_slug and status = 'publicado' and published_at <= now();
  if artigo is null or p_eventos is null then return; end if;
  foreach ev in array p_eventos[1:20] loop
    continue when ev is null or ev !~ '^(page_view|engaged_view|scroll_(25|50|75|90)|cta_click|cta2_click|internal_link_click|origem:(google|bing|chatgpt|perplexity|gemini|copilot|instagram|facebook|linkedin|whatsapp|direto|outro))$';
    insert into blog_post_events (post_id, day, event, count) values (artigo, hoje, ev, 1)
    on conflict (post_id, day, event) do update set count = blog_post_events.count + 1;
    if ev = 'page_view' then update blog_posts set views = views + 1 where id = artigo; end if;
  end loop;
end $$;
revoke execute on function public.blog_registrar_eventos(text, text[]) from public;
grant execute on function public.blog_registrar_eventos(text, text[]) to anon, authenticated;

-- Autor real (E-E-A-T). A bio e os perfis são preenchidos pela equipe em Blog → Autores, com o texto aprovado.
insert into public.blog_authors (slug, name, role) values ('fabricio-saraiva', 'Fabrício Saraiva', 'Fundador do Grupo SRV')
on conflict (slug) do nothing;
