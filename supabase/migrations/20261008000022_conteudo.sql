-- Pipeline de conteúdo: o post é uma TAREFA da lista de conteúdo; formato, versões, mídias e respostas do cliente
-- ficam em tabelas ligadas à tarefa. O cliente (link público) nunca acessa estas tabelas: só o servidor, com a service role.
-- Só adiciona; nada é apagado.

-- 1) Qual lista é de conteúdo, e o token do link de aprovação de cada cliente.
alter table public.lists
  add column kind text not null default 'tarefas' check (kind in ('tarefas', 'conteudo'));
update public.lists set kind = 'conteudo' where slug = 'social-conteudo';

alter table public.clients
  add column approval_token text not null unique
    default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');

-- 2) Tabelas.
create table public.content_posts (
  task_id uuid primary key references public.tasks (id) on delete cascade,
  format text not null check (format in ('feed', 'reels', 'stories', 'tiktok')),
  approval text not null default 'rascunho' check (approval in ('rascunho', 'aguardando', 'aprovado', 'ajuste')),
  current_version integer not null default 1,
  created_at timestamptz not null default now()
);

create table public.content_versions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.content_posts (task_id) on delete cascade,
  number integer not null check (number >= 1),
  idea text not null default '',
  objective text not null default '',
  caption text not null default '',
  created_at timestamptz not null default now(),
  unique (task_id, number)
);

-- task_id é repetido nas tabelas abaixo só para a RLS ficar simples; um gatilho garante que bate com o da versão.
create table public.content_media (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references public.content_versions (id) on delete cascade,
  task_id uuid not null references public.content_posts (task_id) on delete cascade,
  position integer not null default 0,
  kind text not null check (kind in ('imagem', 'video')),
  r2_key text not null,
  original_name text not null,
  size_bytes bigint not null check (size_bytes > 0)
);
create index content_media_version_idx on public.content_media (version_id);

create table public.content_responses (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null unique references public.content_versions (id) on delete cascade,
  task_id uuid not null references public.content_posts (task_id) on delete cascade,
  decision text not null check (decision in ('aprovado', 'ajuste')),
  comment text not null default '',
  responder_name text not null check (btrim(responder_name) <> ''),
  created_at timestamptz not null default now()
);

-- 3) Integridade: task_id coerente com a versão, e versão respondida congelada.
create function public.checar_task_da_versao() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.task_id is distinct from (select task_id from content_versions where id = new.version_id) then
    raise exception 'O task_id precisa ser o da tarefa da versão';
  end if;
  return new;
end $$;
create trigger content_media_task before insert or update on public.content_media
  for each row execute function public.checar_task_da_versao();
create trigger content_responses_task before insert or update on public.content_responses
  for each row execute function public.checar_task_da_versao();

create function public.congelar_versao_respondida() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if exists (select 1 from content_responses where version_id = old.id) then
    raise exception 'Versão congelada: o cliente já respondeu a esta versão';
  end if;
  return coalesce(new, old);
end $$;
create trigger content_versions_congelar before update or delete on public.content_versions
  for each row execute function public.congelar_versao_respondida();

create function public.congelar_midia_respondida() returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  versao uuid;
begin
  if tg_op = 'DELETE' then versao := old.version_id; else versao := new.version_id; end if;
  if exists (select 1 from content_responses where version_id = versao) then
    raise exception 'Versão congelada: o cliente já respondeu a esta versão';
  end if;
  return coalesce(new, old);
end $$;
create trigger content_media_congelar before insert or update or delete on public.content_media
  for each row execute function public.congelar_midia_respondida();

-- 4) RLS: equipe com acesso à tarefa lê e escreve. Respostas só entram pela service role (sem policy de insert).
alter table public.content_posts enable row level security;
alter table public.content_versions enable row level security;
alter table public.content_media enable row level security;
alter table public.content_responses enable row level security;

create policy content_posts_all on public.content_posts for all to authenticated
  using (is_team() and can_read_task(task_id)) with check (is_team() and can_read_task(task_id));
create policy content_versions_all on public.content_versions for all to authenticated
  using (is_team() and can_read_task(task_id)) with check (is_team() and can_read_task(task_id));
