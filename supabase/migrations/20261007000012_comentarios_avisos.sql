-- Comentários com @menções (que geram avisos no sino) e anexos guardados no R2.

-- ============================================================ acesso de outra pessoa

-- Mesma regra de can_read_task, mas para p_user (quem será mencionado), não para quem está logado.
create function public.usuario_le_tarefa(p_user uuid, p_task uuid) returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from tasks t
    join profiles p on p.id = p_user and p.active and p.role in ('admin', 'gestor', 'membro')
    where t.id = p_task and (
      p.role = 'admin'
      or list_space(t.list_id) is null
      or exists (
        select 1 from spaces s
        join space_members sm on sm.space_id in (s.id, s.parent_id)
        where s.id = list_space(t.list_id) and sm.user_id = p_user
      )
      or exists (select 1 from task_assignees a where a.task_id = t.id and a.user_id = p_user)
    )
  )
$$;

-- Pessoas que podem ser mencionadas na tarefa (só para quem a enxerga).
create function public.pessoas_da_tarefa(p_task uuid)
returns table (id uuid, full_name text, avatar_url text)
language sql stable security definer set search_path = public
as $$
  select p.id, p.full_name, p.avatar_url
  from profiles p
  where can_read_task(p_task) and usuario_le_tarefa(p.id, p_task)
  order by p.full_name
$$;

-- ============================================================ texto vazio só com anexo

alter table public.comments drop constraint comments_body_check;
alter table public.comments alter column body set default '';

-- ============================================================ tabelas

create table public.comment_mentions (
  comment_id uuid not null references public.comments (id) on delete cascade,
  user_id uuid not null references public.profiles (id),
  primary key (comment_id, user_id)
);
create index comment_mentions_user_idx on public.comment_mentions (user_id);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('mention')),
  task_id uuid not null references public.tasks (id) on delete cascade,
  comment_id uuid references public.comments (id) on delete cascade,
  actor_id uuid references public.profiles (id),
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, read_at);

create table public.comment_attachments (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.comments (id) on delete cascade,
  task_id uuid not null references public.tasks (id) on delete cascade,
  r2_key text not null unique,
  file_name text not null check (btrim(file_name) <> ''),
  mime_type text not null,
  size_bytes bigint not null,
  kind text not null check (kind in ('arquivo', 'audio', 'video')),
  uploaded_by uuid not null references public.profiles (id) default auth.uid(),
  created_at timestamptz not null default now(),
  check (size_bytes > 0 and size_bytes <= case when kind = 'video' then 524288000 else 104857600 end),
  check (r2_key like 'tarefas/' || task_id::text || '/%')
);
create index comment_attachments_comment_idx on public.comment_attachments (comment_id);
create index comment_attachments_task_idx on public.comment_attachments (task_id);

-- ============================================================ regras

create function public.checar_conteudo_comentario() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if exists (select 1 from comments c where c.id = new.id and btrim(c.body) = '')
     and not exists (select 1 from comment_attachments a where a.comment_id = new.id) then
    raise exception 'Escreva um comentário ou anexe um arquivo';
  end if;
  return null;
end $$;

create constraint trigger checar_conteudo_comentario after insert or update of body on public.comments
deferrable initially deferred for each row execute function public.checar_conteudo_comentario();

create function public.validar_mencao() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if not usuario_le_tarefa(new.user_id, (select task_id from comments where id = new.comment_id)) then
    raise exception 'A pessoa mencionada não tem acesso a esta tarefa';
  end if;
  return new;
end $$;

create trigger validar_mencao before insert or update on public.comment_mentions
for each row execute function public.validar_mencao();

create function public.avisar_mencao() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into notifications (user_id, kind, task_id, comment_id, actor_id)
  select new.user_id, 'mention', c.task_id, c.id, c.author_id
  from comments c
  where c.id = new.comment_id and c.author_id <> new.user_id;
  return null;
end $$;

create trigger avisar_mencao after insert on public.comment_mentions
for each row execute function public.avisar_mencao();

-- Do aviso, o dono só muda read_at.
create function public.proteger_aviso() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  new.id := old.id;
  new.user_id := old.user_id;
  new.kind := old.kind;
  new.task_id := old.task_id;
  new.comment_id := old.comment_id;
  new.actor_id := old.actor_id;
  new.created_at := old.created_at;
  return new;
