export type Frequencia = 'daily' | 'weekdays' | 'weekly' | 'monthly'
/** Mensal: no mesmo dia do mês ("dia 24") ou na mesma posição da semana ("4ª segunda-feira"). */
export type ModoMensal = 'day' | 'weekday_position'
/** Quando a próxima tarefa nasce: na data programada (cron) ou quando a anterior é concluída. */
export type ModoCriacao = 'schedule' | 'on_complete'

export type Recorrencia = {
  frequencia: Frequencia
  cada: number
  antecedencia: number
  ativa: boolean
  geradas: number
  /** Prazo da primeira cópia (a âncora). */
  primeiroPrazo: string
  /** Só no semanal: 1 = segunda ... 7 = domingo. `null` = o dia da semana da âncora. */
  diasSemana: number[] | null
  modoMensal: ModoMensal
  /** Última data possível de uma cópia (`YYYY-MM-DD`). */
  terminaEm: string | null
  /** Máximo de ocorrências. */
  maximo: number | null
  modoCriacao: ModoCriacao
  copiarResponsaveis: boolean
  copiarSubtarefas: boolean
  /** Etiquetas e campos personalizados. */
  copiarCampos: boolean
}

/** O que o usuário edita no formulário "Repetir" (o resto é estado da série). */
export type RegraRecorrencia = Omit<Recorrencia, 'geradas'>

export const FREQUENCIAS: { valor: Frequencia; singular: string; plural: string }[] = [
  { valor: 'daily', singular: 'dia', plural: 'dias' },
  { valor: 'weekdays', singular: 'dia útil', plural: 'dias úteis' },
  { valor: 'weekly', singular: 'semana', plural: 'semanas' },
  { valor: 'monthly', singular: 'mês', plural: 'meses' },
]

export const DIAS_DA_SEMANA = [
  { numero: 1, letra: 'S', curto: 'seg', longo: 'segunda-feira' },
  { numero: 2, letra: 'T', curto: 'ter', longo: 'terça-feira' },
  { numero: 3, letra: 'Q', curto: 'qua', longo: 'quarta-feira' },
  { numero: 4, letra: 'Q', curto: 'qui', longo: 'quinta-feira' },
  { numero: 5, letra: 'S', curto: 'sex', longo: 'sexta-feira' },
  { numero: 6, letra: 'S', curto: 'sáb', longo: 'sábado' },
  { numero: 7, letra: 'D', curto: 'dom', longo: 'domingo' },
] as const

export const REGRA_PADRAO: Omit<RegraRecorrencia, 'primeiroPrazo'> = {
  frequencia: 'weekly',
  cada: 1,
  antecedencia: 0,
  ativa: true,
  diasSemana: null,
  modoMensal: 'day',
  terminaEm: null,
  maximo: null,
  modoCriacao: 'schedule',
  copiarResponsaveis: true,
  copiarSubtarefas: true,
  copiarCampos: true,
}

/** "Repete todo mês" / "Repete a cada 2 semanas". */
export function descreverRecorrencia(r: Pick<Recorrencia, 'frequencia' | 'cada'>): string {
  if (r.frequencia === 'weekdays') return 'Repete nos dias úteis'
  const f = FREQUENCIAS.find((x) => x.valor === r.frequencia)!
  if (r.cada === 1) return `Repete ${r.frequencia === 'monthly' ? 'todo' : 'toda'} ${f.singular}`
  return `Repete a cada ${r.cada} ${f.plural}`
}

// ---------------------------------------------------------------- datas (sempre `YYYY-MM-DD`, em UTC para não depender do fuso)

const DIA_MS = 86_400_000

function paraDia(iso: string): number {
  const [a, m, d] = iso.split('-').map(Number)
  return Date.UTC(a, m - 1, d)
}
function deDia(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10)
}
/** 1 = segunda ... 7 = domingo. */
function diaDaSemanaIso(ms: number): number {
  const d = new Date(ms).getUTCDay()
  return d === 0 ? 7 : d
}
function somarMeses(ms: number, meses: number): number {
  const base = new Date(ms)
  const alvo = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + meses, 1))
  const ultimo = new Date(Date.UTC(alvo.getUTCFullYear(), alvo.getUTCMonth() + 1, 0)).getUTCDate()
  return Date.UTC(alvo.getUTCFullYear(), alvo.getUTCMonth(), Math.min(base.getUTCDate(), ultimo))
}

