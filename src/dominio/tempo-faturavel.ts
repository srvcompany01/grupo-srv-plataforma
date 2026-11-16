// Tempo faturável: filtros do resumo (na URL), agregação por cliente/pessoa e exportação em CSV.

export type PeriodoTempo = 'semana' | 'mes' | 'intervalo'
export type FiltroFaturavel = 'todos' | 'sim' | 'nao'
export const SEM_CLIENTE = 'sem'

export type FiltrosTempo = {
  periodo: PeriodoTempo
  /** `YYYY-MM-DD`, inclusive. */
  de: string
  ate: string
  /** Ids de cliente; `SEM_CLIENTE` inclui as tarefas sem cliente. Vazio = todos. */
  clientes: string[]
  pessoas: string[]
  faturavel: FiltroFaturavel
}

const DATA = /^\d{4}-\d{2}-\d{2}$/
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
type Params = Record<string, string | string[] | undefined>
const valor = (sp: Params, chave: string): string => {
  const v = sp[chave]
  return (Array.isArray(v) ? v[0] : v) ?? ''
}
const lista = (sp: Params, chave: string) => valor(sp, chave).split(',').filter(Boolean)

function paraMs(iso: string): number {
  const [a, m, d] = iso.split('-').map(Number)
  return Date.UTC(a, m - 1, d)
}
const deMs = (ms: number) => new Date(ms).toISOString().slice(0, 10)
const dataValida = (iso: string) => DATA.test(iso) && deMs(paraMs(iso)) === iso

export function somarDiasIso(iso: string, dias: number): string {
  return deMs(paraMs(iso) + dias * 86_400_000)
}

/** Segunda a domingo da semana de `iso`. */
export function semanaDe(iso: string): { de: string; ate: string } {
  const dow = new Date(paraMs(iso)).getUTCDay() // 0 = domingo
  const de = somarDiasIso(iso, -((dow + 6) % 7))
  return { de, ate: somarDiasIso(de, 6) }
}

/** Primeiro e último dia do mês de `iso`. */
export function mesDe(iso: string): { de: string; ate: string } {
  const [a, m] = iso.split('-').map(Number)
  return { de: deMs(Date.UTC(a, m - 1, 1)), ate: deMs(Date.UTC(a, m, 0)) }
}

export function periodoPadrao(periodo: PeriodoTempo, hoje: string): { de: string; ate: string } {
  return periodo === 'semana' ? semanaDe(hoje) : mesDe(hoje)
}

/** Lê `?periodo=mes&de=…&ate=…&cliente=…&pessoa=…&faturavel=sim`. Sem datas válidas usa o período atual. */
export function lerFiltrosTempo(sp: Params, hoje: string): FiltrosTempo {
  const p = valor(sp, 'periodo')
  const periodo: PeriodoTempo = p === 'semana' || p === 'intervalo' ? p : 'mes'
  const base = periodoPadrao(periodo === 'intervalo' ? 'mes' : periodo, hoje)
  let de = dataValida(valor(sp, 'de')) ? valor(sp, 'de') : base.de
  let ate = dataValida(valor(sp, 'ate')) ? valor(sp, 'ate') : base.ate
  if (ate < de) [de, ate] = [ate, de]
  const f = valor(sp, 'faturavel')
  return {
    periodo,
    de,
    ate,
    clientes: lista(sp, 'cliente').filter((c) => c === SEM_CLIENTE || UUID.test(c)),
    pessoas: lista(sp, 'pessoa').filter((c) => UUID.test(c)),
    faturavel: f === 'sim' || f === 'nao' ? f : 'todos',
  }
}

export function escreverFiltrosTempo(f: FiltrosTempo): URLSearchParams {
  const sp = new URLSearchParams({ periodo: f.periodo, de: f.de, ate: f.ate })
  if (f.clientes.length) sp.set('cliente', f.clientes.join(','))
  if (f.pessoas.length) sp.set('pessoa', f.pessoas.join(','))
  if (f.faturavel !== 'todos') sp.set('faturavel', f.faturavel)
  return sp
}

/** Anda uma semana ou um mês (`direcao` = -1 ou 1). No intervalo livre, anda o mesmo número de dias. */
export function moverPeriodo(f: FiltrosTempo, direcao: -1 | 1): { de: string; ate: string } {
  if (f.periodo === 'semana') return { de: somarDiasIso(f.de, 7 * direcao), ate: somarDiasIso(f.ate, 7 * direcao) }
  if (f.periodo === 'mes') {
    const [a, m] = f.de.split('-').map(Number)
    return mesDe(deMs(Date.UTC(a, m - 1 + direcao, 1)))
  }
  const dias = Math.round((paraMs(f.ate) - paraMs(f.de)) / 86_400_000) + 1
  return { de: somarDiasIso(f.de, dias * direcao), ate: somarDiasIso(f.ate, dias * direcao) }
}

export function temFiltroAtivo(f: FiltrosTempo): boolean {
  return f.clientes.length > 0 || f.pessoas.length > 0 || f.faturavel !== 'todos'
}

/** Argumentos das funções SQL `resumo_tempo` e `registros_tempo`. */
export function argumentosSql(f: FiltrosTempo) {
  const clientes = f.clientes.filter((c) => c !== SEM_CLIENTE)
  return {
    p_de: f.de,
    p_ate: f.ate,
    p_clientes: clientes.length ? clientes : undefined,
    p_sem_cliente: f.clientes.includes(SEM_CLIENTE),
    p_pessoas: f.pessoas.length ? f.pessoas : undefined,
    p_faturavel: f.faturavel === 'sim' ? true : f.faturavel === 'nao' ? false : undefined,
  }
}

