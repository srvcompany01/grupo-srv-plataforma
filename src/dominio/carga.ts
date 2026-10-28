import { somarDias } from './filtros'
import type { Pessoa, TarefaResumo } from './tarefas'

export const DIAS_DA_CARGA = 14

export type LinhaCarga = {
  pessoa: Pessoa | null
  atrasadas: number
  /** Um número por dia a partir de hoje (DIAS_DA_CARGA dias). */
  dias: number[]
  depois: number
  semData: number
  total: number
}

/** Tarefas abertas por pessoa: atrasadas, cada um dos próximos dias, depois disso e sem data. `null` = sem responsável. */
export function calcularCarga(tarefas: TarefaResumo[], hoje: string): LinhaCarga[] {
  const ultimo = somarDias(hoje, DIAS_DA_CARGA - 1)
  const linhas = new Map<string, LinhaCarga>()
  for (const t of tarefas) {
    if (t.concluidaEm) continue
    for (const pessoa of t.responsaveis.length ? t.responsaveis : [null]) {
      const chave = pessoa?.id ?? ''
      const l = linhas.get(chave) ?? { pessoa, atrasadas: 0, dias: Array(DIAS_DA_CARGA).fill(0), depois: 0, semData: 0, total: 0 }
      l.total++
      if (!t.prazo) l.semData++
      else if (t.prazo < hoje) l.atrasadas++
      else if (t.prazo > ultimo) l.depois++
      else l.dias[Math.round((Date.parse(t.prazo) - Date.parse(hoje)) / 86400000)]++
      linhas.set(chave, l)
    }
  }
  return [...linhas.values()].sort((a, b) => b.total - a.total)
}
