-- Galeria de clientes: capa (imagem do Unsplash ou enviada) e campos personalizados exibidos no cartão.

-- cover_url: URL https externa (Unsplash) ou chave no R2 ("clientes/<id>/<uuid>.<ext>").
alter table public.clients
  add column cover_url text,
  add column cover_credit text;

-- Definição dos campos (globais, iguais para todos os clientes). show_on_card controla a galeria.
create table public.client_fields (
  id uuid primary key default gen_random_uuid(),
  name text not null check (btrim(name) <> '' and char_length(name) <= 60),
  kind text not null default 'texto' check (kind in ('texto', 'numero', 'data', 'link')),
  show_on_card boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.client_field_values (
  client_id uuid not null references public.clients (id) on delete cascade,
  field_id uuid not null references public.client_fields (id) on delete cascade,
  value text not null check (char_length(value) <= 500),
  primary key (client_id, field_id)
);
create index client_field_values_field_idx on public.client_field_values (field_id);

alter table public.client_fields enable row level security;
alter table public.client_field_values enable row level security;

create policy client_fields_select on public.client_fields for select to authenticated using (is_team());
create policy client_fields_insert on public.client_fields for insert to authenticated with check (is_admin());
create policy client_fields_update on public.client_fields for update to authenticated
  using (is_admin()) with check (is_admin());
create policy client_fields_delete on public.client_fields for delete to authenticated using (is_admin());

create policy client_field_values_select on public.client_field_values for select to authenticated using (is_team());
create policy client_field_values_insert on public.client_field_values for insert to authenticated
  with check (my_role() in ('admin', 'gestor'));
create policy client_field_values_update on public.client_field_values for update to authenticated
  using (my_role() in ('admin', 'gestor')) with check (my_role() in ('admin', 'gestor'));
create policy client_field_values_delete on public.client_field_values for delete to authenticated
  using (my_role() in ('admin', 'gestor'));
