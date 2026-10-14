import { lerAgrupamento } from './agrupamento'
import { PRIORIDADES, type Prioridade } from './tarefas'

export const PRAZOS = ['atrasadas', 'hoje', 'semana', 'sem-prazo'] as const
export type FiltroPrazo = (typeof PRAZOS)[number]
export const VISOES = ['lista', 'kanban', 'calendario'] as const
export type VisaoTarefas = (typeof VISOES)[number]
/** No calendário: só as tarefas-mãe (entregas), só as subtarefas (postagens) ou as duas, separadas. */
export const NIVEIS_CALENDARIO = ['ambas', 'maes', 'subtarefas'] as const
export type NivelCalendario = (typeof NIVEIS_CALENDARIO)[number]

export type Filtros = {
  responsaveis: string[]
  status: string[]
  prioridades: Prioridade[]
  tags: string[]
  prazo: FiltroPrazo | null
  clientes: string[]
  /** YYYY-MM-01 */
  mes: string | null
  busca: string
  visao: VisaoTarefas
  /** 'status' | 'nenhum' | 'prioridade' | 'mes' | 'cliente' | 'responsavel' | 'etiqueta' | 'campo:<uuid>' */
  agrupamento: string
  niveis: NivelCalendario
}

type Params = Record<string, string | string[] | undefined>

const valor = (sp: Params, chave: string): string => {
  const v = sp[chave]
  return (Array.isArray(v) ? v[0] : v) ?? ''
}
const lista = (sp: Params, chave: string) => valor(sp, chave).split(',').filter(Boolean)
const de = <T extends string>(permitidos: readonly T[], v: string): v is T => (permitidos as readonly string[]).includes(v)

export function lerFiltros(sp: Params): Filtros {
  const prazo = valor(sp, 'prazo')
  const mes = valor(sp, 'mes')
  return {
    responsaveis: lista(sp, 'resp'),
    status: lista(sp, 'status'),
    prioridades: lista(sp, 'prio').filter((p): p is Prioridade => de(PRIORIDADES, p)),
    tags: lista(sp, 'tag'),
    prazo: de(PRAZOS, prazo) ? prazo : null,
    clientes: lista(sp, 'cliente'),
    mes: /^\d{4}-(0[1-9]|1[0-2])-01$/.test(mes) ? mes : null,
    busca: valor(sp, 'busca').trim().slice(0, 120),
    visao: de(VISOES, valor(sp, 'visao')) ? (valor(sp, 'visao') as VisaoTarefas) : 'lista',
    agrupamento: lerAgrupamento(valor(sp, 'grupo')),
    niveis: de(NIVEIS_CALENDARIO, valor(sp, 'niveis')) ? (valor(sp, 'niveis') as NivelCalendario) : 'ambas',
  }
}

export function escreverFiltros(f: Filtros): URLSearchParams {
  const sp = new URLSearchParams()
  const por = (chave: string, v: string[]) => v.length && sp.set(chave, v.join(','))
  por('resp', f.responsaveis)
  por('status', f.status)
  por('prio', f.prioridades)
  por('tag', f.tags)
  por('cliente', f.clientes)
  if (f.prazo) sp.set('prazo', f.prazo)
  if (f.mes) sp.set('mes', f.mes)
  if (f.busca) sp.set('busca', f.busca)
  if (f.visao !== 'lista') sp.set('visao', f.visao)
  if (f.agrupamento !== 'status') sp.set('grupo', f.agrupamento)
  if (f.niveis !== 'ambas') sp.set('niveis', f.niveis)
  return sp
}

/** Soma dias a uma data YYYY-MM-DD sem depender do fuso local. */
export function somarDias(iso: string, dias: number): string {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + dias)
  return d.toISOString().slice(0, 10)
}

export function prazoEm(filtro: FiltroPrazo | null, hoje: string): { de?: string; ate?: string; semPrazo?: true } {
  switch (filtro) {
    case 'atrasadas':
      return { ate: somarDias(hoje, -1) }
    case 'hoje':
      return { de: hoje, ate: hoje }
    case 'semana':
      return { de: hoje, ate: somarDias(hoje, 6) }
    case 'sem-prazo':
      return { semPrazo: true }
    default:
      return {}
  }
}

/** Data de hoje (YYYY-MM-DD) no fuso da agência. */
export function dataDeHoje(agora: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Belem' }).format(agora)
}
