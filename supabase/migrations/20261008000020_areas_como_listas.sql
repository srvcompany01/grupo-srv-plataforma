-- Cada área fixa passa a ser UMA lista (a tela da área abre direto a lista de tarefas, com status, campos, Kanban etc.).
-- A lista é criada dentro do espaço-área; os status padrão nascem pelo gatilho criar_status_padrao.
-- A lista exige um cliente (NOT NULL): usa o interno, e cada tarefa escolhe a própria tag de cliente.
-- Só adiciona: nada é apagado.

alter table public.lists
  add column slug text unique check (slug ~ '^[a-z0-9-]{1,40}$');

insert into public.lists (space_id, client_id, name, position, slug, color, icon)
select s.id, (select c.id from public.clients c where c.is_internal order by c.created_at limit 1), s.name, 'a0', s.slug, s.color, 'list'
from public.spaces s
where s.slug is not null
  and not exists (select 1 from public.lists l where l.slug = s.slug)
  and exists (select 1 from public.clients c where c.is_internal);
