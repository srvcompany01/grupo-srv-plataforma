-- Link do cliente sem login: app.gruposrv.com.br/cliente/<nome-do-cliente>-<código>. O código (6 caracteres)
-- impede que alguém chegue à página só adivinhando o nome; gerar um link novo invalida o anterior.

create function public.slug_portal(nome text) returns text
language sql immutable
as $$
  select coalesce(nullif(left(trim(both '-' from regexp_replace(
    translate(lower(nome), 'áàâãäéèêëíìîïóòôõöúùûüçñ', 'aaaaaeeeeiiiiooooouuuucn'), '[^a-z0-9]+', '-', 'g')), 40), ''), 'cliente')
$$;

alter table public.clients add column portal_slug text;
update public.clients set portal_slug = slug_portal(name) || '-' || substr(md5(random()::text || id::text), 1, 6);
alter table public.clients alter column portal_slug set not null;
alter table public.clients add constraint clients_portal_slug_formato check (portal_slug ~ '^[a-z0-9][a-z0-9-]{2,60}$');
create unique index clients_portal_slug_idx on public.clients (portal_slug);

create function public.clients_portal_slug() returns trigger
language plpgsql
as $$
begin
  if new.portal_slug is null then
    new.portal_slug := slug_portal(new.name) || '-' || substr(md5(random()::text || clock_timestamp()::text), 1, 6);
  end if;
  return new;
end $$;
create trigger clients_portal_slug before insert on public.clients for each row execute function public.clients_portal_slug();
