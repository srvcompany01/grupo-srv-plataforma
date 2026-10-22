-- Agendamento e publicação dos posts de conteúdo no Instagram e no Facebook (API da Meta).
--  * publish_mode: 'aprovacao' (só publica depois que o cliente aprova no portal) ou 'direto' (sem aprovação).
--  * publish_status: nao_agendado → agendado → publicando → publicado | falhou. A rotina /api/cron/publicar pega os
--    agendados vencidos (e aprovados, no modo aprovação) e publica. publish_lock_at evita publicar duas vezes.
--  * ig_*/fb_*: o que já saiu em cada rede (numa nova tentativa, a rede que já publicou não repete).

alter table public.content_posts
  add column publish_at timestamptz,
  add column publish_targets text[] not null default '{}' check (publish_targets <@ array['instagram', 'facebook']::text[]),
  add column publish_mode text not null default 'aprovacao' check (publish_mode in ('aprovacao', 'direto')),
  add column publish_status text not null default 'nao_agendado' check (publish_status in ('nao_agendado', 'agendado', 'publicando', 'publicado', 'falhou')),
  add column publish_error text,
  add column publish_lock_at timestamptz,
  add column ig_container_id text,
  add column ig_media_id text,
  add column ig_permalink text,
  add column fb_post_id text,
  add column fb_permalink text,
  add column published_at timestamptz;

create index content_posts_fila_idx on public.content_posts (publish_at) where publish_status in ('agendado', 'publicando');
