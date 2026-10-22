-- Chat da equipe: canais (públicos para a equipe toda ou privados com membros), mensagens com respostas em tópico,
-- anexos no R2 (chat/<canal>/...), menções que viram aviso no sino e marca de leitura por pessoa.

create table public.chat_channels (
  id uuid primary key default gen_random_uuid(),
  name text not null check (name ~ '^[a-z0-9][a-z0-9-]{0,39}$'),
  description text not null default '' check (length(description) <= 300),
  is_private boolean not null default false,
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  archived_at timestamptz
);
create unique index chat_channels_nome_idx on public.chat_channels (name) where archived_at is null;

create table public.chat_members (
  channel_id uuid not null references public.chat_channels (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (channel_id, user_id)
);
create index chat_members_usuario_idx on public.chat_members (user_id);

-- Público: a equipe toda. Privado: só os membros (e quem criou).
create function public.can_read_chat(ch uuid) returns boolean
language sql stable security definer set search_path = public
as $$
  select is_team() and exists (
    select 1 from chat_channels c
    where c.id = ch and (not c.is_private or c.created_by = auth.uid()
      or exists (select 1 from chat_members m where m.channel_id = ch and m.user_id = auth.uid()))
  )
$$;

create function public.can_manage_chat(ch uuid) returns boolean
language sql stable security definer set search_path = public
as $$ select is_team() and exists (select 1 from chat_channels c where c.id = ch and (c.created_by = auth.uid() or is_admin())) $$;

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.chat_channels (id) on delete cascade,
  parent_id uuid references public.chat_messages (id) on delete cascade,
  author_id uuid not null references public.profiles (id) default auth.uid(),
  body text not null default '' check (length(body) <= 8000),
  created_at timestamptz not null default now(),
  edited_at timestamptz
);
create index chat_messages_canal_idx on public.chat_messages (channel_id, created_at desc);
create index chat_messages_pai_idx on public.chat_messages (parent_id) where parent_id is not null;

-- Resposta só a uma mensagem principal do mesmo canal (tópico de um nível, como no Slack).
create function public.validar_mensagem_chat() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.parent_id is not null and not exists (
    select 1 from chat_messages p where p.id = new.parent_id and p.channel_id = new.channel_id and p.parent_id is null
  ) then
    raise exception 'Resposta inválida para este canal.' using errcode = 'P0001';
  end if;
  if tg_op = 'UPDATE' then
    if new.channel_id <> old.channel_id or new.parent_id is distinct from old.parent_id or new.author_id <> old.author_id or new.created_at <> old.created_at then
      raise exception 'Só o texto da mensagem pode mudar.' using errcode = 'P0001';
    end if;
    new.edited_at := now();
  end if;
  return new;
end $$;
create trigger validar_mensagem_chat before insert or update on public.chat_messages for each row execute function public.validar_mensagem_chat();

create table public.chat_attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.chat_messages (id) on delete cascade,
  channel_id uuid not null references public.chat_channels (id) on delete cascade,
  r2_key text not null unique,
  file_name text not null check (btrim(file_name) <> ''),
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 524288000),
  created_by uuid not null references public.profiles (id) default auth.uid(),
  created_at timestamptz not null default now(),
  check (r2_key like 'chat/' || channel_id::text || '/%')
);
create index chat_attachments_mensagem_idx on public.chat_attachments (message_id);

