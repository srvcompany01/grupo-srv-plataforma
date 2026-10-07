-- Áreas fixas: a plataforma passa a ter telas fixas (Social & Conteúdo, Tráfego & Performance) no lugar de espaços livres.
-- Os espaços continuam sendo o contêiner (listas, pastas, campos personalizados, status e permissões seguem iguais).
-- Esta migration só ADICIONA: nada é apagado. Os espaços antigos continuam no banco, apenas fora da navegação.

alter table public.spaces
  add column slug text unique check (slug ~ '^[a-z0-9-]{1,40}$'),
  -- Área aberta a toda a equipe: dispensa cadastrar membro a membro; gestores (papel) gerenciam.
  add column team_open boolean not null default false;

create or replace function public.is_space_member(space uuid) returns boolean
language sql stable security definer set search_path = public
as $$
  select is_admin() or (is_team() and (
    exists (select 1 from spaces s where s.id = space and s.team_open)
    or exists (
      select 1 from spaces s
      join space_members sm on sm.space_id in (s.id, s.parent_id)
      where s.id = space and sm.user_id = auth.uid()
    )
  ))
$$;

create or replace function public.is_space_manager(space uuid) returns boolean
language sql stable security definer set search_path = public
as $$
  select is_admin() or (is_team() and (
    (my_role() = 'gestor' and exists (select 1 from spaces s where s.id = space and s.team_open))
    or exists (
      select 1 from spaces s
      join space_members sm on sm.space_id in (s.id, s.parent_id)
      where s.id = space and sm.user_id = auth.uid() and sm.role = 'gestor'
    )
  ))
$$;

insert into public.spaces (name, color, icon, position, slug, team_open)
select v.name, v.color, v.icon, v.position, v.slug, true
from (values
  ('Social & Conteúdo', '#b75b4b', 'clapperboard', 'a0', 'social-conteudo'),
  ('Tráfego & Performance', '#3e78b8', 'chart-no-axes-combined', 'a1', 'trafego-performance')
) as v (name, color, icon, position, slug)
where not exists (select 1 from public.spaces s where s.slug = v.slug);
