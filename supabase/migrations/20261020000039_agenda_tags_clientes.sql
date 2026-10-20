-- Agenda: compromisso vinculado a um cliente (opcional) e tags da agenda.
--  * agenda_tags: tags da equipe toda (nome + cor). Qualquer pessoa da equipe cria; quem criou (ou o admin) muda e apaga.
--  * agenda_event_tags: tags de cada compromisso. Quem vê o compromisso vê as tags; quem edita o compromisso mexe nelas.

alter table public.agenda_events add column client_id uuid references public.clients (id) on delete set null;
create index agenda_events_cliente_idx on public.agenda_events (client_id) where client_id is not null;

create table public.agenda_tags (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 1 and 40),
  color text not null default '#64748b' check (color ~ '^#[0-9a-fA-F]{6}$'),
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
create unique index agenda_tags_nome_idx on public.agenda_tags (lower(btrim(name)));

alter table public.agenda_tags enable row level security;
create policy agenda_tags_select on public.agenda_tags for select to authenticated using (is_team());
create policy agenda_tags_insert on public.agenda_tags for insert to authenticated with check (is_team() and created_by = auth.uid());
create policy agenda_tags_update on public.agenda_tags for update to authenticated
  using (is_team() and (created_by = auth.uid() or is_admin())) with check (is_team());
create policy agenda_tags_delete on public.agenda_tags for delete to authenticated using (is_team() and (created_by = auth.uid() or is_admin()));

create table public.agenda_event_tags (
  event_id uuid not null references public.agenda_events (id) on delete cascade,
  tag_id uuid not null references public.agenda_tags (id) on delete cascade,
  primary key (event_id, tag_id)
);
create index agenda_event_tags_tag_idx on public.agenda_event_tags (tag_id);

alter table public.agenda_event_tags enable row level security;
create policy agenda_event_tags_select on public.agenda_event_tags for select to authenticated using (can_read_agenda_event(event_id));
create policy agenda_event_tags_insert on public.agenda_event_tags for insert to authenticated with check (can_edit_agenda_event(event_id));
create policy agenda_event_tags_delete on public.agenda_event_tags for delete to authenticated using (can_edit_agenda_event(event_id));
