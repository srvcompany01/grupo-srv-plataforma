-- Correção R1 (segunda revisão de segurança): o agrupamento dos avisos da prova visual inferia o aviso anterior pelo TEXTO
-- (LIKE), que nunca casava com o texto gravado, então cada marcação criava um aviso. Agora o aviso tem identificador
-- estruturado: uma chave por tarefa, versão e janela de 30 minutos, com índice único. O upsert é atômico, então duas marcações
-- simultâneas continuam dando um aviso só.

alter table public.comments add column system_key text;
create unique index comments_system_key_idx on public.comments (task_id, system_key) where system_key is not null;

-- Registra (ou atualiza) o aviso da equipe depois de uma marcação nova do cliente. Só o servidor do portal chama (service_role).
-- Quem assina o aviso é o criador da tarefa (ou o primeiro responsável), como o resto do portal.
create function public.registrar_aviso_prova(p_task uuid, p_version uuid, p_nome text, p_texto text) returns void
language plpgsql security definer set search_path = public
as $$
declare
  janela bigint := floor(extract(epoch from now()) / 1800);
  inicio timestamptz := to_timestamp(janela * 1800);
  autor uuid;
  n integer;
  texto text := left(btrim(coalesce(p_texto, '')), 160);
  corpo text;
begin
  select coalesce(t.created_by, (select a.user_id from task_assignees a where a.task_id = t.id order by a.created_at, a.user_id limit 1))
    into autor from tasks t where t.id = p_task;
  if autor is null then return; end if;
  -- Quantas marcações do cliente nesta versão já caíram nesta janela (a nova já foi gravada).
  select count(*) into n from content_review_comments
   where version_id = p_version and parent_id is null and author_kind = 'cliente' and created_at >= inicio;
  if n <= 1 then
    corpo := '💬 O cliente (' || left(btrim(p_nome), 80) || ') comentou na prova visual: ' || texto;
  else
    corpo := '💬 O cliente (' || left(btrim(p_nome), 80) || ') fez ' || n || ' comentários na prova visual. Último: ' || texto;
  end if;
  insert into comments (task_id, author_id, body, is_internal, system_key)
  values (p_task, autor, corpo, false, 'prova:' || p_version::text || ':' || janela::text)
  on conflict (task_id, system_key) where system_key is not null do update set body = excluded.body;
end $$;
revoke execute on function public.registrar_aviso_prova(uuid, uuid, text, text) from public, anon, authenticated;
grant execute on function public.registrar_aviso_prova(uuid, uuid, text, text) to service_role;