// ---------------------------------------------------------------- agregação

export type LinhaResumo = {
  clienteId: string | null
  clienteNome: string
  pessoaId: string
  pessoaNome: string
  total: number
  faturavel: number
  registros: number
}

export type Totais = { total: number; faturavel: number; naoFaturavel: number; percentual: number }

export const percentualFaturavel = (faturavel: number, total: number) => (total > 0 ? Math.round((faturavel / total) * 100) : 0)

export function somar(linhas: { total: number; faturavel: number }[]): Totais {
  const total = linhas.reduce((s, l) => s + l.total, 0)
  const faturavel = linhas.reduce((s, l) => s + l.faturavel, 0)
  return { total, faturavel, naoFaturavel: total - faturavel, percentual: percentualFaturavel(faturavel, total) }
}

export type GrupoResumo = Totais & { id: string | null; nome: string; filhos: (Totais & { id: string | null; nome: string })[] }
export type OrdemResumo = { coluna: 'nome' | 'total' | 'faturavel' | 'naoFaturavel' | 'percentual'; direcao: 'asc' | 'desc' }

const ROTULO_SEM_CLIENTE = 'Sem cliente'

/** Por cliente (com as pessoas dentro) ou por pessoa (com os clientes dentro). "Sem cliente" vai sempre por último nas ordenações por nome. */
export function agrupar(linhas: LinhaResumo[], por: 'cliente' | 'pessoa', ordem: OrdemResumo = { coluna: 'total', direcao: 'desc' }): GrupoResumo[] {
  const grupos = new Map<string, { id: string | null; nome: string; linhas: LinhaResumo[] }>()
  for (const l of linhas) {
    const id = por === 'cliente' ? l.clienteId : l.pessoaId
    const chave = id ?? '__sem'
    const g = grupos.get(chave) ?? { id, nome: por === 'cliente' ? (l.clienteId ? l.clienteNome : ROTULO_SEM_CLIENTE) : l.pessoaNome, linhas: [] }
    g.linhas.push(l)
    grupos.set(chave, g)
  }
  const comparar = <T extends Totais & { nome: string }>(a: T, b: T) => {
    const sinal = ordem.direcao === 'asc' ? 1 : -1
    if (ordem.coluna === 'nome') return sinal * a.nome.localeCompare(b.nome, 'pt-BR')
    return sinal * (a[ordem.coluna] - b[ordem.coluna]) || a.nome.localeCompare(b.nome, 'pt-BR')
  }
  return [...grupos.values()]
    .map((g) => ({
      id: g.id,
      nome: g.nome,
      ...somar(g.linhas),
      filhos: g.linhas
        .map((l) => ({
          id: por === 'cliente' ? l.pessoaId : l.clienteId,
          nome: por === 'cliente' ? l.pessoaNome : l.clienteId ? l.clienteNome : ROTULO_SEM_CLIENTE,
          ...somar([l]),
        }))
        .sort(comparar),
    }))
    .sort(comparar)
}

/** "Faturável: 96 horas e 15 minutos, 75%": o texto lido por leitor de tela. */
export function duracaoPorExtenso(segundos: number): string {
  const min = Math.floor(segundos / 60)
  const h = Math.floor(min / 60)
  const m = min % 60
  const horas = `${h} ${h === 1 ? 'hora' : 'horas'}`
  const minutos = `${m} ${m === 1 ? 'minuto' : 'minutos'}`
  if (!h) return minutos
  return m ? `${horas} e ${minutos}` : horas
}

// ---------------------------------------------------------------- CSV

export type RegistroCsv = {
  dia: string
  clienteNome: string | null
  listaNome: string
  tarefaTitulo: string
  pessoaNome: string
  nota: string | null
  segundos: number
  faturavel: boolean
}

/** Horas em decimal com vírgula (1h15 = "1,25"). */
export function horasDecimais(segundos: number): string {
  return (Math.round((segundos / 3600) * 100) / 100).toString().replace('.', ',')
}

/** Célula do CSV: aspas quando preciso, e prefixo `'` contra fórmulas (=, +, -, @) abertas no Excel. */
export function celulaCsv(texto: string): string {
  const seguro = /^[=+\-@\t\r]/.test(texto) ? `'${texto}` : texto
  return /[;"\r\n]/.test(seguro) ? `"${seguro.replace(/"/g, '""')}"` : seguro
}

const dataBr = (iso: string) => iso.split('-').reverse().join('/')

/** CSV (`;`, UTF-8 com BOM, linhas CRLF) com um registro por linha. */
export function gerarCsvTempo(registros: RegistroCsv[]): string {
  const cabecalho = ['Data', 'Cliente', 'Lista', 'Tarefa', 'Pessoa', 'Nota', 'Horas', 'Faturável']
  const linhas = registros.map((r) =>
    [dataBr(r.dia), r.clienteNome ?? ROTULO_SEM_CLIENTE, r.listaNome, r.tarefaTitulo, r.pessoaNome, r.nota ?? '', horasDecimais(r.segundos), r.faturavel ? 'Sim' : 'Não'].map(celulaCsv).join(';'),
  )
  return `﻿${[cabecalho.join(';'), ...linhas].join('\r\n')}\r\n`
}

export const nomeArquivoCsvTempo = (de: string, ate: string) => `tempo-${de}_a_${ate}.csv`
