-- Agenda: categorias (como as "agendas" do Google): cada compromisso tem no máximo uma, e a cor dela pinta o compromisso.
-- Da equipe toda, como as tags: qualquer pessoa da equipe cria; quem criou (ou o admin) muda e apaga.

create table public.agenda_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 1 and 40),
  color text not null default '#3b82f6' check (color ~ '^#[0-9a-fA-F]{6}$'),
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
create unique index agenda_categories_nome_idx on public.agenda_categories (lower(btrim(name)));

alter table public.agenda_categories enable row level security;
create policy agenda_categories_select on public.agenda_categories for select to authenticated using (is_team());
create policy agenda_categories_insert on public.agenda_categories for insert to authenticated with check (is_team() and created_by = auth.uid());
create policy agenda_categories_update on public.agenda_categories for update to authenticated
  using (is_team() and (created_by = auth.uid() or is_admin())) with check (is_team());
create policy agenda_categories_delete on public.agenda_categories for delete to authenticated using (is_team() and (created_by = auth.uid() or is_admin()));

alter table public.agenda_events add column category_id uuid references public.agenda_categories (id) on delete set null;
create index agenda_events_categoria_idx on public.agenda_events (category_id) where category_id is not null;
