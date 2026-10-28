import { lerAgrupamento } from './agrupamento'
import { PRIORIDADES, type Prioridade } from './tarefas'

export const PRAZOS = ['atrasadas', 'hoje', 'semana', 'sem-prazo'] as const
export type FiltroPrazo = (typeof PRAZOS)[number]
export const VISOES = ['lista', 'kanban', 'calendario', 'tabela', 'galeria', 'cronograma', 'carga', 'atividade', 'painel', 'documentos'] as const
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
  /** Campos personalizados mostrados nos itens do calendário (ids). */
  campos: string[]
  /** Esconde as tarefas concluídas (qualquer visualização). */
  semConcluidas: boolean
  /** 'e' = a tarefa precisa passar em todos os filtros; 'ou' = basta passar em um. */
  logica: 'e' | 'ou'
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

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
    campos: lista(sp, 'cal').filter((id) => UUID.test(id)),
    semConcluidas: valor(sp, 'semconcl') === '1',
    logica: valor(sp, 'logica') === 'ou' ? 'ou' : 'e',
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
  por('cal', f.campos)
  if (f.semConcluidas) sp.set('semconcl', '1')
  if (f.logica === 'ou') sp.set('logica', 'ou')
  return sp
}

/** Campos que formam um "filtro salvo" (o resto da URL é visão: tipo, grupo, calendário). */
const CAMPOS_FILTRO = ['responsaveis', 'status', 'prioridades', 'tags', 'prazo', 'clientes', 'mes', 'busca', 'semConcluidas', 'logica'] as const

/** Só a parte "filtro" de uma visualização, em texto (query string). */
export function filtrosEmTexto(f: Filtros): string {
  const base = lerFiltros({})
  return escreverFiltros({ ...base, ...Object.fromEntries(CAMPOS_FILTRO.map((c) => [c, f[c]])) }).toString()
}

/** Aplica um filtro salvo sobre a visualização atual, mantendo tipo de visão e agrupamento. */
export function aplicarFiltroSalvo(atual: Filtros, texto: string): Filtros {
  const salvo = lerFiltros(Object.fromEntries(new URLSearchParams(texto)))
  return { ...atual, ...Object.fromEntries(CAMPOS_FILTRO.map((c) => [c, salvo[c]])) } as Filtros
}

/** Filtro por "ou": a tarefa entra se casar com QUALQUER um dos filtros marcados (sem nenhum marcado, entra). Busca e mês continuam valendo sempre. */
export function passaPeloOu(t: { responsaveis: { id: string }[]; tags: { id: string }[]; statusId: string; prioridade: string; clienteId?: string | null; prazo: string | null; concluidaEm: string | null }, f: Filtros, hoje: string): boolean {
  const testes: boolean[] = []
  if (f.responsaveis.length) testes.push(t.responsaveis.some((r) => f.responsaveis.includes(r.id)))
  if (f.tags.length) testes.push(t.tags.some((x) => f.tags.includes(x.id)))
  if (f.status.length) testes.push(f.status.includes(t.statusId))
  if (f.prioridades.length) testes.push((f.prioridades as string[]).includes(t.prioridade))
  if (f.clientes.length) testes.push(!!t.clienteId && f.clientes.includes(t.clienteId))
  if (f.prazo) {
    const { de, ate, semPrazo } = prazoEm(f.prazo, hoje)
    testes.push(
      semPrazo ? t.prazo === null : t.prazo !== null && (!de || t.prazo >= de) && (!ate || t.prazo <= ate) && (f.prazo !== 'atrasadas' || t.concluidaEm === null),
    )
  }
  return testes.length === 0 || testes.some(Boolean)
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
