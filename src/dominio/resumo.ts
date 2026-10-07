import type { Categoria, TarefaResumo } from './tarefas'

export type LinhaResumo = { id: string; nome: string; total: number; emAndamento: number; concluidas: number; atrasadas: number }

/**
 * Conta tarefas por uma chave (departamento, cliente…). É o "núcleo comum" das três visões:
 * só usa campos que toda tarefa tem (etapa, prazo, conclusão), então funciona para qualquer departamento.
 */
export function resumirPor(
  tarefas: TarefaResumo[],
  chave: (tarefa: TarefaResumo) => { id: string; nome: string },
  categoria: (tarefa: TarefaResumo) => Categoria,
  hoje: string,
): LinhaResumo[] {
  const linhas = new Map<string, LinhaResumo>()
  for (const t of tarefas) {
    const { id, nome } = chave(t)
    const linha = linhas.get(id) ?? { id, nome, total: 0, emAndamento: 0, concluidas: 0, atrasadas: 0 }
    const cat = categoria(t)
    linha.total += 1
    if (cat === 'in_progress') linha.emAndamento += 1
    if (cat === 'done') linha.concluidas += 1
    if (cat !== 'done' && !t.concluidaEm && t.prazo && t.prazo < hoje) linha.atrasadas += 1
    linhas.set(id, linha)
  }
  return [...linhas.values()].sort((a, b) => b.total - a.total || a.nome.localeCompare(b.nome, 'pt-BR'))
}
