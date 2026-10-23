-- Blog da Grupo SRV (www.gruposrv.com.br/blog): artigos em Markdown escritos pela equipe na plataforma, em 4 categorias
-- (cada uma é um "pilar" de SEO), com autores (E-E-A-T), newsletter e contagem de visitas para o "Mais lidas".
-- Leitura pública só do que está publicado (published_at <= agora); escrita só da equipe.

create table public.blog_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (length(name) between 1 and 60),
  description text not null default '' check (length(description) <= 600),
  color text not null default '#d80d12' check (color ~ '^#[0-9a-fA-F]{6}$'),
  position integer not null default 0
);

create table public.blog_authors (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (length(name) between 1 and 80),
  role text not null default '' check (length(role) <= 80),
  bio text not null default '' check (length(bio) <= 800),
  avatar_key text,
  user_id uuid references public.profiles (id) on delete set null
);

create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 90),
  title text not null check (length(title) between 1 and 160),
  seo_title text not null default '' check (length(seo_title) <= 80),
  excerpt text not null default '' check (length(excerpt) <= 300),
  keyword text not null default '' check (length(keyword) <= 80),
  content text not null default '' check (length(content) <= 200000),
  cover_key text,
  cover_alt text not null default '' check (length(cover_alt) <= 200),
  category_id uuid references public.blog_categories (id) on delete set null,
  author_id uuid references public.blog_authors (id) on delete set null,
  is_pillar boolean not null default false,
  -- rascunho = só a equipe vê; publicado = no ar a partir de published_at (data futura = agendado).
  status text not null default 'rascunho' check (status in ('rascunho', 'publicado')),
  published_at timestamptz,
  views integer not null default 0,
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status = 'rascunho' or published_at is not null)
);
create index blog_posts_publicados_idx on public.blog_posts (published_at desc) where status = 'publicado';
create index blog_posts_categoria_idx on public.blog_posts (category_id);

create table public.blog_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and length(email) <= 200),
  name text not null default '' check (length(name) <= 80),
  source text not null default '' check (length(source) <= 120),
  created_at timestamptz not null default now(),
  unsubscribed_at timestamptz
);

create function public.blog_tocar_atualizacao() returns trigger
language plpgsql set search_path = public
as $$ begin new.updated_at := now(); return new; end $$;
create trigger blog_posts_atualizado before update on public.blog_posts
for each row when (old.* is distinct from new.* and old.views = new.views) execute function public.blog_tocar_atualizacao();

alter table public.blog_categories enable row level security;
alter table public.blog_authors enable row level security;
alter table public.blog_posts enable row level security;
alter table public.blog_subscribers enable row level security;

create policy blog_categories_ler on public.blog_categories for select to anon, authenticated using (true);
create policy blog_categories_escrever on public.blog_categories for all to authenticated using (is_team()) with check (is_team());
create policy blog_authors_ler on public.blog_authors for select to anon, authenticated using (true);
create policy blog_authors_escrever on public.blog_authors for all to authenticated using (is_team()) with check (is_team());
create policy blog_posts_ler_publico on public.blog_posts for select to anon using (status = 'publicado' and published_at <= now());
create policy blog_posts_ler on public.blog_posts for select to authenticated using ((status = 'publicado' and published_at <= now()) or is_team());
create policy blog_posts_criar on public.blog_posts for insert to authenticated with check (is_team());
create policy blog_posts_editar on public.blog_posts for update to authenticated using (is_team()) with check (is_team());
-- Inscritos: só a equipe lê; a inscrição pública entra pela API (chave mestra) depois da validação.
create policy blog_subscribers_ler on public.blog_subscribers for select to authenticated using (is_team());

-- Visita a um artigo publicado (público): soma 1 para o "Mais lidas".
create function public.blog_contar_visita(p_slug text) returns void
language sql security definer set search_path = public
as $$ update blog_posts set views = views + 1 where slug = p_slug and status = 'publicado' and published_at <= now() $$;
revoke execute on function public.blog_contar_visita(text) from public;
grant execute on function public.blog_contar_visita(text) to anon, authenticated;

insert into public.blog_categories (slug, name, description, color, position) values
  ('trafego-pago', 'Tráfego pago', 'Guias práticos de Meta Ads, Google Ads e TikTok Ads: como investir, montar campanhas, medir o retorno e transformar cliques em clientes.', '#2a78d6', 1),
  ('redes-sociais', 'Redes sociais e conteúdo', 'Instagram, Reels, calendário de conteúdo e engajamento: o que funciona hoje para empresas crescerem nas redes sociais.', '#d55181', 2),
  ('vendas-e-marketing', 'Vendas e marketing', 'Funil de vendas, captação de leads, CRM e atendimento pelo WhatsApp: como estruturar uma máquina de vendas previsível.', '#d80d12', 3),
  ('google-e-presenca-local', 'Google e presença local', 'Google Meu Negócio, SEO local, sites e landing pages: como ser encontrado por quem procura o seu serviço na sua cidade.', '#1baf7a', 4);

insert into public.blog_authors (slug, name, role, bio) values
  ('equipe-grupo-srv', 'Equipe Grupo SRV', 'Agência de marketing e vendas', 'A Grupo SRV é uma agência de marketing e vendas que cuida de tráfego pago, redes sociais, conteúdo e presença no Google de empresas que querem vender mais com previsibilidade.');
