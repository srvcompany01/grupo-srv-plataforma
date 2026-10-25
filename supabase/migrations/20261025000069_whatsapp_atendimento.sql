-- WhatsApp de atendimento do cliente: onde chegam os leads (botão da página da bio). O campo `whatsapp` passa a ser o
-- do próprio cliente (contato com a agência: recebe os relatórios). O telefone sai do cadastro (a coluna `phone` fica,
-- sem uso, para não perder dado).

alter table public.clients
  add column whatsapp_atendimento text check (whatsapp_atendimento is null or whatsapp_atendimento ~ '^[0-9]{10,15}$');

-- Quem já tinha WhatsApp cadastrado o usava no link da bio: segue igual até a equipe ajustar.
update public.clients set whatsapp_atendimento = whatsapp where whatsapp_atendimento is null;

create or replace function public.bio_pagina(p_slug text)
returns table (nome text, logo text, whatsapp text, mensagem text, links jsonb)
language sql stable security definer set search_path = public
as $$
  select c.name, c.bio_logo, c.whatsapp_atendimento, c.bio_mensagem,
    coalesce((select jsonb_agg(jsonb_build_object('id', l.id, 'rotulo', l.rotulo) order by l.position, l.created_at) from bio_links l where l.client_id = c.id), '[]'::jsonb)
  from clients c where c.bio_slug = p_slug and c.status <> 'encerrado'
$$;

create or replace function public.bio_botao(p_slug text, p_botao text, p_contar boolean)
returns table (url text, whatsapp text, mensagem text)
language plpgsql security definer set search_path = public
as $$
declare
  c record;
  l record;
begin
  select id, clients.whatsapp_atendimento as numero, bio_mensagem into c from clients where bio_slug = p_slug and status <> 'encerrado';
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

create or replace function public.registrar_clique_bio(p_slug text) returns table (whatsapp text, mensagem text)
language plpgsql security definer set search_path = public
as $$
declare
  c record;
begin
  select id, clients.whatsapp_atendimento as numero, bio_mensagem into c from clients where bio_slug = p_slug and status <> 'encerrado';
  if c.id is null then return; end if;
  insert into bio_clicks (client_id, day, origem, clicks) values (c.id, (now() at time zone 'America/Belem')::date, 'bio', 1)
  on conflict (client_id, day, origem) do update set clicks = bio_clicks.clicks + 1;
  return query select c.numero, c.bio_mensagem;
end $$;
