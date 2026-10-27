-- Aparência do botão do WhatsApp e do quiz da página da bio, por cliente: texto e cores do botão, título e descrição do quiz.
-- Vazio = o padrão do aplicativo (botão preto com "Chamar no WhatsApp", sem título nem descrição).
alter table public.clients
  add column bio_botao_texto text check (bio_botao_texto is null or length(bio_botao_texto) between 1 and 40),
  add column bio_botao_fundo text check (bio_botao_fundo is null or bio_botao_fundo ~ '^#[0-9a-fA-F]{6}$'),
  add column bio_botao_letra text check (bio_botao_letra is null or bio_botao_letra ~ '^#[0-9a-fA-F]{6}$'),
  add column bio_quiz_titulo text check (bio_quiz_titulo is null or length(bio_quiz_titulo) between 1 and 80),
  add column bio_quiz_descricao text check (bio_quiz_descricao is null or length(bio_quiz_descricao) between 1 and 200);

-- O que a página precisa do quiz: perguntas + aparência. (Antes devolvia só a lista de perguntas.)
create or replace function public.bio_quiz_pagina(p_slug text) returns jsonb
language sql stable security definer set search_path = public
as $$
  select jsonb_build_object(
    'perguntas', coalesce((select jsonb_agg(jsonb_build_object('pergunta', q.pergunta, 'opcoes', to_jsonb(q.opcoes)) order by q.position, q.created_at) from bio_perguntas q where q.client_id = c.id), '[]'::jsonb),
    'titulo', c.bio_quiz_titulo,
    'descricao', c.bio_quiz_descricao,
    'botaoTexto', c.bio_botao_texto,
    'botaoFundo', c.bio_botao_fundo,
    'botaoLetra', c.bio_botao_letra
  )
  from clients c where c.bio_slug = p_slug and c.status <> 'encerrado'
$$;
