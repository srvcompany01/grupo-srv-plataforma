-- Comentários do Instagram e do Facebook dos clientes (posts orgânicos e anúncios), lidos pela API da Meta.
-- A plataforma guarda cada comentário uma vez (para responder, ocultar e acompanhar), classifica o tom e avisa no sino
-- (admin e gestor) quando o comentário é negativo ou agressivo.

create table public.social_comments (
  plataforma text not null check (plataforma in ('instagram', 'facebook')),
  id text not null check (length(id) <= 120),
  client_id uuid not null references public.clients (id) on delete cascade,
  origem text not null default 'organico' check (origem in ('organico', 'anuncio')),
  post_id text not null check (length(post_id) <= 120),
  post_link text not null default '',
  post_texto text not null default '' check (length(post_texto) <= 300),
  anuncio_nome text not null default '' check (length(anuncio_nome) <= 200),
  parent_id text check (length(parent_id) <= 120),
  autor text not null default '' check (length(autor) <= 120),
  da_marca boolean not null default false,
  texto text not null default '' check (length(texto) <= 8000),
  criado_em timestamptz not null,
  curtidas integer not null default 0,
  tom text not null default 'neutro' check (tom in ('positivo', 'neutro', 'negativo', 'agressivo')),
  motivo text not null default '' check (length(motivo) <= 200),
  respondido_em timestamptz,
  respondido_por uuid references public.profiles (id) on delete set null,
  oculto boolean not null default false,
  resolvido_em timestamptz,
  lido_em timestamptz default now(),
  primary key (plataforma, id)
);
create index social_comments_cliente_idx on public.social_comments (client_id, origem, criado_em desc);
create index social_comments_alerta_idx on public.social_comments (tom) where tom in ('negativo', 'agressivo') and resolvido_em is null;

alter table public.social_comments enable row level security;
create policy social_comments_ler on public.social_comments for select to authenticated using (is_team());
-- A equipe marca resposta, ocultar e resolvido; a leitura da Meta grava pela chave mestra.
create policy social_comments_editar on public.social_comments for update to authenticated using (is_team()) with check (is_team());

-- Avisos do sistema no sino (ex.: comentário agressivo): texto e link próprios, sem tarefa nem chat.
alter table public.notifications add column message text check (length(message) <= 300);
alter table public.notifications add column link text check (link is null or link ~ '^/');
alter table public.notifications drop constraint notifications_kind_check;
alter table public.notifications add constraint notifications_kind_check check (kind in ('mention', 'chat_mention', 'alerta'));
alter table public.notifications drop constraint notifications_alvo_check;
alter table public.notifications add constraint notifications_alvo_check check (task_id is not null or chat_message_id is not null or link is not null);
