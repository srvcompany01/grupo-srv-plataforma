-- Excluir cliente: só administrador, nunca o cliente interno. Se ainda houver listas, tarefas, formulários,
-- documentos ou usuários ligados a ele, o banco recusa (chaves estrangeiras) e a tela avisa para encerrar o cliente.
create policy clients_delete on public.clients for delete to authenticated
  using (is_admin() and not is_internal);
