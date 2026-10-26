-- Link da bio: além do clique (quem tocou no link, contado ao pedir a página), conta a VISUALIZAÇÃO (a página chegou a abrir
-- no aparelho) e as pessoas distintas por dia. A diferença entre os dois é quem clica e desiste antes de a página carregar.
-- Pessoa distinta = hash diário de IP + aparelho (calculado no servidor, com sal secreto); só o hash de hoje e de ontem fica guardado.

create table public.bio_visualizacoes (
  client_id uuid not null references public.clients (id) on delete cascade,
  day date not null,
  origem text not null default 'bio' check (origem ~ '^[a-z0-9_-]{1,20}$'),
  views integer not null default 0,
  visitantes integer not null default 0,
  primary key (client_id, day, origem)
);
alter table public.bio_visualizacoes enable row level security;
create policy bio_visualizacoes_ler on public.bio_visualizacoes for select to authenticated using (is_team());

-- Só a função (security definer) escreve e lê aqui: ninguém acessa os hashes pela API.
create table public.bio_visitantes (
  client_id uuid not null references public.clients (id) on delete cascade,
  day date not null,
  h text not null check (length(h) between 16 and 64),
  primary key (client_id, day, h)
);
alter table public.bio_visitantes enable row level security;

create function public.bio_visualizacao(p_slug text, p_origem text, p_hash text) returns void
language plpgsql security definer set search_path = public
as $$
declare
  cid uuid;
  hoje date := (now() at time zone 'America/Belem')::date;
  novos integer;
begin
  select id into cid from clients where bio_slug = p_slug and status <> 'encerrado';
  if cid is null then return; end if;
  insert into bio_visitantes (client_id, day, h) values (cid, hoje, p_hash) on conflict do nothing;
  get diagnostics novos = row_count;
  insert into bio_visualizacoes (client_id, day, origem, views, visitantes)
  values (cid, hoje, case when p_origem ~ '^[a-z0-9_-]{1,20}$' then p_origem else 'bio' end, 1, novos)
  on conflict (client_id, day, origem) do update set views = bio_visualizacoes.views + 1, visitantes = bio_visualizacoes.visitantes + novos;
  if random() < 0.05 then delete from bio_visitantes where day < hoje - 1; end if;
end $$;
revoke execute on function public.bio_visualizacao(text, text, text) from public;
grant execute on function public.bio_visualizacao(text, text, text) to anon, authenticated;
