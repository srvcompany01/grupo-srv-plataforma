-- Identidade, departamentos (espaços) e clientes.
-- Toda proteção é feita por RLS: o Supabase concede acesso às tabelas para anon/authenticated.

-- ============================================================ tabelas

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  avatar_url text,
  role text not null default 'cliente' check (role in ('admin', 'gestor', 'membro', 'cliente')),
  active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.spaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (btrim(name) <> ''),
  color text not null default '#7b68ee',
  position text collate "C" not null,
  parent_id uuid references public.spaces (id),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  check (parent_id is distinct from id)
);
create index spaces_parent_idx on public.spaces (parent_id);

create table public.space_members (
  space_id uuid not null references public.spaces (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'membro' check (role in ('gestor', 'membro')),
  created_at timestamptz not null default now(),
  primary key (space_id, user_id)
);
create index space_members_user_idx on public.space_members (user_id);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null check (btrim(name) <> ''),
  legal_name text,
  document text,
  email text,
  phone text,
  status text not null default 'ativo' check (status in ('ativo', 'pausado', 'encerrado')),
  is_internal boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index clients_um_interno_idx on public.clients (is_internal) where is_internal;

create table public.client_users (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  client_id uuid not null references public.clients (id),
  created_at timestamptz not null default now()
);
create index client_users_client_idx on public.client_users (client_id);

-- ============================================================ funções de acesso
-- security definer: leem as tabelas sem passar pela RLS (evita recursão nas políticas).
-- Todas devolvem false/null para usuário inativo ou sem perfil.

create function public.my_role() returns text
language sql stable security definer set search_path = public
as $$ select role from profiles where id = auth.uid() and active $$;

create function public.is_admin() returns boolean
language sql stable security definer set search_path = public
as $$ select coalesce(my_role() = 'admin', false) $$;

create function public.is_team() returns boolean
language sql stable security definer set search_path = public
as $$ select coalesce(my_role() in ('admin', 'gestor', 'membro'), false) $$;

create function public.my_client_id() returns uuid
language sql stable security definer set search_path = public
as $$
  select cu.client_id from client_users cu
  where cu.user_id = auth.uid() and my_role() = 'cliente'
$$;

-- Membro (ou gestor) do espaço ou do seu espaço-pai. Admin conta como membro de tudo.
create function public.is_space_member(space uuid) returns boolean
language sql stable security definer set search_path = public
as $$
  select is_admin() or (is_team() and exists (
    select 1 from spaces s
    join space_members sm on sm.space_id in (s.id, s.parent_id)
    where s.id = space and sm.user_id = auth.uid()
  ))
$$;

create function public.is_space_manager(space uuid) returns boolean
language sql stable security definer set search_path = public
as $$
  select is_admin() or (is_team() and exists (
    select 1 from spaces s
    join space_members sm on sm.space_id in (s.id, s.parent_id)
    where s.id = space and sm.user_id = auth.uid() and sm.role = 'gestor'
  ))
$$;

-- Pode ver o espaço: é membro dele (ou do pai) ou de algum filho (para a barra lateral mostrar o pai).
create function public.can_see_space(space uuid) returns boolean
language sql stable security definer set search_path = public
as $$
  select is_space_member(space) or (is_team() and exists (
    select 1 from spaces filho
    join space_members sm on sm.space_id = filho.id
    where filho.parent_id = space and sm.user_id = auth.uid()
  ))
$$;

-- ============================================================ gatilhos

-- Perfil nasce junto com o usuário do Auth: inativo e sem acesso até quem convidou definir o papel.
create function public.criar_perfil() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into profiles (id, full_name, role, active)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), 'cliente', false);
  return new;
end $$;

create trigger criar_perfil after insert on auth.users
for each row execute function public.criar_perfil();

create function public.proteger_perfil() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if (new.role is distinct from old.role or new.active is distinct from old.active)
     and auth.uid() is not null and not is_admin() then
    raise exception 'Somente administradores alteram papel ou status';
  end if;
  new.updated_at := now();
  return new;
end $$;

