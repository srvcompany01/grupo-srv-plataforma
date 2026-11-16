import type { PeriodoAnuncios } from './periodo-anuncios'
import { consultaPeriodo, diasDoPeriodo } from './periodo-anuncios'

export type CanalAnuncios = 'todos' | 'meta' | 'google'
export type AbaAnuncios = 'visao' | 'campanhas' | 'criativos' | 'aprovacoes'
export type SerieInvestimento = { dia: string; meta: number; google: number }
export type ResumoCanalAnuncios = {
  gasto: number | null
  cliques: number | null
  resultados: number | null
  gastoCaptacao: number | null
  ativas: number | null
  pausadas: number | null
  dias: { dia: string; gasto: number }[]
}
export type ContaAnuncios = { id: string; nome: string; meta: ResumoCanalAnuncios | null; google: ResumoCanalAnuncios | null; erros: string[] }

export function lerAbaAnuncios(aba: unknown): AbaAnuncios {
  return aba === 'campanhas' || aba === 'criativos' || aba === 'aprovacoes' ? aba : 'visao'
}
export function lerCanalAnuncios(canal: unknown): CanalAnuncios {
  return canal === 'meta' || canal === 'google' ? canal : 'todos'
}

export function urlAnuncios({ cliente, periodo, canal = 'todos', aba = 'visao' }: { cliente?: string | null; periodo: PeriodoAnuncios; canal?: CanalAnuncios; aba?: AbaAnuncios }) {
  const q = new URLSearchParams(consultaPeriodo(periodo))
  if (cliente) q.set('cliente', cliente)
  if (canal !== 'todos') q.set('canal', canal)
  if (aba !== 'visao') q.set('aba', aba)
  return `/anuncios${q.size ? `?${q}` : ''}`
}

/** Ausência de acesso não é zero; somamos apenas os valores que a conta conseguiu devolver. */
export function somarDisponiveis(valores: (number | null | undefined)[]): number | null {
  const disponiveis = valores.filter((n): n is number => typeof n === 'number' && Number.isFinite(n))
  return disponiveis.length ? disponiveis.reduce((s, n) => s + n, 0) : null
}

export function resumirContasAnuncios(contas: ContaAnuncios[]) {
  const meta = contas.map(c => c.meta)
  const google = contas.map(c => c.google)
  const leads = somarDisponiveis(meta.map(c => c?.resultados))
  // Usa somente o investimento em captação das contas cujo resultado foi carregado.
  const gastoCaptacao = somarDisponiveis(meta.filter(c => c?.resultados !== null).map(c => c?.gastoCaptacao))
  const canais = [...meta, ...google]
  return {
    gasto: somarDisponiveis(canais.map(c => c?.gasto)),
    meta: somarDisponiveis(meta.map(c => c?.gasto)),
    google: somarDisponiveis(google.map(c => c?.gasto)),
    leads,
    cpl: leads && gastoCaptacao !== null ? gastoCaptacao / leads : null,
    conversoes: somarDisponiveis(google.map(c => c?.resultados)),
    ativas: somarDisponiveis(canais.map(c => c?.ativas)),
    pausadas: somarDisponiveis(canais.map(c => c?.pausadas)),
    cliques: somarDisponiveis(canais.map(c => c?.cliques)),
    erros: contas.flatMap(c => c.erros.map(erro => `${c.nome}: ${erro}`)),
  }
}

export function serieContasAnuncios(contas: ContaAnuncios[], periodo: PeriodoAnuncios): SerieInvestimento[] {
  const meta = new Map<string, number>(), google = new Map<string, number>()
  for (const conta of contas) for (const canal of ['meta', 'google'] as const) {
    const mapa = canal === 'meta' ? meta : google
    for (const d of conta[canal]?.dias ?? []) mapa.set(d.dia, (mapa.get(d.dia) ?? 0) + d.gasto)
  }
  return diasDoPeriodo(periodo).map(dia => ({ dia, meta: meta.get(dia) ?? 0, google: google.get(dia) ?? 0 }))
}
