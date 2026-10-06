-- Pastas, listas e status de cada lista.

create table public.folders (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id),
  name text not null check (btrim(name) <> ''),
  position text collate "C" not null,
  archived_at timestamptz,
  created_at timestamptz not null default now()
);
create index folders_space_idx on public.folders (space_id);

create table public.lists (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id),
  folder_id uuid references public.folders (id),
  client_id uuid not null references public.clients (id),
  name text not null check (btrim(name) <> ''),
  reference_month date check (extract(day from reference_month) = 1),
  position text collate "C" not null,
  archived_at timestamptz,
  created_at timestamptz not null default now()
);
create index lists_space_idx on public.lists (space_id);
create index lists_folder_idx on public.lists (folder_id);
create index lists_client_idx on public.lists (client_id);

create table public.list_statuses (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.lists (id) on delete cascade,
  name text not null check (btrim(name) <> ''),
  color text not null default '#87909e',
  category text not null check (category in ('todo', 'in_progress', 'done')),
  approval_state text check (approval_state in ('aguardando', 'aprovado', 'ajuste')),
  position text collate "C" not null,
  created_at timestamptz not null default now()
);
create index list_statuses_list_idx on public.list_statuses (list_id);

-- ============================================================ funções de acesso

create function public.list_space(list uuid) returns uuid
language sql stable security definer set search_path = public
as $$ select space_id from lists where id = list $$;

-- Ampliada na migração de tarefas (responsáveis também enxergam a lista).
create function public.can_read_list(list uuid) returns boolean
language sql stable security definer set search_path = public
as $$ select is_space_member(list_space(list)) $$;

-- ============================================================ gatilhos

create function public.validar_lista() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.folder_id is not null
     and not exists (select 1 from folders where id = new.folder_id and space_id = new.space_id) then
    raise exception 'A pasta precisa ser do mesmo departamento da lista';
  end if;
  return new;
end $$;

create trigger validar_lista before insert or update of folder_id, space_id on public.lists
for each row execute function public.validar_lista();

create function public.criar_status_padrao() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into list_statuses (list_id, name, color, category, position) values
    (new.id, 'A fazer', '#87909e', 'todo', 'a0'),
    (new.id, 'Em andamento', '#5b8def', 'in_progress', 'a1'),
    (new.id, 'Concluído', '#2fa36b', 'done', 'a2');
  return new;
end $$;

create trigger criar_status_padrao after insert on public.lists
for each row execute function public.criar_status_padrao();

-- Toda lista mantém ao menos um status "a fazer" e um "concluído".
create function public.proteger_status_essenciais() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  -- A lista inteira está sendo apagada: nada a proteger.
  if not exists (select 1 from lists where id = old.list_id) then
    return coalesce(new, old);
  end if;
  if old.category in ('todo', 'done')
     and (tg_op = 'DELETE' or new.category <> old.category or new.list_id <> old.list_id)
     and not exists (
       select 1 from list_statuses
       where list_id = old.list_id and category = old.category and id <> old.id
     ) then
    raise exception 'A lista precisa de pelo menos um status "a fazer" e um "concluído"';
  end if;
  return coalesce(new, old);
end $$;

create trigger proteger_status_essenciais before update or delete on public.list_statuses
for each row execute function public.proteger_status_essenciais();

-- ============================================================ RLS

alter table public.folders enable row level security;
alter table public.lists enable row level security;
alter table public.list_statuses enable row level security;

create policy folders_select on public.folders for select to authenticated using (is_space_member(space_id));
create policy folders_insert on public.folders for insert to authenticated with check (is_space_manager(space_id));
create policy folders_update on public.folders for update to authenticated
  using (is_space_manager(space_id)) with check (is_space_manager(space_id));

create policy lists_select on public.lists for select to authenticated using (can_read_list(id));
create policy lists_insert on public.lists for insert to authenticated with check (is_space_manager(space_id));
create policy lists_update on public.lists for update to authenticated
  using (is_space_manager(space_id)) with check (is_space_manager(space_id));

create policy list_statuses_select on public.list_statuses for select to authenticated
  using (can_read_list(list_id));
create policy list_statuses_insert on public.list_statuses for insert to authenticated
  with check (is_space_manager(list_space(list_id)));
create policy list_statuses_update on public.list_statuses for update to authenticated
  using (is_space_manager(list_space(list_id))) with check (is_space_manager(list_space(list_id)));
create policy list_statuses_delete on public.list_statuses for delete to authenticated
  using (is_space_manager(list_space(list_id)));