create table public.chat_mentions (
  message_id uuid not null references public.chat_messages (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  primary key (message_id, user_id)
);

-- Aviso no sino: agora também para menção no chat.
alter table public.notifications alter column task_id drop not null;
alter table public.notifications add column chat_message_id uuid references public.chat_messages (id) on delete cascade;
alter table public.notifications drop constraint if exists notifications_kind_check;
alter table public.notifications add constraint notifications_kind_check check (kind in ('mention', 'chat_mention'));
alter table public.notifications add constraint notifications_alvo_check check (task_id is not null or chat_message_id is not null);

-- Avisa quem foi mencionado (se pode ler o canal e não é o próprio autor).
create function public.avisar_mencao_chat() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into notifications (user_id, kind, chat_message_id, actor_id)
  select new.user_id, 'chat_mention', m.id, m.author_id
  from chat_messages m join chat_channels c on c.id = m.channel_id
  join profiles p on p.id = new.user_id and p.active and p.role <> 'cliente'
  where m.id = new.message_id and m.author_id <> new.user_id
    and (not c.is_private or c.created_by = new.user_id or exists (select 1 from chat_members x where x.channel_id = c.id and x.user_id = new.user_id));
  return null;
end $$;
create trigger avisar_mencao_chat after insert on public.chat_mentions for each row execute function public.avisar_mencao_chat();

-- Marca o canal como lido por quem está vendo (cria a linha de leitura nos canais públicos).
create function public.marcar_chat_lido(p_canal uuid) returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not can_read_chat(p_canal) then raise exception 'Sem acesso ao canal.' using errcode = '42501'; end if;
  insert into chat_members (channel_id, user_id, last_read_at) values (p_canal, auth.uid(), now())
  on conflict (channel_id, user_id) do update set last_read_at = now();
end $$;

-- Mensagens de outras pessoas depois da última leitura, por canal (canal nunca aberto: últimos 7 dias).
create function public.chat_nao_lidas() returns table (channel_id uuid, nao_lidas bigint)
language sql stable security definer set search_path = public
as $$
  select c.id, count(m.id)
  from chat_channels c
  left join chat_members r on r.channel_id = c.id and r.user_id = auth.uid()
  join chat_messages m on m.channel_id = c.id and m.author_id <> auth.uid()
    and m.created_at > coalesce(r.last_read_at, now() - interval '7 days')
  where c.archived_at is null and can_read_chat(c.id)
  group by c.id
$$;

alter table public.chat_channels enable row level security;
create policy chat_channels_select on public.chat_channels for select to authenticated using (can_read_chat(id) or (is_team() and created_by = auth.uid()));
create policy chat_channels_insert on public.chat_channels for insert to authenticated with check (is_team() and created_by = auth.uid());
create policy chat_channels_update on public.chat_channels for update to authenticated using (can_manage_chat(id)) with check (is_team());

alter table public.chat_members enable row level security;
create policy chat_members_select on public.chat_members for select to authenticated using (can_read_chat(channel_id));
create policy chat_members_insert on public.chat_members for insert to authenticated with check (can_manage_chat(channel_id));
create policy chat_members_delete on public.chat_members for delete to authenticated using (user_id = auth.uid() or can_manage_chat(channel_id));

alter table public.chat_messages enable row level security;
create policy chat_messages_select on public.chat_messages for select to authenticated using (can_read_chat(channel_id));
create policy chat_messages_insert on public.chat_messages for insert to authenticated with check (author_id = auth.uid() and can_read_chat(channel_id));
create policy chat_messages_update on public.chat_messages for update to authenticated using (author_id = auth.uid() and can_read_chat(channel_id)) with check (author_id = auth.uid());
create policy chat_messages_delete on public.chat_messages for delete to authenticated using (can_read_chat(channel_id) and (author_id = auth.uid() or is_admin()));

alter table public.chat_attachments enable row level security;
create policy chat_attachments_select on public.chat_attachments for select to authenticated using (can_read_chat(channel_id));
create policy chat_attachments_insert on public.chat_attachments for insert to authenticated
  with check (created_by = auth.uid() and exists (select 1 from chat_messages m where m.id = message_id and m.channel_id = chat_attachments.channel_id and m.author_id = auth.uid()));

alter table public.chat_mentions enable row level security;
create policy chat_mentions_select on public.chat_mentions for select to authenticated
  using (exists (select 1 from chat_messages m where m.id = message_id and can_read_chat(m.channel_id)));
create policy chat_mentions_insert on public.chat_mentions for insert to authenticated
  with check (exists (select 1 from chat_messages m where m.id = message_id and m.author_id = auth.uid()));

insert into public.chat_channels (name, description, created_by) values ('geral', 'Conversa da equipe toda', null);

do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.chat_messages;
  end if;
end $$;
