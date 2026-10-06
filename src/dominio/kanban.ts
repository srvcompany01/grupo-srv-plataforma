import { posicaoEntre } from './posicao'
import type { Categoria, StatusLista } from './tarefas'

/** Posição para um cartão solto no índice `indice` da coluna (contado sem o próprio cartão). */
export function posicaoAoSoltar(coluna: { id: string; posicao: string }[], movidoId: string, indice: number): string {
  const outros = coluna.filter((c) => c.id !== movidoId)
  const antes = outros[indice - 1]?.posicao ?? null
  const depois = outros[indice]?.posicao ?? null
  // No departamento a coluna mistura listas: vizinhos podem ter posições iguais ou fora de ordem.
  // A ordem só importa dentro da lista de cada tarefa, então basta ficar depois do vizinho de cima.
  if (antes !== null && depois !== null && antes >= depois) return posicaoEntre(antes, null)
  return posicaoEntre(antes, depois)
}

/** Primeiro status (na ordem da lista) de uma categoria. */
export function statusDaCategoria(status: StatusLista[], categoria: Categoria): string | null {
  return status.find((s) => s.categoria === categoria)?.id ?? null
}

export type GrupoPrazo = 'atrasadas' | 'hoje' | 'semana' | 'depois' | 'sem-prazo'

/** Para "Minhas tarefas". Concluída nunca conta como atrasada. */
export function grupoDePrazo(prazo: string | null, concluidaEm: string | null, hoje: string): GrupoPrazo {
  if (!prazo) return 'sem-prazo'
  if (prazo < hoje) return concluidaEm ? 'depois' : 'atrasadas'
  if (prazo === hoje) return 'hoje'
  const limite = new Date(`${hoje}T00:00:00Z`)
  limite.setUTCDate(limite.getUTCDate() + 6)
  return prazo <= limite.toISOString().slice(0, 10) ? 'semana' : 'depois'
}

/**
 * Índice (na coluna de destino, sem o cartão arrastado) onde o cartão deve entrar; null = não mover.
 * `sobreId` é o cartão sob o cursor ou o id da própria coluna (área vazia).
 * Na mesma coluna segue a semântica de arrayMove: o cartão ocupa o lugar do cartão sob o cursor.
 */
export function indiceAoSoltar(destino: { id: string }[], ativoId: string, sobreId: string, mesmaColuna: boolean): number | null {
  if (sobreId === ativoId) return null
  const sobre = destino.findIndex((t) => t.id === sobreId)
  if (!mesmaColuna) return sobre < 0 ? destino.length : sobre
  const de = destino.findIndex((t) => t.id === ativoId)
  const para = sobre < 0 ? destino.length - 1 : sobre
  return de === para ? null : para
}
