-- Filtros salvos: cada pessoa guarda, por lista, combinações de filtro com nome (query string só dos campos de filtro).
-- Só a própria pessoa lê e escreve os seus.

create table public.saved_filters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  list_id uuid not null references public.lists (id) on delete cascade,
  name text not null check (length(btrim(name)) between 1 and 60),
  params text not null check (params <> '' and length(params) <= 2000),
  created_at timestamptz not null default now()
);
create index saved_filters_user_list on public.saved_filters (user_id, list_id);

alter table public.saved_filters enable row level security;
create policy saved_filters_dono on public.saved_filters for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and is_team() and can_read_list(list_id));
