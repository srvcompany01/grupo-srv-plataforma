-- Estrutura de navegação definida pelo cliente:
--   Administração (abre o Painel de Gestão)
--   Comercial     › CRM, Playbooks
--   Operação      › Social & Conteúdo, Tráfego & Performance, Jornada de Compra
-- Tudo continua arrastável (espaços e listas) e abre as telas de lista de sempre.
--
-- Esta migration NÃO apaga dados. Os espaços antigos (inclusive os dois "espaços-área" da migration 19) e as
-- listas/pastas deles são ARQUIVADOS (somem da navegação e do Painel, mas continuam no banco e podem voltar).
-- As duas listas de área (Social & Conteúdo, Tráfego & Performance) são MOVIDAS para Operação, com as tarefas.

-- 1) Os três espaços (abertos à equipe, como as áreas fixas).
insert into public.spaces (name, color, icon, position, slug, team_open)
select v.name, v.color, v.icon, v.position, v.slug, true
from (values
  ('Administração', '#073f3b', 'briefcase', 'a0', 'administracao'),
  ('Comercial', '#b75b4b', 'badge-dollar-sign', 'a1', 'comercial'),
  ('Operação', '#3e78b8', 'rocket', 'a2', 'operacao')
) as v (name, color, icon, position, slug)
where not exists (select 1 from public.spaces s where s.slug = v.slug);

-- 2) As listas já criadas para as áreas passam a viver em Operação.
update public.lists l
set space_id = (select id from public.spaces where slug = 'operacao'),
    folder_id = null,
    position = case l.slug when 'social-conteudo' then 'a0' else 'a1' end
where l.slug in ('social-conteudo', 'trafego-performance');

-- 3) Listas novas (cliente padrão = interno; cada tarefa escolhe a própria tag de cliente).
insert into public.lists (space_id, client_id, name, position, slug, color, icon)
select (select id from public.spaces where slug = v.espaco),
       (select c.id from public.clients c where c.is_internal order by c.created_at limit 1),
       v.nome, v.posicao, v.slug, v.cor, 'list'
from (values
  ('operacao', 'Jornada de Compra', 'a2', 'jornada-de-compra', '#8b5cf6'),
  ('comercial', 'CRM', 'a0', 'crm', '#b75b4b'),
  ('comercial', 'Playbooks', 'a1', 'playbooks', '#d79528')
) as v (espaco, nome, posicao, slug, cor)
where not exists (select 1 from public.lists l where l.slug = v.slug)
  and exists (select 1 from public.clients c where c.is_internal);

-- 4) Arquiva o resto: espaços antigos (sem slug de área) e os dois espaços-área da migration 19, com suas listas e pastas.
with antigos as (
  select id from public.spaces
  where archived_at is null
    and (slug is null or slug in ('social-conteudo', 'trafego-performance'))
), listas as (
  update public.lists set archived_at = now()
  where archived_at is null and space_id in (select id from antigos)
  returning id
), pastas as (
  update public.folders set archived_at = now()
  where archived_at is null and space_id in (select id from antigos)
  returning id
)
update public.spaces
set archived_at = now(),
    slug = null,
    team_open = false
where id in (select id from antigos);
