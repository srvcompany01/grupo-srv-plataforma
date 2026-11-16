-- Tempo faturável: cada registro de tempo diz se entra na cobrança do cliente (padrão: faturável).
-- O resumo por cliente e pessoa e a lista de registros só respondem para admin e gestor (a RLS de time_entries
-- continua valendo para a equipe: o cliente do portal nunca lê tempo, faturável ou não).

alter table public.time_entries add column billable boolean not null default true;
create index time_entries_started_idx on public.time_entries (started_at);

-- Lançamento manual com a marca (o parâmetro novo vem por último, com padrão: quem chamava antes continua valendo).
drop function public.lancar_tempo(uuid, date, integer, text);
create function public.lancar_tempo(p_task uuid, p_data date, p_minutos integer, p_nota text default null, p_faturavel boolean default true)
returns uuid
language plpgsql security invoker set search_path = public
as $$
declare
  novo uuid;
begin
  if p_minutos is null or p_minutos < 1 or p_minutos > 1440 then
    raise exception 'O tempo lançado deve ficar entre 1 e 1440 minutos';
  end if;
  insert into time_entries (task_id, started_at, duration_seconds, note, source, billable)
  values (p_task, (p_data + time '12:00') at time zone 'America/Belem', p_minutos * 60, nullif(btrim(p_nota), ''), 'manual', coalesce(p_faturavel, true))
  returning id into novo;
  return novo;
end $$;
revoke execute on function public.lancar_tempo(uuid, date, integer, text, boolean) from public, anon;
grant execute on function public.lancar_tempo(uuid, date, integer, text, boolean) to authenticated, service_role;

-- Muda só a marca de faturável. Quem pode: o dono do registro, o gestor do espaço, e admin ou gestor
-- (para corrigir antes de faturar, pela tela de resumo). Não mexe na duração nem na nota.
create function public.definir_faturavel(p_id uuid, p_faturavel boolean) returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not exists (
    select 1 from time_entries te join tasks t on t.id = te.task_id
    where te.id = p_id and is_team()
      and (te.user_id = auth.uid() or is_gestor_ou_admin() or can_manage_space_target(list_space(t.list_id)))
  ) then
    raise exception 'Sem permissão para alterar este registro' using errcode = '42501';
  end if;
  update time_entries set billable = coalesce(p_faturavel, true) where id = p_id;
end $$;
revoke execute on function public.definir_faturavel(uuid, boolean) from public, anon;
grant execute on function public.definir_faturavel(uuid, boolean) to authenticated, service_role;

-- Registros fechados no período (datas locais de America/Belem), um por linha. Só admin e gestor.
-- Filtros: clientes (lista) e/ou "sem cliente", pessoas, faturável (nulo = todos).
create function public.registros_tempo(
  p_de date, p_ate date,
  p_clientes uuid[] default null, p_sem_cliente boolean default false,
  p_pessoas uuid[] default null, p_faturavel boolean default null
) returns table (
  id uuid, dia date, task_id uuid, task_title text, list_name text, client_id uuid, client_name text,
  user_id uuid, user_name text, note text, seconds integer, billable boolean
)
language plpgsql stable security definer set search_path = public
as $$
begin
  if not is_gestor_ou_admin() then
    raise exception 'Sem permissão' using errcode = '42501';
  end if;
  return query
  select te.id, (te.started_at at time zone 'America/Belem')::date, t.id, t.title, l.name, t.client_id, c.name,
         te.user_id, p.full_name, te.note, te.duration_seconds, te.billable
  from time_entries te
  join tasks t on t.id = te.task_id
  join lists l on l.id = t.list_id
  left join clients c on c.id = t.client_id
  join profiles p on p.id = te.user_id
  where te.ended_at is not null
    and (te.started_at at time zone 'America/Belem')::date between p_de and p_ate
    and (
      (p_clientes is null and not coalesce(p_sem_cliente, false))
      or t.client_id = any (coalesce(p_clientes, '{}'))
      or (coalesce(p_sem_cliente, false) and t.client_id is null)
    )
    and (p_pessoas is null or te.user_id = any (p_pessoas))
    and (p_faturavel is null or te.billable = p_faturavel)
  order by te.started_at desc, te.id;
end $$;
revoke execute on function public.registros_tempo(date, date, uuid[], boolean, uuid[], boolean) from public, anon;
grant execute on function public.registros_tempo(date, date, uuid[], boolean, uuid[], boolean) to authenticated, service_role;

-- Somas por cliente e pessoa (o navegador só monta as duas visões e os totais). Mesmos filtros e a mesma checagem de papel.
create function public.resumo_tempo(
  p_de date, p_ate date,
  p_clientes uuid[] default null, p_sem_cliente boolean default false,
  p_pessoas uuid[] default null, p_faturavel boolean default null
) returns table (
  client_id uuid, client_name text, user_id uuid, user_name text,
  total_seconds bigint, billable_seconds bigint, registros bigint
)
language plpgsql stable security definer set search_path = public
as $$
begin
  if not is_gestor_ou_admin() then
    raise exception 'Sem permissão' using errcode = '42501';
  end if;
  return query
  select r.client_id, r.client_name, r.user_id, r.user_name,
         sum(r.seconds)::bigint, sum(r.seconds) filter (where r.billable)::bigint, count(*)::bigint
  from registros_tempo(p_de, p_ate, p_clientes, p_sem_cliente, p_pessoas, p_faturavel) r
  group by r.client_id, r.client_name, r.user_id, r.user_name;
end $$;
revoke execute on function public.resumo_tempo(date, date, uuid[], boolean, uuid[], boolean) from public, anon;
grant execute on function public.resumo_tempo(date, date, uuid[], boolean, uuid[], boolean) to authenticated, service_role;
