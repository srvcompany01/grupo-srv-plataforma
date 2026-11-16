-- Correção R3 (segunda revisão de segurança): autor_pode_gerar não considerava as listas na raiz (space_id nulo), que são
-- abertas a toda a equipe (can_access_space_target: espaço nulo = is_team()). Um membro ativo que lê o modelo e edita a regra,
-- mas não é responsável, tinha a série parada em silêncio. Agora a regra é equivalente à autorização canônica de leitura.

create or replace function public.autor_pode_gerar(p_autor uuid, p_modelo uuid) returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from tasks t
    join profiles p on p.id = coalesce(p_autor, t.created_by, (select a.user_id from task_assignees a where a.task_id = t.id order by a.created_at, a.user_id limit 1))
    where t.id = p_modelo
      and p.active and p.role in ('admin', 'gestor', 'membro')
      and (
        p.role = 'admin'
        -- lista na raiz (sem espaço): aberta a toda a equipe ativa
        or list_space(t.list_id) is null
        or exists (select 1 from task_assignees a where a.task_id = t.id and a.user_id = p.id)
        or exists (select 1 from spaces s where s.id = list_space(t.list_id) and s.team_open)
        or exists (select 1 from spaces s join space_members sm on sm.space_id in (s.id, s.parent_id) where s.id = list_space(t.list_id) and sm.user_id = p.id)
      )
  )
$$;
