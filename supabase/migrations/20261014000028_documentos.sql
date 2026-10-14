-- Documentos: textos da equipe (e, se liberado, do cliente) com páginas aninhadas e edição simultânea.
--  * visibility: 'team' (equipe toda), 'private' (só o dono) ou 'people' (dono + pessoas escolhidas em document_members).
--  * client_id liga o documento a um cliente; client_visible libera a leitura para o login desse cliente.
--  * document_lists liga o documento a listas (criado dentro da lista ou vinculado depois); todos aparecem no hub.
--  * Edição simultânea (Yjs): cada alteração vira uma linha em document_updates (o Realtime entrega aos outros);
--    de tempos em tempos o editor grava o estado inteiro em document_pages.ydoc e apaga as linhas antigas.

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'Documento sem título' check (btrim(title) <> '' and length(title) <= 200),
  icon text check (length(icon) <= 40),
  owner_id uuid not null references public.profiles (id) default auth.uid(),
  visibility text not null default 'team' check (visibility in ('team', 'private', 'people')),
  client_id uuid references public.clients (id),
  client_visible boolean not null default false,
  is_wiki boolean not null default false,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (not client_visible or client_id is not null)
);
create index documents_client_idx on public.documents (client_id) where client_id is not null;
create index documents_owner_idx on public.documents (owner_id);

