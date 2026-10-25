-- Página da bio do cliente: logo, botões (além do WhatsApp do cadastro) e cliques por origem e por botão.
-- A página pública mostra só o nome e a logo do cliente (nada da agência).

alter table public.clients
  add column bio_logo text check (bio_logo is null or bio_logo ~ '^clientes/[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|png|webp)$');

-- Botões extras da página (o botão do WhatsApp vem do cadastro do cliente).
create table public.bio_links (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  rotulo text not null check (length(rotulo) between 1 and 40),
  url text not null check (url ~* '^https?://' and length(url) <= 500),
  position integer not null default 0,
  created_at timestamptz not null default now()
);
create index bio_links_cliente_idx on public.bio_links (client_id, position);
alter table public.bio_links enable row level security;
create policy bio_links_ler on public.bio_links for select to authenticated using (is_team());
create policy bio_links_criar on public.bio_links for insert to authenticated with check (is_gestor_ou_admin());
create policy bio_links_editar on public.bio_links for update to authenticated using (is_gestor_ou_admin()) with check (is_gestor_ou_admin());
create policy bio_links_excluir on public.bio_links for delete to authenticated using (is_gestor_ou_admin());

-- Visitas à página por origem (bio, story, anuncio…): o total do dia é a soma das origens.
alter table public.bio_clicks
  add column origem text not null default 'bio' check (origem ~ '^[a-z0-9_-]{1,20}$');
alter table public.bio_clicks drop constraint bio_clicks_pkey;
alter table public.bio_clicks add primary key (client_id, day, origem);

-- Toques em cada botão ('whatsapp' ou o id de um bio_links), por dia.
create table public.bio_botao_clicks (
  client_id uuid not null references public.clients (id) on delete cascade,
  botao text not null check (length(botao) <= 40),
  day date not null,
  clicks integer not null default 0,
  primary key (client_id, botao, day)
);
alter table public.bio_botao_clicks enable row level security;
create policy bio_botao_clicks_ler on public.bio_botao_clicks for select to authenticated using (is_team());

-- O que a página pública precisa (sem contar): nome, logo, WhatsApp, mensagem e botões.
create function public.bio_pagina(p_slug text)
returns table (nome text, logo text, whatsapp text, mensagem text, links jsonb)
language sql stable security definer set search_path = public
as $$
  select c.name, c.bio_logo, c.whatsapp, c.bio_mensagem,
    coalesce((select jsonb_agg(jsonb_build_object('id', l.id, 'rotulo', l.rotulo) order by l.position, l.created_at) from bio_links l where l.client_id = c.id), '[]'::jsonb)
  from clients c where c.bio_slug = p_slug and c.status <> 'encerrado'
$$;
revoke execute on function public.bio_pagina(text) from public;
grant execute on function public.bio_pagina(text) to anon, authenticated;

-- Visita à página (quem abriu o link da bio): soma 1 no dia, na origem informada.
create function public.bio_visita(p_slug text, p_origem text) returns void
language plpgsql security definer set search_path = public
as $$
declare
  cid uuid;
begin
  select id into cid from clients where bio_slug = p_slug and status <> 'encerrado';
  if cid is null then return; end if;
  insert into bio_clicks (client_id, day, origem, clicks)
  values (cid, (now() at time zone 'America/Belem')::date, case when p_origem ~ '^[a-z0-9_-]{1,20}$' then p_origem else 'bio' end, 1)
  on conflict (client_id, day, origem) do update set clicks = bio_clicks.clicks + 1;
end $$;
revoke execute on function public.bio_visita(text, text) from public;
grant execute on function public.bio_visita(text, text) to anon, authenticated;

-- Toque em um botão: soma 1 (se p_contar) e devolve para onde mandar. 'whatsapp' devolve número e mensagem.
create function public.bio_botao(p_slug text, p_botao text, p_contar boolean)
returns table (url text, whatsapp text, mensagem text)
language plpgsql security definer set search_path = public
as $$
declare
  c record;
  l record;
begin
  select id, clients.whatsapp as numero, bio_mensagem into c from clients where bio_slug = p_slug and status <> 'encerrado';
  if c.id is null then return; end if;
  if p_botao = 'whatsapp' then
    if c.numero is null then return; end if;
  else
    select * into l from bio_links where client_id = c.id and id::text = p_botao;
    if l.id is null then return; end if;
  end if;
  if p_contar then
    insert into bio_botao_clicks (client_id, botao, day, clicks)
    values (c.id, p_botao, (now() at time zone 'America/Belem')::date, 1)
    on conflict (client_id, botao, day) do update set clicks = bio_botao_clicks.clicks + 1;
  end if;
  if p_botao = 'whatsapp' then
    return query select null::text, c.numero, c.bio_mensagem;
  else
    return query select l.url, null::text, null::text;
  end if;
end $$;
revoke execute on function public.bio_botao(text, text, boolean) from public;
grant execute on function public.bio_botao(text, text, boolean) to anon, authenticated;

-- A função antiga (redirecionava direto ao WhatsApp) continua válida com a nova chave (origem 'bio').
create or replace function public.registrar_clique_bio(p_slug text) returns table (whatsapp text, mensagem text)
language plpgsql security definer set search_path = public
as $$
declare
  c record;
begin
  select id, clients.whatsapp, bio_mensagem into c from clients where bio_slug = p_slug and status <> 'encerrado';
  if c.id is null then return; end if;
  insert into bio_clicks (client_id, day, origem, clicks) values (c.id, (now() at time zone 'America/Belem')::date, 'bio', 1)
  on conflict (client_id, day, origem) do update set clicks = bio_clicks.clicks + 1;
  return query select c.whatsapp, c.bio_mensagem;
end $$;
