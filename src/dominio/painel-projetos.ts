import { dataLocal, semanaDe, somarDias } from './agenda'
import { segundosDecorridos } from './tempo'
import type { Categoria } from './tarefas'

/**
 * Painel dos projetos: foco (tempo investido) e andamento (tarefas) por linha. Uma linha é um projeto (lista do
 * espaço de projetos) ou, dentro de um projeto, uma tarefa principal com as subtarefas dela.
 * Conta só as tarefas "folha" (sem subtarefas): a tarefa-mãe é um agrupamento, contá-la junto duplicaria.
 */

export type TarefaPainel = { id: string; paiId: string | null; listaId: string; titulo: string; categoria: Categoria; concluidaEm: string | null; prazo: string | null }
export type RegistroPainel = { tarefaId: string; usuarioId: string; inicio: string; fim: string | null; segundos: number | null }
export type LinhaBase = { id: string; nome: string; cor: string; href: string; detalhe?: string }
export type Saude = 'saudavel' | 'atencao' | 'concluido' | 'vazio'

export type LinhaPainel = LinhaBase & {
  segundosPeriodo: number
  segundosTotal: number
  /** Fatia do tempo do período (0–1). */
  participacao: number
  total: number
  concluidas: number
  concluidasPeriodo: number
  emAndamento: number
  pendentes: number
  atrasadas: number
  ultimaAtividade: string | null
  saude: Saude
}

export type Painel = {
  linhas: LinhaPainel[]
  totais: Omit<LinhaPainel, keyof LinhaBase | 'participacao' | 'ultimaAtividade' | 'saude'>
  semanas: { inicio: string; segundos: number }[]
  inicioPeriodo: string
}

export const PERIODOS_PAINEL = [7, 30, 90] as const
export const lerPeriodoPainel = (v: string | undefined) => ((PERIODOS_PAINEL as readonly number[]).includes(Number(v)) ? Number(v) : 30)

/** Sem tempo lançado nem tarefa concluída há tantos dias, um projeto com tarefas abertas pede atenção. */
export const DIAS_SEM_ATIVIDADE = 7

/** "12h 30min", "45min", "0min". */
export function formatarDuracao(segundos: number): string {
  const min = Math.round(segundos / 60)
  const h = Math.floor(min / 60)
  return h ? `${h}h${min % 60 ? ` ${min % 60}min` : ''}` : `${min}min`
}

export function montarPainel(p: {
  linhas: LinhaBase[]
  /** Linha de cada tarefa (null = fica de fora). */
  linhaDa: (t: TarefaPainel) => string | null
  tarefas: TarefaPainel[]
  registros: RegistroPainel[]
  hoje: string
  dias: number
  agoraMs: number
  /** Últimas N semanas no gráfico de tempo. */
  semanas?: number
}): Painel {
  const inicioPeriodo = somarDias(p.hoje, -(p.dias - 1))
  const limiteAtividade = somarDias(p.hoje, -(DIAS_SEM_ATIVIDADE - 1))
  const comFilhos = new Set(p.tarefas.flatMap((t) => (t.paiId ? [t.paiId] : [])))
  const linhaDaTarefa = new Map(p.tarefas.map((t) => [t.id, p.linhaDa(t)]))
  const vazia = () => ({ segundosPeriodo: 0, segundosTotal: 0, total: 0, concluidas: 0, concluidasPeriodo: 0, emAndamento: 0, pendentes: 0, atrasadas: 0, ultimaAtividade: null as string | null })
  const acc = new Map(p.linhas.map((l) => [l.id, vazia()]))
  const marcar = (a: ReturnType<typeof vazia>, dia: string) => { if (!a.ultimaAtividade || dia > a.ultimaAtividade) a.ultimaAtividade = dia }

  for (const t of p.tarefas) {
    const a = acc.get(linhaDaTarefa.get(t.id) ?? '')
    if (!a || comFilhos.has(t.id)) continue
    a.total++
    if (t.categoria === 'done') {
      a.concluidas++
      if (t.concluidaEm) {
        const dia = dataLocal(t.concluidaEm)
        if (dia >= inicioPeriodo) a.concluidasPeriodo++
        marcar(a, dia)
      }
    } else {
      if (t.categoria === 'in_progress') a.emAndamento++
      else a.pendentes++
      if (t.prazo && t.prazo < p.hoje) a.atrasadas++
    }
  }

  const n = p.semanas ?? 8
  const semanas = Array.from({ length: n }, (_, i) => ({ inicio: semanaDe(somarDias(p.hoje, -7 * (n - 1 - i)))[0], segundos: 0 }))
  for (const r of p.registros) {
    const a = acc.get(linhaDaTarefa.get(r.tarefaId) ?? '')
    if (!a) continue
    const s = r.segundos ?? (r.fim === null ? segundosDecorridos(r.inicio, p.agoraMs) : 0)
    const dia = dataLocal(r.inicio)
    a.segundosTotal += s
    if (dia >= inicioPeriodo) a.segundosPeriodo += s
    marcar(a, dia)
    const semana = semanas.findLast((x) => x.inicio <= dia)
    if (semana && dia <= p.hoje) semana.segundos += s
  }

  const somaPeriodo = [...acc.values()].reduce((s, a) => s + a.segundosPeriodo, 0)
  const linhas: LinhaPainel[] = p.linhas.map((l) => {
    const a = acc.get(l.id)!
    const abertas = a.emAndamento + a.pendentes
    const saude: Saude = a.total === 0 && a.segundosTotal === 0 ? 'vazio' : abertas === 0 && a.total > 0 ? 'concluido' : a.ultimaAtividade && a.ultimaAtividade >= limiteAtividade ? 'saudavel' : 'atencao'
    return { ...l, ...a, participacao: somaPeriodo ? a.segundosPeriodo / somaPeriodo : 0, saude }
  }).sort((x, y) => y.segundosPeriodo - x.segundosPeriodo || y.segundosTotal - x.segundosTotal || x.nome.localeCompare(y.nome))

  const somar = (k: keyof ReturnType<typeof vazia>) => linhas.reduce((s, l) => s + (l[k] as number), 0)
  return {
    linhas,
    totais: { segundosPeriodo: somaPeriodo, segundosTotal: somar('segundosTotal'), total: somar('total'), concluidas: somar('concluidas'), concluidasPeriodo: somar('concluidasPeriodo'), emAndamento: somar('emAndamento'), pendentes: somar('pendentes'), atrasadas: somar('atrasadas') },
    semanas,
    inicioPeriodo,
  }
}
