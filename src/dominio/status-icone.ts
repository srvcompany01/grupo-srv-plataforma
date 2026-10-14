import type { Categoria, StatusLista } from './tarefas'

/** Como desenhar o ícone de um status: tracejado (a fazer), fatia que cresce (em andamento) ou cheio com visto (concluído). */
export type IconeStatusInfo = { categoria: Categoria; fracao: number }

/**
 * A fatia do ícone cresce conforme o status avança na lista: com K status "em andamento", o i-ésimo (1..K) preenche i/(K+1).
 * "A fazer" fica vazio (tracejado) e "concluído" fica cheio.
 */
export function iconeDoStatus(opcoes: Pick<StatusLista, 'id' | 'categoria'>[], statusId: string): IconeStatusInfo {
  const atual = opcoes.find((s) => s.id === statusId)
  if (!atual || atual.categoria === 'todo') return { categoria: 'todo', fracao: 0 }
  if (atual.categoria === 'done') return { categoria: 'done', fracao: 1 }
  const andamento = opcoes.filter((s) => s.categoria === 'in_progress')
  return { categoria: 'in_progress', fracao: (andamento.findIndex((s) => s.id === statusId) + 1) / (andamento.length + 1) }
}

/** Branco ou quase preto, o que ler melhor sobre a cor #rrggbb. */
export function textoSobreCor(hex: string): '#ffffff' | '#26292e' {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex)
  if (!m) return '#ffffff'
  const [r, g, b] = [m[1], m[2], m[3]].map((p) => parseInt(p, 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.45 ? '#26292e' : '#ffffff'
}
