-- Visualização salva: cada pessoa guarda, por lista, como quer ver a lista (tipo de visão, agrupamento e filtros).
-- `params` é a query string normalizada (ex.: "visao=kanban&grupo=mes"). Vazio nunca é gravado: voltar ao original apaga a linha.
-- Só a própria pessoa lê e escreve a sua; ninguém vê a visualização de outra.

create table public.saved_views (
  user_id uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  list_id uuid not null references public.lists (id) on delete cascade,
  params text not null check (params <> '' and length(params) <= 2000),
  updated_at timestamptz not null default now(),
  primary key (user_id, list_id)
);

alter table public.saved_views enable row level security;
create policy saved_views_dono on public.saved_views for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and is_team() and can_read_list(list_id));