create policy content_media_all on public.content_media for all to authenticated
  using (is_team() and can_read_task(task_id)) with check (is_team() and can_read_task(task_id));
create policy content_responses_select on public.content_responses for select to authenticated
  using (is_team() and can_read_task(task_id));

-- 5) Cria o post de uma vez: tarefa + post em rascunho + versão 1 + quem criou como responsável.
-- security invoker: vale a RLS de quem chama. A posição é uma chave válida do fractional-indexing, crescente no tempo.
create function public.criar_post_conteudo(p_list uuid, p_client uuid, p_title text, p_format text, p_date date)
returns uuid
language plpgsql security invoker set search_path = public
as $$
declare
  tarefa uuid;
begin
  if not exists (select 1 from lists where id = p_list and kind = 'conteudo') then
    raise exception 'Esta lista não é de conteúdo';
  end if;
  insert into tasks (list_id, client_id, title, due_date, position)
  values (p_list, p_client, p_title, p_date, 'a1' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISSUS') || '1')
  returning id into tarefa;
  insert into task_assignees (task_id, user_id) values (tarefa, auth.uid());
  insert into content_posts (task_id, format) values (tarefa, p_format);
  insert into content_versions (task_id, number) values (tarefa, 1);
  return tarefa;
end $$;
revoke execute on function public.criar_post_conteudo(uuid, uuid, text, text, date) from public, anon;
grant execute on function public.criar_post_conteudo(uuid, uuid, text, text, date) to authenticated, service_role;

-- 6) Regras de versão e de mídia no banco (testáveis e iguais para qualquer cliente que chame).
-- Salva o texto do post. Rascunho e aguardando editam a versão atual; depois da resposta do cliente
-- (aprovado/ajuste) a versão está congelada, então nasce a versão N+1 e o post volta a aguardar.
create function public.salvar_texto_conteudo(p_task uuid, p_idea text, p_objective text, p_caption text)
returns integer
language plpgsql security invoker set search_path = public
as $$
declare
  post content_posts%rowtype;
begin
  select * into post from content_posts where task_id = p_task for update;
  if not found then raise exception 'Post não encontrado'; end if;
  if post.approval in ('aprovado', 'ajuste') then
    insert into content_versions (task_id, number, idea, objective, caption)
    values (p_task, post.current_version + 1, p_idea, p_objective, p_caption);
    update content_posts set current_version = post.current_version + 1, approval = 'aguardando' where task_id = p_task;
    return post.current_version + 1;
  end if;
  update content_versions set idea = p_idea, objective = p_objective, caption = p_caption
  where task_id = p_task and number = post.current_version;
  return post.current_version;
end $$;

-- Registra uma mídia já enviada ao R2 na versão atual. A chave precisa ser desta tarefa.
create function public.registrar_midia_conteudo(p_task uuid, p_key text, p_kind text, p_name text, p_size bigint)
returns uuid
language plpgsql security invoker set search_path = public
as $$
declare
  versao uuid;
  nova uuid;
begin
  if p_key !~ ('^conteudo/' || p_task::text || '/[0-9a-f-]{36}\.(jpg|png|webp|mp4|mov)$') then
    raise exception 'Chave de mídia inválida para este post';
  end if;
  select v.id into versao from content_versions v join content_posts p on p.task_id = v.task_id and p.current_version = v.number where v.task_id = p_task;
  if versao is null then raise exception 'Post não encontrado'; end if;
  insert into content_media (version_id, task_id, position, kind, r2_key, original_name, size_bytes)
  values (versao, p_task, coalesce((select max(position) + 1 from content_media where version_id = versao), 0), p_kind, p_key, p_name, p_size)
  returning id into nova;
  return nova;
end $$;

revoke execute on function public.salvar_texto_conteudo(uuid, text, text, text) from public, anon;
revoke execute on function public.registrar_midia_conteudo(uuid, text, text, text, bigint) from public, anon;
grant execute on function public.salvar_texto_conteudo(uuid, text, text, text) to authenticated, service_role;
grant execute on function public.registrar_midia_conteudo(uuid, text, text, text, bigint) to authenticated, service_role;
