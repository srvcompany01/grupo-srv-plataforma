-- Projetos passa a ser UMA LISTA (solta, fora dos espaços): cada tarefa principal é um projeto (normalmente um cliente)
-- e as subtarefas são o que está sendo desenvolvido. Substitui o "espaço de projetos" da migration 41.

alter table public.lists add column is_projects boolean not null default false;
create unique index lists_projetos_idx on public.lists (is_projects) where is_projects;

-- O espaço criado pela versão anterior é arquivado se ficou vazio (sem listas nem pastas ativas).
update public.spaces s set archived_at = now()
where s.is_projects and s.archived_at is null
  and not exists (select 1 from public.lists l where l.space_id = s.id and l.archived_at is null)
  and not exists (select 1 from public.folders f where f.space_id = s.id and f.archived_at is null);

drop index if exists public.spaces_projetos_idx;
alter table public.spaces drop column is_projects;
