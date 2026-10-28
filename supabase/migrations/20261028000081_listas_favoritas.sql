-- Favoritos: cada pessoa marca suas listas com a estrela (cabeçalho da lista) e as vê em "Favoritos" na barra lateral.
-- Só a própria pessoa lê e escreve os seus.

create table public.list_favorites (
  user_id uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  list_id uuid not null references public.lists (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, list_id)
);

alter table public.list_favorites enable row level security;
create policy list_favorites_dono on public.list_favorites for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and is_team() and can_read_list(list_id));
