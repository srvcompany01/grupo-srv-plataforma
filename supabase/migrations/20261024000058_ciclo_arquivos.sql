-- Ciclo de renovação dos arquivos (R2): uma rotina diária apaga o ARQUIVO e marca o registro como arquivado
-- (o registro continua; a tela mostra "arquivo arquivado"). Prazos:
--  * mídias de post publicado: 90 dias depois da publicação; de post não publicado: 180 dias sem versão nova;
--  * anexos de tarefas e do chat: 12 meses;
--  * criativos de anúncio já enviados à Meta: 90 dias (a Meta guarda a cópia dela);
--  * gravações de reunião: logo depois da ata (sem registro no banco); blog e capas de cliente: nunca.

alter table public.content_media add column arquivado_em timestamptz;
alter table public.comment_attachments add column arquivado_em timestamptz;
alter table public.chat_attachments add column arquivado_em timestamptz;
alter table public.ad_creatives add column arquivado_em timestamptz;

-- O que a rotina liberou (para a tela de Armazenamento).
create table public.file_cleanups (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('post', 'anexo_tarefa', 'anexo_chat', 'criativo', 'reuniao')),
  arquivos integer not null check (arquivos > 0),
  bytes bigint not null default 0,
  created_at timestamptz not null default now()
);
alter table public.file_cleanups enable row level security;
create policy file_cleanups_ler on public.file_cleanups for select to authenticated using (is_admin());

-- Arquivos que vencem até agora + p_antecedencia_dias (0 = vencidos; 7 = os da próxima semana também).
create function public.arquivos_a_arquivar(p_antecedencia_dias integer default 0)
returns table (tipo text, id uuid, chave text, bytes bigint, nome text, vence_em timestamptz)
language sql stable security definer set search_path = public
as $$
  with todos as (
    select 'post'::text as tipo, m.id, m.r2_key as chave, m.size_bytes as bytes, m.original_name as nome,
      case when p.publish_status = 'publicado' and p.published_at is not null then p.published_at + interval '90 days' else v.created_at + interval '180 days' end as vence_em
    from content_media m join content_posts p on p.task_id = m.task_id join content_versions v on v.id = m.version_id
    where m.arquivado_em is null
    union all
    select 'anexo_tarefa', a.id, a.r2_key, a.size_bytes, a.file_name, a.created_at + interval '12 months' from comment_attachments a where a.arquivado_em is null
    union all
    select 'anexo_chat', a.id, a.r2_key, a.size_bytes, a.file_name, a.created_at + interval '12 months' from chat_attachments a where a.arquivado_em is null
    union all
    select 'criativo', c.id, c.chave, c.tamanho, c.nome, c.created_at + interval '90 days' from ad_creatives c where c.arquivado_em is null and c.meta <> '{}'::jsonb
  )
  select * from todos where vence_em <= now() + make_interval(days => p_antecedencia_dias) order by vence_em
$$;

-- Espaço ocupado hoje pelos arquivos com registro no banco (por tipo).
create function public.uso_armazenamento()
returns table (tipo text, arquivos bigint, bytes bigint)
language sql stable security definer set search_path = public
as $$
  select 'post', count(*), coalesce(sum(size_bytes), 0)::bigint from content_media where arquivado_em is null
  union all select 'anexo_tarefa', count(*), coalesce(sum(size_bytes), 0)::bigint from comment_attachments where arquivado_em is null
  union all select 'anexo_chat', count(*), coalesce(sum(size_bytes), 0)::bigint from chat_attachments where arquivado_em is null
  union all select 'criativo', count(*), coalesce(sum(tamanho), 0)::bigint from ad_creatives where arquivado_em is null
$$;

revoke execute on function public.arquivos_a_arquivar(integer) from public, anon, authenticated;
revoke execute on function public.uso_armazenamento() from public, anon, authenticated;
grant execute on function public.arquivos_a_arquivar(integer) to service_role;
grant execute on function public.uso_armazenamento() to service_role;
