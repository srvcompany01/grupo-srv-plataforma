-- Modelos de tarefa: título e subtarefas prontos para criar uma tarefa já estruturada ("+ Tarefa ▾ > A partir de modelo").
-- Toda a equipe vê e usa; quem criou (ou o admin) exclui.

create table public.task_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 1 and 80),
  title text not null check (length(btrim(title)) between 1 and 200),
  subtasks text[] not null default '{}' check (cardinality(subtasks) <= 30),
  created_by uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  created_at timestamptz not null default now()
);

alter table public.task_templates enable row level security;
create policy task_templates_ler on public.task_templates for select to authenticated using (is_team());
create policy task_templates_criar on public.task_templates for insert to authenticated with check (is_team() and created_by = auth.uid());
create policy task_templates_excluir on public.task_templates for delete to authenticated using (is_team() and (created_by = auth.uid() or is_admin()));
