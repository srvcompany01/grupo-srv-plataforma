-- Projetos: um espaço marcado como "de projetos". Cada lista dele é um projeto (normalmente um por cliente) e as
-- tarefas/subtarefas são as entregas. A aba Projetos e o Painel (tempo investido, tarefas concluídas, em andamento,
-- pendentes) leem as listas desse espaço. Só um espaço pode ser o de projetos.

alter table public.spaces add column is_projects boolean not null default false;
create unique index spaces_projetos_idx on public.spaces (is_projects) where is_projects;
