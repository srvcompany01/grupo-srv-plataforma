-- Visualizações da lista (como no ClickUp): cada lista tem as suas abas, e pode ter várias do mesmo tipo
-- (ex.: duas Listas com filtros diferentes, mais um Quadro e um Calendário). Cada aba guarda os próprios filtros,
-- agrupamento e colunas em `params` (query string normalizada, igual à "visualização salva").
-- Pública = toda a equipe que lê a lista vê; privada = só quem criou. Criar: quem lê a lista. Editar/excluir: quem criou ou quem gerencia a lista.

create table public.list_views (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.lists (id) on delete cascade,
  kind text not null check (kind in ('lista', 'kanban', 'calendario', 'tabela', 'galeria', 'cronograma', 'carga', 'atividade', 'painel', 'documentos')),
  name text not null check (length(btrim(name)) between 1 and 60),
  params text not null default '' check (length(params) <= 4000),
  is_private boolean not null default false,
  pinned boolean not null default true,
  position integer not null default 0,
  created_by uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  created_at timestamptz not null default now()
);
create index list_views_list on public.list_views (list_id, position);

alter table public.list_views enable row level security;

create policy list_views_ler on public.list_views for select to authenticated
  using (is_team() and can_read_list(list_id) and (not is_private or created_by = auth.uid()));
create policy list_views_criar on public.list_views for insert to authenticated
  with check (is_team() and can_read_list(list_id) and created_by = auth.uid());
create policy list_views_editar on public.list_views for update to authenticated
  using (is_team() and can_read_list(list_id) and (created_by = auth.uid() or can_manage_list(list_id)))
  with check (is_team() and can_read_list(list_id) and (created_by = auth.uid() or can_manage_list(list_id)));
create policy list_views_excluir on public.list_views for delete to authenticated
  using (is_team() and can_read_list(list_id) and (created_by = auth.uid() or can_manage_list(list_id)));
