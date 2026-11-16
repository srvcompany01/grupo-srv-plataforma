-- Correção A2 (revisão de segurança): membro comum lia as horas de outras pessoas.
-- Regra do dono: cada pessoa lê SÓ os próprios registros de tempo (duração, nota, faturável); admin e gestor leem os de todos.
-- O total de horas da tarefa passa a ser visível só para admin e gestor (o membro vê só o próprio). Cliente do portal e
-- usuário desativado não leem nada (is_team() e is_gestor_ou_admin() exigem perfil ativo).
-- Fecha também os canais paralelos: o histórico "time_logged" (que trazia a duração) e o ajuste da marca de faturável.

-- 1) Leitura dos registros.
drop policy time_entries_select on public.time_entries;
create policy time_entries_select on public.time_entries for select to authenticated
  using (
    is_team() and (
      -- o próprio registro (mantém a regra antiga: quem perdeu acesso à tarefa ainda enxerga e para o cronômetro aberto)
      (user_id = auth.uid() and (can_read_task(task_id) or ended_at is null))
      -- os dos outros, só admin e gestor (a mesma regra do resumo de tempo)
      or is_gestor_ou_admin()
    )
  );

-- 2) Editar e apagar: o dono, ou admin e gestor (o gestor do espaço, sem ser gestor no papel, não mexe em horas alheias).
drop policy time_entries_update on public.time_entries;
create policy time_entries_update on public.time_entries for update to authenticated
  using (is_team() and (user_id = auth.uid() or is_gestor_ou_admin()))
  with check (is_team() and (user_id = auth.uid() or is_gestor_ou_admin()));
drop policy time_entries_delete on public.time_entries;
create policy time_entries_delete on public.time_entries for delete to authenticated
  using (is_team() and (user_id = auth.uid() or is_gestor_ou_admin()));

-- 3) A marca de faturável também segue a regra (era security definer e deixava o gestor do espaço mexer em horas alheias).
create or replace function public.definir_faturavel(p_id uuid, p_faturavel boolean) returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not exists (
    select 1 from time_entries te
    where te.id = p_id and is_team() and (te.user_id = auth.uid() or is_gestor_ou_admin())
  ) then
    raise exception 'Sem permissão para alterar este registro' using errcode = '42501';
  end if;
  update time_entries set billable = coalesce(p_faturavel, true) where id = p_id;
end $$;

-- 4) Histórico da tarefa: o evento "registrou 1h10" traz a duração. Vale a mesma regra: só o autor, admin e gestor.
drop policy task_activity_select on public.task_activity;
create policy task_activity_select on public.task_activity for select to authenticated
  using (can_read_task(task_id) and (action <> 'time_logged' or actor_id = auth.uid() or is_gestor_ou_admin()));
