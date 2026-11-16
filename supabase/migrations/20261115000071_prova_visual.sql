-- Prova visual: comentários do cliente presos a um ponto da mídia (ou a um instante do vídeo) de cada VERSÃO do post.
-- Quem cria marcações é só o cliente (pelo link do portal, com a chave mestra no servidor). A equipe responde e resolve:
-- não cria marcação nova. Depois que o cliente responde à versão (aprova ou pede ajuste) ela vira somente leitura para ele.
-- Não há política de exclusão: os comentários só somem junto com a tarefa.

create table public.content_review_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  version_id uuid not null references public.content_versions (id) on delete cascade,
  parent_id uuid references public.content_review_comments (id) on delete cascade, -- resposta: aponta para o comentário raiz
  author_kind text not null check (author_kind in ('cliente', 'equipe')),
  author_user_id uuid references public.profiles (id) on delete set null,          -- só da equipe
  author_name text not null check (btrim(author_name) <> '' and length(author_name) <= 80),
  body text not null check (btrim(body) <> '' and length(body) <= 2000),
  media_index integer check (media_index >= 0 and media_index < 50),               -- qual mídia do carrossel
  x_pct numeric(5, 2) check (x_pct between 0 and 100),                              -- posição em % da mídia
  y_pct numeric(5, 2) check (y_pct between 0 and 100),
  video_second numeric(8, 2) check (video_second >= 0),                             -- instante do vídeo
  resolved_at timestamptz,
  resolved_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  -- ponto: x e y juntos
  check ((x_pct is null) = (y_pct is null)),
  -- resposta não tem local nem resolução; marcação nova (raiz) é só do cliente
  check (parent_id is null or (media_index is null and x_pct is null and video_second is null and resolved_at is null)),
  check (parent_id is not null or author_kind = 'cliente'),
  -- ponto ou instante só fazem sentido com a mídia escolhida
  check ((x_pct is null and video_second is null) or media_index is not null),
  -- quem é da equipe tem usuário; o cliente não
  check ((author_kind = 'equipe') = (author_user_id is not null))
);
create index content_review_comments_version_idx on public.content_review_comments (version_id, created_at);
create index content_review_comments_task_idx on public.content_review_comments (task_id) where parent_id is null and resolved_at is null;
create index content_review_comments_parent_idx on public.content_review_comments (parent_id) where parent_id is not null;

-- Regras no banco (valem para qualquer caminho de escrita, inclusive a chave mestra do portal).
create function public.preparar_comentario_revisao() returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  versao content_versions%rowtype;
  post content_posts%rowtype;
  pai content_review_comments%rowtype;
begin
  if tg_op = 'UPDATE' then
    -- Só a resolução muda (e só em comentário raiz); o resto fica como foi escrito.
    if new.task_id is distinct from old.task_id or new.version_id is distinct from old.version_id or new.parent_id is distinct from old.parent_id
       or new.author_kind is distinct from old.author_kind or new.author_user_id is distinct from old.author_user_id
       or new.author_name is distinct from old.author_name or new.body is distinct from old.body
       or new.media_index is distinct from old.media_index or new.x_pct is distinct from old.x_pct
       or new.y_pct is distinct from old.y_pct or new.video_second is distinct from old.video_second
       or new.created_at is distinct from old.created_at then
      raise exception 'Só dá para resolver ou reabrir um comentário';
    end if;
    if new.parent_id is not null and (new.resolved_at is not null or new.resolved_by is not null) then
      raise exception 'Só comentários do cliente podem ser resolvidos';
    end if;
    if new.resolved_at is null then
      new.resolved_by := null;
    elsif old.resolved_at is null then
      new.resolved_by := auth.uid();
    else
      new.resolved_at := old.resolved_at;
      new.resolved_by := old.resolved_by;
    end if;
    return new;
  end if;

  select * into versao from content_versions where id = new.version_id;
  if not found then raise exception 'Versão não encontrada'; end if;
  if new.task_id is distinct from versao.task_id then
    raise exception 'O task_id precisa ser o da tarefa da versão';
  end if;
  select * into post from content_posts where task_id = versao.task_id;

  if new.author_kind = 'equipe' then
    if auth.uid() is not null then
      new.author_user_id := auth.uid();
      new.author_name := coalesce((select left(full_name, 80) from profiles where id = auth.uid()), new.author_name);
    end if;
  else
    -- O cliente só comenta a versão atual, enquanto ela espera a resposta dele.
    if versao.number <> post.current_version or post.approval <> 'aguardando'
       or exists (select 1 from content_responses where version_id = versao.id) then
      raise exception 'Esta versão já foi respondida: os comentários ficam só para leitura';
    end if;
  end if;

  if new.parent_id is not null then
    select * into pai from content_review_comments where id = new.parent_id;
    if not found or pai.parent_id is not null or pai.version_id <> new.version_id then
      raise exception 'A resposta precisa ser a um comentário da mesma versão';
    end if;
    if new.author_kind = 'cliente' and not exists (select 1 from content_review_comments where parent_id = pai.id and author_kind = 'equipe') then
      raise exception 'O cliente só responde depois que a agência respondeu';
    end if;
  end if;
  return new;
end $$;
create trigger preparar_comentario_revisao before insert or update on public.content_review_comments
for each row execute function public.preparar_comentario_revisao();

-- RLS: a equipe com acesso à tarefa lê, responde e resolve. Marcação nova e exclusão não existem para a equipe.
alter table public.content_review_comments enable row level security;
create policy content_review_comments_select on public.content_review_comments for select to authenticated
  using (is_team() and can_read_task(task_id));
create policy content_review_comments_reply on public.content_review_comments for insert to authenticated
  with check (is_team() and can_read_task(task_id) and author_kind = 'equipe' and parent_id is not null and author_user_id = auth.uid());
create policy content_review_comments_resolve on public.content_review_comments for update to authenticated
  using (is_team() and can_read_task(task_id) and parent_id is null)
  with check (is_team() and can_read_task(task_id) and parent_id is null);

revoke execute on function public.preparar_comentario_revisao() from public, anon, authenticated;
