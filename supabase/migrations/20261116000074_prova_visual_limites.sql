-- Correção M1 (revisão de segurança): a escrita pública de comentários da prova visual não tinha limite.
-- 1) Limite compartilhado (no banco, vale para todas as instâncias do servidor): pedidos por link/tarefa e por IP numa janela de tempo.
-- 2) Quota por versão: no máximo 100 marcações do cliente por versão e 20 respostas do cliente por comentário.
-- 3) Índice para a leitura paginada estável (created_at, id).

create table public.portal_limites (
  chave text primary key check (length(chave) <= 200),
  janela_inicio timestamptz not null default now(),
  n integer not null default 0
);
alter table public.portal_limites enable row level security; -- sem política: ninguém acessa pela API, só a função abaixo

-- true = pode seguir; false = passou do máximo na janela. Atômico (INSERT ... ON CONFLICT): duas requisições simultâneas contam as duas.
create function public.consumir_limite(p_chave text, p_max integer, p_janela_segundos integer) returns boolean
language plpgsql security definer set search_path = public
as $$
declare
  atual integer;
begin
  if p_chave is null or p_max < 1 or p_janela_segundos < 1 then
    raise exception 'Limite inválido';
  end if;
  insert into portal_limites as l (chave, janela_inicio, n) values (p_chave, now(), 1)
  on conflict (chave) do update set
    n = case when l.janela_inicio <= now() - make_interval(secs => p_janela_segundos) then 1 else l.n + 1 end,
    janela_inicio = case when l.janela_inicio <= now() - make_interval(secs => p_janela_segundos) then now() else l.janela_inicio end
  returning l.n into atual;
  -- Faxina de vez em quando: janelas de mais de um dia não servem mais.
  if random() < 0.01 then
    delete from portal_limites where janela_inicio < now() - interval '1 day';
  end if;
  return atual <= p_max;
end $$;
revoke execute on function public.consumir_limite(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consumir_limite(text, integer, integer) to service_role;

create index content_review_comments_ordem_idx on public.content_review_comments (task_id, created_at, id);

create or replace function public.preparar_comentario_revisao() returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  versao content_versions%rowtype;
  post content_posts%rowtype;
  pai content_review_comments%rowtype;
begin
  if tg_op = 'UPDATE' then
    -- Só a resolução muda (e só em comentário raiz); o resto fica como foi escrito.
    if new.task_id is distinct from old.task_id or new.version_id is distinct from old.version_id or new.parent_id is distinct from old.parent_id
       or new.author_kind is distinct from old.author_kind or new.author_user_id is distinct from old.author_user_id
       or new.author_name is distinct from old.author_name or new.body is distinct from old.body
       or new.media_index is distinct from old.media_index or new.x_pct is distinct from old.x_pct
       or new.y_pct is distinct from old.y_pct or new.video_second is distinct from old.video_second
       or new.created_at is distinct from old.created_at then
      raise exception 'Só dá para resolver ou reabrir um comentário';
    end if;
    if new.parent_id is not null and (new.resolved_at is not null or new.resolved_by is not null) then
      raise exception 'Só comentários do cliente podem ser resolvidos';
    end if;
    if new.resolved_at is null then
      new.resolved_by := null;
    elsif old.resolved_at is null then
      new.resolved_by := auth.uid();
    else
      new.resolved_at := old.resolved_at;
      new.resolved_by := old.resolved_by;
    end if;
    return new;
  end if;

  select * into versao from content_versions where id = new.version_id;
  if not found then raise exception 'Versão não encontrada'; end if;
  if new.task_id is distinct from versao.task_id then
    raise exception 'O task_id precisa ser o da tarefa da versão';
  end if;
  select * into post from content_posts where task_id = versao.task_id;

  if new.author_kind = 'equipe' then
    if auth.uid() is not null then
      new.author_user_id := auth.uid();
      new.author_name := coalesce((select left(full_name, 80) from profiles where id = auth.uid()), new.author_name);
    end if;
  else
    -- O cliente só comenta a versão atual, enquanto ela espera a resposta dele.
    if versao.number <> post.current_version or post.approval <> 'aguardando'
       or exists (select 1 from content_responses where version_id = versao.id) then
      raise exception 'Esta versão já foi respondida: os comentários ficam só para leitura';
    end if;
  end if;

  -- Quota por versão: o link público não pode encher a prova visual (marcações novas do cliente).
  if new.author_kind = 'cliente' and new.parent_id is null
     and (select count(*) from content_review_comments where version_id = new.version_id and parent_id is null and author_kind = 'cliente') >= 100 then
    raise exception 'Esta versão já tem o máximo de 100 comentários. Fale com a agência';
  end if;

  if new.parent_id is not null then
    select * into pai from content_review_comments where id = new.parent_id;
    if not found or pai.parent_id is not null or pai.version_id <> new.version_id then
      raise exception 'A resposta precisa ser a um comentário da mesma versão';
    end if;
    if new.author_kind = 'cliente' and not exists (select 1 from content_review_comments where parent_id = pai.id and author_kind = 'equipe') then
      raise exception 'O cliente só responde depois que a agência respondeu';
    end if;
    if new.author_kind = 'cliente' and (select count(*) from content_review_comments where parent_id = pai.id and author_kind = 'cliente') >= 20 then
      raise exception 'Este comentário já tem o máximo de respostas do cliente';
    end if;
  end if;
  return new;
end $$;
