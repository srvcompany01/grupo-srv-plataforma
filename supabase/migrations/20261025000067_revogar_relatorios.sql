-- Relatórios incorretos não são apagados: ficam auditáveis, mas o link público deixa de mostrar os números.
alter table public.client_reports
  add column revoked_at timestamptz,
  add column revoked_by uuid references public.profiles (id) on delete set null;

create policy client_reports_revogar on public.client_reports for update to authenticated
  using (my_role() in ('admin', 'gestor') and revoked_at is null)
  with check (my_role() in ('admin', 'gestor') and revoked_at is not null);
