/** Texto curto, para a pessoa conferir antes de confirmar o que a IA quer fazer. */
export type Nomeador = (tabela: 'lists', id: string) => Promise<string | null>

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`

export async function resumirChamada(nome: string, a: Record<string, unknown>, nomear: Nomeador): Promise<string> {
  const texto = (v: unknown) => (typeof v === 'string' ? v : '')
  if (nome === 'criar_tarefas_em_lote') {
    const tarefas = (Array.isArray(a.tarefas) ? a.tarefas : []) as { titulo?: string; subtarefas?: unknown[]; serieSubtarefas?: { de: number; ate: number } }[]
    const subs = tarefas.reduce((n, t) => n + (t.subtarefas?.length ?? 0) + (t.serieSubtarefas ? Math.max(0, t.serieSubtarefas.ate - t.serieSubtarefas.de + 1) : 0), 0)
    const lista = await nomear('lists', texto(a.listaId))
    const exemplos = tarefas.slice(0, 3).map((t) => `“${t.titulo}”`).join(', ')
    return `Criar ${plural(tarefas.length, 'tarefa', 'tarefas')}${subs ? ` com ${plural(subs, 'subtarefa', 'subtarefas')}` : ''} na lista ${lista ? `“${lista}”` : '(não identificada)'}: ${exemplos}${tarefas.length > 3 ? '…' : ''}`
  }
  if (nome === 'criar_tarefa') return `Criar a tarefa “${texto(a.titulo)}” na lista ${(await nomear('lists', texto(a.listaId))) ?? '(não identificada)'}`
  if (nome === 'atualizar_tarefa') return `Alterar a tarefa ${texto(a.tarefaId).slice(0, 8)}…${a.titulo ? ` (novo título “${texto(a.titulo)}”)` : ''}`
  if (nome === 'definir_valor_campo') return `Preencher um campo personalizado da tarefa ${texto(a.tarefaId).slice(0, 8)}…`
  if (nome === 'comentar') return `Comentar numa tarefa: “${texto(a.texto).slice(0, 80)}”`
  if (nome === 'criar_documento') return `Criar o documento “${texto(a.titulo)}”${a.listaId ? ` na lista ${(await nomear('lists', texto(a.listaId))) ?? ''}` : ''}`
  if (nome === 'criar_pagina_documento') return `Criar a página “${texto(a.titulo)}” num documento`
  if (nome === 'atualizar_pagina_documento') return 'Alterar ou acrescentar texto numa página de documento'
  if (nome === 'atualizar_documento') return `Alterar o documento ${texto(a.documentoId).slice(0, 8)}…`
  return nome
}

/** Resultado de uma ferramenta de escrita, em uma frase para o chat. */
export function resumirResultado(nome: string, r: unknown): string {
  const o = (r ?? {}) as { criadas?: { subtarefaIds?: string[] }[]; id?: string }
  if (nome === 'criar_tarefas_em_lote' && o.criadas) {
    const subs = o.criadas.reduce((n, t) => n + (t.subtarefaIds?.length ?? 0), 0)
    return `${plural(o.criadas.length, 'tarefa criada', 'tarefas criadas')}${subs ? ` e ${plural(subs, 'subtarefa', 'subtarefas')}` : ''}`
  }
  if (o.id) return 'criado'
  return 'feito'
}