end $$;

create trigger proteger_aviso before update on public.notifications
for each row execute function public.proteger_aviso();

create function public.preparar_anexo() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is not null then
    new.uploaded_by := auth.uid();
  end if;
  if not exists (select 1 from comments where id = new.comment_id and task_id = new.task_id) then
    raise exception 'O anexo precisa ser da mesma tarefa do comentário';
  end if;
  if (select count(*) from comment_attachments where comment_id = new.comment_id) >= 10 then
    raise exception 'Máximo de 10 anexos por comentário';
  end if;
  return new;
end $$;

create trigger preparar_anexo before insert on public.comment_attachments
for each row execute function public.preparar_anexo();

-- ============================================================ RPC (roda como o usuário: RLS vale)

create function public.criar_comentario(
  p_task uuid,
  p_body text,
  p_internal boolean,
  p_mencoes uuid[] default '{}',
  p_anexos jsonb default '[]'
) returns uuid
language plpgsql security invoker set search_path = public
as $$
declare
  novo uuid;
  anexos jsonb := coalesce(p_anexos, '[]'::jsonb);
begin
  if jsonb_array_length(anexos) > 10 then
    raise exception 'Máximo de 10 anexos por comentário';
  end if;
  if btrim(coalesce(p_body, '')) = '' and jsonb_array_length(anexos) = 0 then
    raise exception 'Escreva um comentário ou anexe um arquivo';
  end if;

  insert into comments (task_id, body, is_internal)
  values (p_task, coalesce(p_body, ''), coalesce(p_internal, true))
  returning id into novo;

  insert into comment_mentions (comment_id, user_id)
  select distinct novo, u from unnest(coalesce(p_mencoes, '{}')) u;

  insert into comment_attachments (comment_id, task_id, r2_key, file_name, mime_type, size_bytes, kind)
  select novo, p_task, x.r2_key, x.file_name, x.mime_type, x.size_bytes, x.kind
  from jsonb_to_recordset(anexos) as x(r2_key text, file_name text, mime_type text, size_bytes bigint, kind text);

  return novo;
end $$;

-- ============================================================ RLS

alter table public.comment_mentions enable row level security;
alter table public.notifications enable row level security;
alter table public.comment_attachments enable row level security;

create policy comment_mentions_select on public.comment_mentions for select to authenticated
  using (can_read_task((select c.task_id from comments c where c.id = comment_id)));
create policy comment_mentions_insert on public.comment_mentions for insert to authenticated
  with check (exists (select 1 from comments c where c.id = comment_id and c.author_id = auth.uid()));

create policy notifications_select on public.notifications for select to authenticated
  using (user_id = auth.uid());
create policy notifications_update on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy comment_attachments_select on public.comment_attachments for select to authenticated
  using (can_read_task(task_id));
create policy comment_attachments_insert on public.comment_attachments for insert to authenticated
  with check (
    uploaded_by = auth.uid()
    and exists (select 1 from comments c where c.id = comment_id and c.author_id = auth.uid() and c.task_id = comment_attachments.task_id)
  );
create policy comment_attachments_delete on public.comment_attachments for delete to authenticated
  using (exists (select 1 from comments c where c.id = comment_id and c.author_id = auth.uid()));

-- Sino em tempo real (a publicação só existe no Supabase de verdade).
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;

revoke execute on function public.usuario_le_tarefa(uuid, uuid) from public, anon;
revoke execute on function public.pessoas_da_tarefa(uuid) from public, anon;
revoke execute on function public.criar_comentario(uuid, text, boolean, uuid[], jsonb) from public, anon;
revoke execute on function public.checar_conteudo_comentario() from public, anon;
revoke execute on function public.validar_mencao() from public, anon;
revoke execute on function public.avisar_mencao() from public, anon;
revoke execute on function public.proteger_aviso() from public, anon;
revoke execute on function public.preparar_anexo() from public, anon;
grant execute on function public.usuario_le_tarefa(uuid, uuid) to authenticated, service_role;
grant execute on function public.pessoas_da_tarefa(uuid) to authenticated, service_role;
grant execute on function public.criar_comentario(uuid, text, boolean, uuid[], jsonb) to authenticated, service_role;