type RegraDeData = Pick<Recorrencia, 'frequencia' | 'cada' | 'primeiroPrazo' | 'diasSemana' | 'modoMensal'>

/**
 * Data da n-ésima ocorrência (n começa em 0), a partir da âncora. É a mesma regra da função SQL
 * `prazo_da_recorrencia` (um teste compara as duas): a prévia e o calendário não divergem do servidor.
 */
export function prazoDaOcorrencia(regra: RegraDeData, n: number): string {
  const ancora = paraDia(regra.primeiroPrazo)
  const dow = diaDaSemanaIso(ancora)
  switch (regra.frequencia) {
    case 'daily':
      return deDia(ancora + regra.cada * n * DIA_MS)
    case 'weekdays': {
      const inicio = ancora + (dow === 6 ? 2 : dow === 7 ? 1 : 0) * DIA_MS
      const d = diaDaSemanaIso(inicio) - 1
      const total = d + n
      return deDia(inicio + (-d + Math.floor(total / 5) * 7 + (total % 5)) * DIA_MS)
    }
    case 'weekly': {
      const dias = [...new Set(regra.diasSemana?.length ? regra.diasSemana : [dow])].sort((a, b) => a - b)
      const segunda = ancora - (dow - 1) * DIA_MS
      const primeira = dias.filter((x) => x >= dow).length
      if (n < primeira) return deDia(segunda + (dias[dias.length - primeira + n] - 1) * DIA_MS)
      const idx = n - primeira
      return deDia(segunda + (7 * regra.cada * (1 + Math.floor(idx / dias.length)) + dias[idx % dias.length] - 1) * DIA_MS)
    }
    case 'monthly': {
      if (regra.modoMensal !== 'weekday_position') return deDia(somarMeses(ancora, regra.cada * n))
      const diaDoMes = new Date(ancora).getUTCDate()
      const mes = somarMeses(ancora - (diaDoMes - 1) * DIA_MS, regra.cada * n)
      const posicao = Math.floor((diaDoMes + 6) / 7)
      const primeiro = mes + ((dow - diaDaSemanaIso(mes) + 7) % 7) * DIA_MS
      if (posicao >= 5) {
        const candidato = primeiro + 28 * DIA_MS
        return deDia(candidato >= somarMeses(mes, 1) ? candidato - 7 * DIA_MS : candidato)
      }
      return deDia(primeiro + 7 * (posicao - 1) * DIA_MS)
    }
  }
}

type RegraDeSerie = RegraDeData & Pick<Recorrencia, 'geradas' | 'terminaEm' | 'maximo'>

/** Próximas datas da série, a partir da primeira ainda não criada, respeitando o fim. */
export function proximasDatas(regra: RegraDeSerie, quantidade: number): string[] {
  const datas: string[] = []
  for (let n = regra.geradas; datas.length < quantidade && n < regra.geradas + 1000; n++) {
    if (regra.maximo != null && n >= regra.maximo) break
    const data = prazoDaOcorrencia(regra, n)
    if (regra.terminaEm && data > regra.terminaEm) break
    datas.push(data)
  }
  return datas
}

/** Ocorrências previstas dentro de `[de, ate]`, no máximo uma por dia (para o calendário). */
export function ocorrenciasNoIntervalo(regra: RegraDeSerie, de: string, ate: string): string[] {
  const datas: string[] = []
  for (let n = regra.geradas; n < regra.geradas + 2000; n++) {
    if (regra.maximo != null && n >= regra.maximo) break
    const data = prazoDaOcorrencia(regra, n)
    if (data > ate || (regra.terminaEm && data > regra.terminaEm)) break
    if (data >= de && datas[datas.length - 1] !== data) datas.push(data)
  }
  return datas
}

/** A série já criou tudo o que podia (fim por contagem ou por data)? */
export function serieConcluida(regra: RegraDeSerie): boolean {
  return proximasDatas(regra, 1).length === 0
}

