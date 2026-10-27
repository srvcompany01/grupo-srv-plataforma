-- Quiz da página da bio: o WhatsApp só abre depois de a pessoa responder às perguntas, e só então conta um lead orgânico.
-- As perguntas são do cliente (até 3, cada uma com 2 a 4 opções); sem perguntas cadastradas, a página usa um quiz padrão.

create table public.bio_perguntas (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  position smallint not null default 0,
  pergunta text not null check (length(pergunta) between 1 and 80),
  opcoes text[] not null check (cardinality(opcoes) between 2 and 4),
  created_at timestamptz not null default now()
);
create index bio_perguntas_cliente_idx on public.bio_perguntas (client_id, position);
alter table public.bio_perguntas enable row level security;
create policy bio_perguntas_ler on public.bio_perguntas for select to authenticated using (is_team());
create policy bio_perguntas_criar on public.bio_perguntas for insert to authenticated with check (is_gestor_ou_admin());
create policy bio_perguntas_editar on public.bio_perguntas for update to authenticated using (is_gestor_ou_admin()) with check (is_gestor_ou_admin());
create policy bio_perguntas_excluir on public.bio_perguntas for delete to authenticated using (is_gestor_ou_admin());

-- Um lead orgânico por pessoa por dia (hash de IP + aparelho, sem guardar nenhum dado pessoal). `respostas` = [{p, o}] com os textos.
create table public.bio_leads (
  client_id uuid not null references public.clients (id) on delete cascade,
  day date not null,
  visitante text not null check (length(visitante) <= 64),
  origem text not null default 'bio' check (origem ~ '^[a-z0-9_-]{1,20}$'),
  respostas jsonb not null default '[]'::jsonb,
  criado_em timestamptz not null default now(),
  primary key (client_id, day, visitante)
);
alter table public.bio_leads enable row level security;
create policy bio_leads_ler on public.bio_leads for select to authenticated using (is_team());

-- Perguntas que a página mostra (vazio = quiz padrão do aplicativo).
create function public.bio_quiz_pagina(p_slug text) returns jsonb
language sql stable security definer set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object('pergunta', q.pergunta, 'opcoes', to_jsonb(q.opcoes)) order by q.position, q.created_at), '[]'::jsonb)
  from bio_perguntas q join clients c on c.id = q.client_id
  where c.bio_slug = p_slug and c.status <> 'encerrado'
$$;
revoke execute on function public.bio_quiz_pagina(text) from public;
grant execute on function public.bio_quiz_pagina(text) to anon, authenticated;

-- Lead orgânico: quiz concluído. Conta uma vez por pessoa por dia e devolve o WhatsApp e a mensagem para abrir a conversa.
create function public.bio_lead(p_slug text, p_origem text, p_hash text, p_respostas jsonb)
returns table (whatsapp text, mensagem text)
language plpgsql security definer set search_path = public
as $$
declare
  c record;
begin
  select id, clients.whatsapp_atendimento as numero, bio_mensagem into c from clients where bio_slug = p_slug and status <> 'encerrado';
  if c.id is null or c.numero is null then return; end if;
  insert into bio_leads (client_id, day, visitante, origem, respostas)
  values (c.id, (now() at time zone 'America/Belem')::date, left(p_hash, 64), case when p_origem ~ '^[a-z0-9_-]{1,20}$' then p_origem else 'bio' end, coalesce(p_respostas, '[]'::jsonb))
  on conflict (client_id, day, visitante) do nothing;
  return query select c.numero, c.bio_mensagem;
end $$;
revoke execute on function public.bio_lead(text, text, text, jsonb) from public;
grant execute on function public.bio_lead(text, text, text, jsonb) to anon, authenticated;

-- O botão do WhatsApp deixa de entregar o número: só conta o toque (quem abriu o quiz). O número sai de bio_lead, depois do quiz.
create or replace function public.bio_botao(p_slug text, p_botao text, p_contar boolean)
returns table (url text, whatsapp text, mensagem text)
language plpgsql security definer set search_path = public
as $$
declare
  c record;
  l record;
  nome text := 'WhatsApp';
begin
  select id, clients.whatsapp_atendimento as numero, bio_mensagem into c from clients where bio_slug = p_slug and status <> 'encerrado';
  if c.id is null then return; end if;
  if p_botao = 'whatsapp' then
    if c.numero is null then return; end if;
  else
    select * into l from bio_links where client_id = c.id and id::text = p_botao;
    if l.id is null then return; end if;
    nome := l.rotulo;
  end if;
  if p_contar then
    insert into bio_botao_clicks (client_id, botao, day, clicks, rotulo)
    values (c.id, p_botao, (now() at time zone 'America/Belem')::date, 1, nome)
    on conflict (client_id, botao, day) do update set clicks = bio_botao_clicks.clicks + 1, rotulo = excluded.rotulo;
  end if;
  if p_botao <> 'whatsapp' then
    return query select l.url, null::text, null::text;
  end if;
end $$;

-- A função antiga (entregava o WhatsApp direto ao anônimo) não é mais usada e furaria o quiz.
drop function if exists public.registrar_clique_bio(text);
