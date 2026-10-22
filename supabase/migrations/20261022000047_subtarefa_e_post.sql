-- Lista de conteúdo: a tarefa-mãe é o tema/campanha e TODA subtarefa é um post (formato feed, versão 1, rascunho).
-- Vale para subtarefas novas, para as que viram subtarefa depois (mudou o pai ou a lista) e para as que já existiam
-- quando a lista passa a ser de conteúdo. A "Máquina de Conteúdo" passa a ser lista de conteúdo.

create function public.subtarefa_vira_post() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.parent_task_id is not null
     and exists (select 1 from lists where id = new.list_id and kind = 'conteudo')
     and not exists (select 1 from content_posts where task_id = new.id) then
    insert into content_posts (task_id, format) values (new.id, 'feed');
    insert into content_versions (task_id, number) values (new.id, 1);
  end if;
  return null;
end $$;
create trigger subtarefa_vira_post after insert or update of parent_task_id, list_id on public.tasks
  for each row execute function public.subtarefa_vira_post();

create function public.lista_conteudo_converte_subtarefas() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.kind = 'conteudo' and old.kind is distinct from 'conteudo' then
    insert into content_posts (task_id, format)
    select t.id, 'feed' from tasks t
    where t.list_id = new.id and t.parent_task_id is not null and t.archived_at is null
      and not exists (select 1 from content_posts p where p.task_id = t.id);
    insert into content_versions (task_id, number)
    select p.task_id, 1 from content_posts p join tasks t on t.id = p.task_id
    where t.list_id = new.id and not exists (select 1 from content_versions v where v.task_id = p.task_id);
  end if;
  return null;
end $$;
create trigger lista_conteudo_converte_subtarefas after update of kind on public.lists
  for each row execute function public.lista_conteudo_converte_subtarefas();

update public.lists set kind = 'conteudo'
where archived_at is null and kind <> 'conteudo' and lower(btrim(name)) in ('máquina de conteúdo', 'maquina de conteudo');
