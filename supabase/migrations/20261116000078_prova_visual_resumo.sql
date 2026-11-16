-- Correção R2 (segunda revisão de segurança): a leitura buscava os 2000 comentários MAIS ANTIGOS de todas as versões, então os da
-- versão atual podiam sumir sem aviso e a contagem de abertos ficava errada. Agora as contagens vêm de consultas agregadas
-- (não dependem de página carregada) e a leitura é por versão.

-- Totais por versão de um post: total de comentários (com respostas) e, só nos pontos do cliente (raízes), abertos e resolvidos.
-- security invoker: a agência vê o que a RLS deixa; o servidor do portal chama com a chave mestra depois de conferir o link.
create function public.resumo_prova_visual(p_task uuid)
returns table (version_id uuid, version_number integer, total bigint, abertos bigint, resolvidos bigint)
language sql stable security invoker set search_path = public
as $$
  select v.id, v.number, count(c.id), count(c.id) filter (where c.parent_id is null and c.resolved_at is null),
         count(c.id) filter (where c.parent_id is null and c.resolved_at is not null)
  from content_versions v
  left join content_review_comments c on c.version_id = v.id
  where v.task_id = p_task
  group by v.id, v.number
  order by v.number desc
$$;
revoke execute on function public.resumo_prova_visual(uuid) from public, anon;
grant execute on function public.resumo_prova_visual(uuid) to authenticated, service_role;

-- Pontos do cliente em aberto por tarefa (indicador da lista e do Kanban). Agregado no banco: o select anterior trazia uma linha
-- por ponto e o limite padrão de linhas da API cortava a contagem em silêncio.
create function public.abertos_por_tarefa(p_ids uuid[])
returns table (task_id uuid, abertos bigint)
language sql stable security invoker set search_path = public
as $$
  select c.task_id, count(*) from content_review_comments c
  where c.task_id = any (p_ids) and c.parent_id is null and c.resolved_at is null
  group by c.task_id
$$;
revoke execute on function public.abertos_por_tarefa(uuid[]) from public, anon;
grant execute on function public.abertos_por_tarefa(uuid[]) to authenticated, service_role;