create trigger proteger_perfil before update on public.profiles
for each row execute function public.proteger_perfil();

create function public.validar_espaco() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.parent_id is not null then
    if exists (select 1 from spaces where id = new.parent_id and parent_id is not null) then
      raise exception 'Um departamento só pode ter um nível de sub-área';
    end if;
    if exists (select 1 from spaces where parent_id = new.id) then
      raise exception 'Um departamento com sub-áreas não pode virar sub-área';
    end if;
  end if;
  return new;
end $$;

create trigger validar_espaco before insert or update of parent_id on public.spaces
for each row execute function public.validar_espaco();

create function public.exigir_papel_equipe() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if not exists (select 1 from profiles where id = new.user_id and role <> 'cliente') then
    raise exception 'Somente usuários da equipe podem ser adicionados aqui';
  end if;
  return new;
end $$;

create trigger exigir_papel_equipe before insert or update on public.space_members
for each row execute function public.exigir_papel_equipe();

create function public.exigir_papel_cliente() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if not exists (select 1 from profiles where id = new.user_id and role = 'cliente') then
    raise exception 'Somente usuários de cliente podem ser vinculados a um cliente';
  end if;
  return new;
end $$;

create trigger exigir_papel_cliente before insert or update on public.client_users
for each row execute function public.exigir_papel_cliente();

create function public.tocar_updated_at() returns trigger
language plpgsql
as $$ begin new.updated_at := now(); return new; end $$;

create trigger tocar_updated_at before update on public.clients
for each row execute function public.tocar_updated_at();

-- ============================================================ RLS

alter table public.profiles enable row level security;
alter table public.spaces enable row level security;
alter table public.space_members enable row level security;
alter table public.clients enable row level security;
alter table public.client_users enable row level security;

create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or is_team());
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid() or is_admin()) with check (id = auth.uid() or is_admin());

create policy spaces_select on public.spaces for select to authenticated
  using (can_see_space(id));
create policy spaces_insert on public.spaces for insert to authenticated with check (is_admin());
create policy spaces_update on public.spaces for update to authenticated using (is_admin()) with check (is_admin());
create policy spaces_delete on public.spaces for delete to authenticated using (is_admin());

create policy space_members_select on public.space_members for select to authenticated
  using (is_space_member(space_id));
create policy space_members_insert on public.space_members for insert to authenticated
  with check (is_admin() or (role = 'membro' and is_space_manager(space_id)));
create policy space_members_update on public.space_members for update to authenticated
  using (is_admin()) with check (is_admin());
create policy space_members_delete on public.space_members for delete to authenticated
  using (is_admin() or (role = 'membro' and is_space_manager(space_id)));

create policy clients_select on public.clients for select to authenticated
  using (is_team() or id = my_client_id());
create policy clients_insert on public.clients for insert to authenticated
  with check (my_role() in ('admin', 'gestor'));
create policy clients_update on public.clients for update to authenticated
  using (my_role() in ('admin', 'gestor')) with check (my_role() in ('admin', 'gestor'));

create policy client_users_select on public.client_users for select to authenticated
  using (is_admin() or user_id = auth.uid());
create policy client_users_insert on public.client_users for insert to authenticated with check (is_admin());
create policy client_users_update on public.client_users for update to authenticated
  using (is_admin()) with check (is_admin());
create policy client_users_delete on public.client_users for delete to authenticated using (is_admin());

-- ============================================================ dados iniciais (também em produção)

insert into public.spaces (name, color, position) values
  ('Comercial', '#f59e0b', 'a0'),
  ('Financeiro', '#10b981', 'a1'),
  ('Operacional', '#7b68ee', 'a2');

insert into public.spaces (name, color, position, parent_id)
select v.name, v.color, v.position, (select id from public.spaces where name = 'Operacional')
from (values ('Conteúdo', '#ec4899', 'a0'), ('Tráfego', '#3b82f6', 'a1'), ('Onboarding', '#14b8a6', 'a2'))
  as v (name, color, position);

insert into public.clients (name, is_internal) values ('Grupo SRV (Interno)', true);