create table public.document_members (
  document_id uuid not null references public.documents (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  can_edit boolean not null default false,
  primary key (document_id, user_id)
);
create index document_members_user_idx on public.document_members (user_id);

create table public.document_lists (
  document_id uuid not null references public.documents (id) on delete cascade,
  list_id uuid not null references public.lists (id) on delete cascade,
  created_by uuid references public.profiles (id) default auth.uid(),
  created_at timestamptz not null default now(),
  primary key (document_id, list_id)
);
create index document_lists_list_idx on public.document_lists (list_id);

create table public.document_pages (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents (id) on delete cascade,
  parent_id uuid references public.document_pages (id) on delete cascade,
  title text not null default '' check (length(title) <= 200),
  icon text check (length(icon) <= 40),
  position text not null default 'a0',
  content jsonb,
  ydoc text,
  base_update bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index document_pages_doc_idx on public.document_pages (document_id, position);

create table public.document_updates (
  id bigint generated always as identity primary key,
  page_id uuid not null references public.document_pages (id) on delete cascade,
  data text not null check (length(data) <= 1000000),
  created_by uuid references public.profiles (id) default auth.uid(),
  created_at timestamptz not null default now()
);
create index document_updates_page_idx on public.document_updates (page_id, id);

create table public.document_favorites (
  user_id uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  document_id uuid not null references public.documents (id) on delete cascade,
  primary key (user_id, document_id)
);

create table public.document_views (
  user_id uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  document_id uuid not null references public.documents (id) on delete cascade,
  viewed_at timestamptz not null default now(),
  primary key (user_id, document_id)
);

create table public.document_versions (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.document_pages (id) on delete cascade,
  title text not null default '',
  content jsonb,
  ydoc text,
  created_by uuid references public.profiles (id) default auth.uid(),
  created_at timestamptz not null default now()
);
create index document_versions_page_idx on public.document_versions (page_id, created_at desc);

create table public.document_comments (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.document_pages (id) on delete cascade,
  author_id uuid not null references public.profiles (id) default auth.uid(),
  body text not null check (btrim(body) <> '' and length(body) <= 5000),
  quote text check (length(quote) <= 500),
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);
create index document_comments_page_idx on public.document_comments (page_id, created_at);

-- ============================================================ acesso
-- security definer: leem sem passar pela RLS (evita recursão). Admin enxerga tudo, menos o que é privado de outra pessoa.

create function public.can_read_document(doc uuid) returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from documents d where d.id = doc and (
      (is_team() and (
        d.owner_id = auth.uid()
        or (d.visibility = 'team')
        or (is_admin() and d.visibility <> 'private')
        or exists (select 1 from document_members m where m.document_id = d.id and m.user_id = auth.uid())
      ))
      or (my_role() = 'cliente' and d.client_visible and d.archived_at is null and d.client_id = my_client_id())
    )
  )
$$;

create function public.can_edit_document(doc uuid) returns boolean
language sql stable security definer set search_path = public
as $$
  select is_team() and exists (
    select 1 from documents d where d.id = doc and (
      d.owner_id = auth.uid()
      or d.visibility = 'team'
      or (is_admin() and d.visibility <> 'private')
      or exists (select 1 from document_members m where m.document_id = d.id and m.user_id = auth.uid() and m.can_edit)
    )
  )
$$;

-- Gerir (visibilidade, pessoas, cliente, excluir): dono, ou admin quando não é privado.
create function public.can_manage_document(doc uuid) returns boolean
language sql stable security definer set search_path = public
as $$
  select is_team() and exists (
    select 1 from documents d where d.id = doc and (d.owner_id = auth.uid() or (is_admin() and d.visibility <> 'private'))
  )
$$;

create function public.page_document(page uuid) returns uuid
language sql stable security definer set search_path = public
as $$ select document_id from document_pages where id = page $$;

-- ============================================================ gatilhos
create function public.documentos_tocar() returns trigger
language plpgsql as $$
begin new.updated_at := now(); return new; end $$;
create trigger documents_tocar before update on public.documents for each row execute function public.documentos_tocar();
create trigger document_pages_tocar before update on public.document_pages for each row execute function public.documentos_tocar();

-- Só quem gerencia muda dono, visibilidade, cliente e wiki; editores mudam título, ícone e arquivamento.
create function public.proteger_documento() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if (new.owner_id, new.visibility, new.client_id, new.client_visible, new.is_wiki)
     is distinct from (old.owner_id, old.visibility, old.client_id, old.client_visible, old.is_wiki)
     and auth.uid() is not null and not can_manage_document(old.id) then
    raise exception 'Só o dono do documento muda quem pode ver';
  end if;
  return new;
end $$;
create trigger documents_proteger before update on public.documents for each row execute function public.proteger_documento();

-- A página-mãe precisa ser do mesmo documento (e não pode ser ela mesma).
create function public.validar_pagina() returns trigger
language plpgsql as $$
begin
  if new.parent_id is not null and (
    new.parent_id = new.id
    or not exists (select 1 from document_pages p where p.id = new.parent_id and p.document_id = new.document_id)
  ) then
    raise exception 'A página-mãe precisa ser do mesmo documento';
  end if;
  return new;
end $$;
create trigger document_pages_validar before insert or update of parent_id, document_id on public.document_pages
  for each row execute function public.validar_pagina();

-- ============================================================ RLS
alter table public.documents enable row level security;
alter table public.document_members enable row level security;
alter table public.document_lists enable row level security;
alter table public.document_pages enable row level security;
alter table public.document_updates enable row level security;
alter table public.document_favorites enable row level security;
alter table public.document_views enable row level security;
alter table public.document_versions enable row level security;
alter table public.document_comments enable row level security;

-- owner_id = auth.uid(): no INSERT ... RETURNING a função não enxerga a linha recém-criada, então o dono precisa passar direto.
create policy documents_select on public.documents for select to authenticated using (can_read_document(id) or (is_team() and owner_id = auth.uid()));
create policy documents_insert on public.documents for insert to authenticated
  with check (is_team() and owner_id = auth.uid());
create policy documents_update on public.documents for update to authenticated
  using (can_edit_document(id)) with check (can_edit_document(id) or can_manage_document(id));
create policy documents_delete on public.documents for delete to authenticated using (can_manage_document(id));

create policy document_members_select on public.document_members for select to authenticated
  using (is_team() and can_read_document(document_id));
create policy document_members_write on public.document_members for all to authenticated
  using (can_manage_document(document_id)) with check (can_manage_document(document_id));

create policy document_lists_select on public.document_lists for select to authenticated
  using (is_team() and can_read_document(document_id) and can_read_list(list_id));
create policy document_lists_insert on public.document_lists for insert to authenticated
  with check (can_edit_document(document_id) and can_read_list(list_id));
create policy document_lists_delete on public.document_lists for delete to authenticated
  using (can_edit_document(document_id) and can_read_list(list_id));

create policy document_pages_select on public.document_pages for select to authenticated using (can_read_document(document_id));
create policy document_pages_insert on public.document_pages for insert to authenticated with check (can_edit_document(document_id));
create policy document_pages_update on public.document_pages for update to authenticated
  using (can_edit_document(document_id)) with check (can_edit_document(document_id));
create policy document_pages_delete on public.document_pages for delete to authenticated using (can_edit_document(document_id));

create policy document_updates_select on public.document_updates for select to authenticated
  using (is_team() and can_read_document(page_document(page_id)));
create policy document_updates_insert on public.document_updates for insert to authenticated
  with check (created_by = auth.uid() and can_edit_document(page_document(page_id)));
create policy document_updates_delete on public.document_updates for delete to authenticated
  using (can_edit_document(page_document(page_id)) and created_at < now() - interval '2 minutes');

create policy document_favorites_dono on public.document_favorites for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid() and is_team() and can_read_document(document_id));
create policy document_views_dono on public.document_views for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid() and is_team() and can_read_document(document_id));

create policy document_versions_select on public.document_versions for select to authenticated
  using (is_team() and can_read_document(page_document(page_id)));
create policy document_versions_insert on public.document_versions for insert to authenticated
  with check (created_by = auth.uid() and can_edit_document(page_document(page_id)));

create policy document_comments_select on public.document_comments for select to authenticated
  using (is_team() and can_read_document(page_document(page_id)));
create policy document_comments_insert on public.document_comments for insert to authenticated
  with check (author_id = auth.uid() and is_team() and can_read_document(page_document(page_id)));
create policy document_comments_update on public.document_comments for update to authenticated
  using (is_team() and can_read_document(page_document(page_id)))
  with check (is_team() and can_read_document(page_document(page_id)));
create policy document_comments_delete on public.document_comments for delete to authenticated
  using (author_id = auth.uid() or can_manage_document(page_document(page_id)));

-- Os outros editores recebem as alterações pelo Realtime (a RLS acima vale para quem escuta).
do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.document_updates;
  end if;
end $$;
