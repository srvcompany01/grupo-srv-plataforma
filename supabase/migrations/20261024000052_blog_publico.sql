-- Artigos do blog: tema (assunto, guia a IA), para quem é (público-alvo, aparece no artigo) e palavras-chave
-- secundárias (variações que o texto deve cobrir; vão para os dados estruturados).
alter table public.blog_posts
  add column topic text not null default '' check (length(topic) <= 300),
  add column audience text not null default '' check (length(audience) <= 200),
  add column secondary_keywords text[] not null default '{}' check (cardinality(secondary_keywords) <= 15);
