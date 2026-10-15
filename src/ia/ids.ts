import type { Supabase } from '@/infra/supabase/servidor'

/** Campos dos pedidos da IA que carregam ids, e a tabela onde cada id tem que existir (a RLS decide o que a pessoa enxerga). */
const TABELA_DO_CAMPO: Record<string, string> = {
  tarefaId: 'tasks', paiId: 'tasks', listaId: 'lists', statusId: 'list_statuses', clienteId: 'clients',
  documentoId: 'documents', paginaId: 'document_pages', campoId: 'custom_fields',
}

/** Pares campo=id encontrados no pedido (primeiro nível e dentro de `tarefas[]`). */
export function idsDoPedido(args: Record<string, unknown>): { campo: string; id: string }[] {
  const achados: { campo: string; id: string }[] = []
  const olhar = (o: unknown) => {
    if (!o || typeof o !== 'object') return
    for (const [campo, v] of Object.entries(o as Record<string, unknown>)) if (campo in TABELA_DO_CAMPO && typeof v === 'string') achados.push({ campo, id: v })
  }
  olhar(args)
  if (Array.isArray(args.tarefas)) for (const t of args.tarefas.slice(0, 60)) olhar(t)
  return achados
}

/**
 * Antes de mostrar uma proposta, confere se os ids existem e são visíveis para a pessoa. Modelos baratos às vezes inventam ou
 * truncam ids: assim o erro volta para o modelo corrigir, em vez de aparecer só depois do "Confirmar".
 * Devolve a mensagem de erro, ou null se tudo existe.
 */
export async function conferirIds(sb: Supabase, args: Record<string, unknown>): Promise<string | null> {
  const unicos = new Map(idsDoPedido(args).map((x) => [`${x.campo}:${x.id}`, x]))
  for (const { campo, id } of unicos.values()) {
    const { data, error } = await sb.from(TABELA_DO_CAMPO[campo] as 'tasks').select('id').eq('id', id).maybeSingle()
    if (error) return null // não deu para conferir: deixa seguir, a execução valida de novo
    if (!data) return `${campo} "${id}" não existe ou a pessoa não tem acesso. Use só ids devolvidos pelas ferramentas de consulta (listar_arvore, listar_tarefas, listar_clientes…), copiados por inteiro.`
  }
  return null
}
