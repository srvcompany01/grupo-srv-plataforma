-- Correção B1 (revisão de segurança): a posição e o instante do comentário não eram conferidos com a mídia real da versão
-- (uma versão com uma imagem aceitava a mídia 49 ou o segundo 100). Agora o banco confere, para qualquer caminho de escrita:
-- a mídia precisa existir na versão (as mesmas até 10 que o portal mostra), o instante só vale em vídeo e há um teto de 3 horas
-- (a duração do vídeo não é guardada, então esse é o limite possível).

alter table public.content_review_comments add constraint content_review_comments_segundo_max check (video_second is null or video_second <= 10800);

create or replace function public.preparar_comentario_revisao() returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  versao content_versions%rowtype;
  post content_posts%rowtype;
  pai content_review_comments%rowtype;
  midia record;
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

  -- O local precisa existir nesta versão: a mídia (na ordem em que o portal as mostra, até 10) e, para instante, ser vídeo.
  if new.media_index is not null then
    select m.kind, m.arquivado_em into midia from content_media m where m.version_id = new.version_id order by m.position offset new.media_index limit 1;
    if not found or new.media_index >= 10 then
      raise exception 'Essa mídia não existe nesta versão';
    end if;
    if new.video_second is not null and (midia.arquivado_em is not null or midia.kind <> 'video') then
      raise exception 'O instante só vale para vídeo';
    end if;
  end if;

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
