-- Caixa de entrada de vídeos por cliente e ficha de conteúdo.
-- content_inbox: cada vídeo que chega (enviado pela plataforma, por uma IA ou copiado do Google Drive) até virar post.
-- client_content_profiles: pasta do Google Drive do cliente + tom, hashtags e chamada padrão que a IA usa nas legendas.
-- A equipe (admin, gestor, membro) lê e escreve; cliente do portal não acessa.

create table public.client_content_profiles (
  client_id uuid primary key references public.clients (id) on delete cascade,
  drive_folder_id text not null default '' check (length(drive_folder_id) <= 200),
  tone text not null default '' check (length(tone) <= 2000),
  hashtags text not null default '' check (length(hashtags) <= 2000),
  cta text not null default '' check (length(cta) <= 500),
  notes text not null default '' check (length(notes) <= 4000),
  updated_at timestamptz not null default now()
);
alter table public.client_content_profiles enable row level security;
create policy client_content_profiles_equipe on public.client_content_profiles for all to authenticated
  using (is_team()) with check (is_team());

create table public.content_inbox (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  name text not null check (length(btrim(name)) between 1 and 255),
  source text not null check (source in ('upload', 'drive', 'ia')),
  drive_file_id text check (drive_file_id is null or length(drive_file_id) <= 200),
  r2_key text not null check (length(r2_key) <= 300),
  mime text not null check (mime in ('video/mp4', 'video/quicktime', 'image/jpeg', 'image/png', 'image/webp')),
  size_bytes bigint not null default 0 check (size_bytes >= 0),
  kind text not null default 'indefinido' check (kind in ('organico', 'anuncio', 'indefinido')),
  status text not null default 'aguardando_envio' check (status in ('aguardando_envio', 'importando', 'pronto', 'usado', 'erro')),
  error text not null default '' check (length(error) <= 500),
  ai_summary text not null default '' check (length(ai_summary) <= 9000),
  post_task_id uuid references public.tasks (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index content_inbox_cliente on public.content_inbox (client_id, created_at desc);
create unique index content_inbox_drive_unico on public.content_inbox (client_id, drive_file_id) where drive_file_id is not null and status <> 'erro';
alter table public.content_inbox enable row level security;
create policy content_inbox_equipe on public.content_inbox for all to authenticated
  using (is_team()) with check (is_team());
