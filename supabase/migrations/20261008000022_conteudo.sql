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