// ---------------------------------------------------------------- texto

/** "27/11" de `2026-11-27`; com ano quando `comAno`. */
export function dataCurtaBr(iso: string, comAno = false): string {
  const [a, m, d] = iso.split('-')
  return comAno ? `${d}/${m}/${a}` : `${d}/${m}`
}

function listarDias(dias: number[]): string {
  const nomes = [...dias].sort((a, b) => a - b).map((n) => DIAS_DA_SEMANA[n - 1].curto)
  if (nomes.length <= 1) return nomes.join('')
  return `${nomes.slice(0, -1).join(', ')} e ${nomes[nomes.length - 1]}`
}

/** "na 4ª segunda-feira" / "no último sábado", a partir da data de início. */
export function descreverPosicaoMensal(primeiroPrazo: string): string {
  const ms = paraDia(primeiroPrazo)
  const posicao = Math.min(5, Math.floor((new Date(ms).getUTCDate() + 6) / 7))
  const dia = DIAS_DA_SEMANA[diaDaSemanaIso(ms) - 1].longo
  const feminino = dia.endsWith('feira')
  const ordinal = posicao === 5 ? (feminino ? 'última' : 'último') : `${posicao}${feminino ? 'ª' : 'º'}`
  return `${feminino ? 'na' : 'no'} ${ordinal} ${dia}`
}

/** Resumo da regra, como na linha "Repetir": "Toda semana · seg e qui", "Todo dia útil", "Todo mês · no dia 24". */
export function resumirRecorrencia(r: RegraDeData): string {
  switch (r.frequencia) {
    case 'daily':
      return r.cada === 1 ? 'Todo dia' : `A cada ${r.cada} dias`
    case 'weekdays':
      return 'Todo dia útil'
    case 'weekly': {
      const base = r.cada === 1 ? 'Toda semana' : `A cada ${r.cada} semanas`
      const dias = r.diasSemana?.length ? r.diasSemana : [diaDaSemanaIso(paraDia(r.primeiroPrazo))]
      return `${base} · ${listarDias(dias)}`
    }
    case 'monthly': {
      const base = r.cada === 1 ? 'Todo mês' : `A cada ${r.cada} meses`
      if (r.modoMensal === 'weekday_position') return `${base} · ${descreverPosicaoMensal(r.primeiroPrazo)}`
      return `${base} · no dia ${Number(r.primeiroPrazo.slice(8))}`
    }
  }
}

/** Mensagem de erro de validação (pt-BR) ou `null` quando a regra está boa. */
export function validarRecorrencia(
  r: Pick<RegraRecorrencia, 'frequencia' | 'cada' | 'antecedencia' | 'primeiroPrazo' | 'diasSemana' | 'terminaEm' | 'maximo'>,
): string | null {
  const data = /^\d{4}-\d{2}-\d{2}$/
  if (!data.test(r.primeiroPrazo)) return 'Informe a data de início.'
  if (!Number.isInteger(r.cada) || r.cada < 1 || r.cada > 365) return 'Use um número de 1 a 365.'
  if (!Number.isInteger(r.antecedencia) || r.antecedencia < 0 || r.antecedencia > 60) return 'A antecedência deve ficar entre 0 e 60 dias.'
  if (r.frequencia === 'weekly' && r.diasSemana && r.diasSemana.length === 0) return 'Escolha pelo menos um dia.'
  if (r.diasSemana?.some((d) => !Number.isInteger(d) || d < 1 || d > 7)) return 'Dia da semana inválido.'
  if (r.terminaEm && (!data.test(r.terminaEm) || r.terminaEm <= r.primeiroPrazo)) return 'A data de fim precisa ser depois do início.'
  if (r.maximo != null && (!Number.isInteger(r.maximo) || r.maximo < 1 || r.maximo > 1000)) return 'Use de 1 a 1000 vezes.'
  return null
}

/** "próxima em 27/11" (ou `null` se a série já acabou). */
export function textoProxima(regra: RegraDeSerie): string | null {
  const [proxima] = proximasDatas(regra, 1)
  return proxima ? `próxima em ${dataCurtaBr(proxima)}` : null
}
