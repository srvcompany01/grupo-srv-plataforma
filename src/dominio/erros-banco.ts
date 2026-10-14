/** Traduz um erro do Postgres/Supabase em mensagem para a tela. O detalhe técnico fica no log do servidor. */
export function mensagemErro(e: unknown): string {
  const { code, message } = (e ?? {}) as { code?: string; message?: string }
  if (code === '42501' || message?.includes('row-level security')) return 'Você não tem permissão para isso.'
  if (code === 'P0001' && message) return message
  if (code === '23503') return 'Ainda há itens ligados a isto (listas, tarefas, documentos…). Remova ou mova esses itens antes de excluir.'
  if (code === '23505') return 'Já existe um registro com esses dados.'
  return 'Algo deu errado. Tente de novo.'
}
