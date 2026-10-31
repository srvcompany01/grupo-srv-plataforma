-- Caixa de entrada: o destino que a pessoa escolhe para cada vídeo (lista, tarefa e se entra como tarefa-mãe, subtarefa ou na tarefa que já existe).
-- A IA só usa esse destino; nunca escolhe sozinha.
alter table public.content_inbox
  add column if not exists dest_list_id uuid references public.lists(id) on delete set null,
  add column if not exists dest_task_id uuid references public.tasks(id) on delete set null,
  add column if not exists dest_mode text check (dest_mode in ('mae', 'subtarefa', 'existente'));
