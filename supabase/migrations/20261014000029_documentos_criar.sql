-- Corrige a criação de documento: no INSERT ... RETURNING a função can_read_document não enxerga a linha recém-criada,
-- então a política de leitura recusava o próprio dono ("sem permissão para criar"). O dono (equipe) passa a ler direto.
drop policy if exists documents_select on public.documents;
create policy documents_select on public.documents for select to authenticated
  using (can_read_document(id) or (is_team() and owner_id = auth.uid()));
