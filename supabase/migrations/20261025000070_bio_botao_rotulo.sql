-- Guarda o nome do botão junto do toque: se o botão for removido, o histórico continua legível no relatório da bio.
alter table public.bio_botao_clicks add column rotulo text check (rotulo is null or length(rotulo) <= 40);

update public.bio_botao_clicks b set rotulo = 'WhatsApp' where b.botao = 'whatsapp';
update public.bio_botao_clicks b set rotulo = l.rotulo from public.bio_links l where l.id::text = b.botao;

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
  if p_botao = 'whatsapp' then
    return query select null::text, c.numero, c.bio_mensagem;
  else
    return query select l.url, null::text, null::text;
  end if;
end $$;
