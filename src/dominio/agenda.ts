import { dataDeHoje } from './filtros'

/** Agenda da equipe. Horários sempre no fuso de Belém (UTC−3 o ano todo, sem horário de verão). */

export type Visibilidade = 'privado' | 'equipe' | 'selecionados'
export type Repeticao = 'nunca' | 'diario' | 'semanal' | 'mensal'

export const VISIBILIDADES: { valor: Visibilidade; rotulo: string }[] = [
  { valor: 'privado', rotulo: 'Só eu' },
  { valor: 'equipe', rotulo: 'Toda a equipe' },
  { valor: 'selecionados', rotulo: 'Pessoas selecionadas' },
]
export const REPETICOES: { valor: Repeticao; rotulo: string }[] = [
  { valor: 'nunca', rotulo: 'Não repete' },
  { valor: 'diario', rotulo: 'Todo dia' },
  { valor: 'semanal', rotulo: 'Toda semana' },
  { valor: 'mensal', rotulo: 'Todo mês' },
]

export type Compromisso = {
  id: string
  titulo: string
  descricao: string
  inicio: string // ISO
  fim: string // ISO
  diaInteiro: boolean
  visibilidade: Visibilidade
  repetir: Repeticao
  repetirAte: string | null // AAAA-MM-DD
  /** Dias (AAAA-MM-DD) de um fixo que foram cancelados um a um. */
  puladas?: string[]
  criadoPor: string
  pessoas: string[]
  clienteId: string | null
  tags: string[]
  categoriaId: string | null
}

/** Tag ou categoria da agenda (mesmo formato; a categoria pinta o compromisso). */
export type TagAgenda = { id: string; nome: string; cor: string; criadoPor: string | null }
export type CategoriaAgenda = TagAgenda

/** Uma vez em que o compromisso acontece (o fixo aparece várias vezes). `google` = evento só do Google da pessoa. */
export type Ocorrencia = { id: string; titulo: string; inicio: string; fim: string; diaInteiro: boolean; compromisso?: Compromisso; google?: { link: string } }

/** Como vem do formulário e do MCP (data e horas locais). */
export type EntradaCompromisso = {
  titulo: string
  descricao?: string
  data: string
  horaInicio?: string
  horaFim?: string
  diaInteiro?: boolean
  visibilidade?: Visibilidade
  pessoas?: string[]
  repetir?: Repeticao
  repetirAte?: string | null
  clienteId?: string | null
  tags?: string[]
  categoriaId?: string | null
}

export type CamposCompromisso = Omit<Compromisso, 'id' | 'criadoPor'>

const DIA_MS = 86_400_000
const DATA = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/
const HORA = /^([01]\d|2[0-3]):[0-5]\d$/
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Instante de uma data e hora de Belém. */
export const instante = (data: string, hora = '00:00') => new Date(`${data}T${hora}:00-03:00`)
export const dataLocal = (iso: string) => dataDeHoje(new Date(iso))
export const horaLocal = (iso: string) => new Date(Date.parse(iso) - 3 * 3_600_000).toISOString().slice(11, 16)
export const somarDias = (data: string, n: number) => new Date(Date.parse(`${data}T00:00:00Z`) + n * DIA_MS).toISOString().slice(0, 10)

/** Segunda-feira da semana do dia, e os 7 dias dela. */
export function semanaDe(data: string): string[] {
  const dow = new Date(`${data}T00:00:00Z`).getUTCDay()
  const segunda = somarDias(data, -((dow + 6) % 7))
  return Array.from({ length: 7 }, (_, i) => somarDias(segunda, i))
}

/** Grade do mês (AAAA-MM) em semanas completas, de segunda a domingo. */
export function gradeDoMes(mes: string): string[] {
  const inicio = semanaDe(`${mes}-01`)[0]
  const [a, m] = mes.split('-').map(Number)
  const ultimo = new Date(Date.UTC(a, m, 0)).toISOString().slice(0, 10)
  const fim = semanaDe(ultimo)[6]
  const dias: string[] = []
  for (let d = inicio; d <= fim; d = somarDias(d, 1)) dias.push(d)
  return dias
}

/** Valida e normaliza. Quem não é admin/gestor só cria compromisso privado (a RLS também recusa). */
export function lerCompromisso(e: EntradaCompromisso, podeCompartilhar: boolean): { erro: string } | { campos: CamposCompromisso } {
  const titulo = (e.titulo ?? '').trim()
  if (!titulo || titulo.length > 120) return { erro: 'Dê um título de até 120 caracteres.' }
  const descricao = e.descricao ?? ''
  if (descricao.length > 2000) return { erro: 'A descrição passa de 2000 caracteres.' }
  if (!DATA.test(e.data ?? '') || Number.isNaN(Date.parse(e.data))) return { erro: 'Data inválida.' }
  const diaInteiro = !!e.diaInteiro
  let inicio: Date, fim: Date
  if (diaInteiro) {
    inicio = instante(e.data)
    fim = instante(somarDias(e.data, 1))
  } else {
    if (!HORA.test(e.horaInicio ?? '') || !HORA.test(e.horaFim ?? '')) return { erro: 'Informe a hora de início e de fim (HH:MM).' }
    inicio = instante(e.data, e.horaInicio)
    fim = instante(e.data, e.horaFim)
    if (fim <= inicio) return { erro: 'O fim precisa ser depois do início.' }
  }
  const visibilidade = e.visibilidade ?? 'privado'
  if (!VISIBILIDADES.some((v) => v.valor === visibilidade)) return { erro: 'Visibilidade inválida.' }
  if (visibilidade !== 'privado' && !podeCompartilhar) return { erro: 'Só admin e gestor criam compromissos para outras pessoas.' }
  const pessoas = visibilidade === 'selecionados' ? [...new Set(e.pessoas ?? [])] : []
  if (pessoas.some((p) => !UUID.test(p)) || pessoas.length > 50) return { erro: 'Pessoas inválidas.' }
  if (visibilidade === 'selecionados' && pessoas.length === 0) return { erro: 'Escolha pelo menos uma pessoa.' }
  const repetir = e.repetir ?? 'nunca'
  if (!REPETICOES.some((r) => r.valor === repetir)) return { erro: 'Repetição inválida.' }
  const repetirAte = repetir === 'nunca' ? null : e.repetirAte || null
  if (repetirAte && (!DATA.test(repetirAte) || repetirAte < e.data)) return { erro: 'A data final da repetição precisa ser depois do compromisso.' }
  const clienteId = e.clienteId || null
  if (clienteId && !UUID.test(clienteId)) return { erro: 'Cliente inválido.' }
  const tags = [...new Set(e.tags ?? [])]
  if (tags.some((t) => !UUID.test(t)) || tags.length > 20) return { erro: 'Tags inválidas.' }
  const categoriaId = e.categoriaId || null
  if (categoriaId && !UUID.test(categoriaId)) return { erro: 'Categoria inválida.' }
  return { campos: { titulo, descricao, inicio: inicio.toISOString(), fim: fim.toISOString(), diaInteiro, visibilidade, repetir, repetirAte, pessoas, clienteId, tags, categoriaId } }
}

/** Volta para o formato do formulário (edição). */
export const paraEntrada = (c: Compromisso): Required<EntradaCompromisso> => ({
  titulo: c.titulo,
  descricao: c.descricao,
  data: dataLocal(c.inicio),
  horaInicio: c.diaInteiro ? '09:00' : horaLocal(c.inicio),
  horaFim: c.diaInteiro ? '10:00' : horaLocal(c.fim),
  diaInteiro: c.diaInteiro,
  visibilidade: c.visibilidade,
  pessoas: c.pessoas,
  repetir: c.repetir,
  repetirAte: c.repetirAte,
  clienteId: c.clienteId,
  tags: c.tags,
  categoriaId: c.categoriaId,
})

/** Início da n-ésima repetição (null se o dia não existe naquele mês, como 31 de abril: pula, igual ao Google). */
function enesima(c: Compromisso, n: number): Date | null {
  const t = Date.parse(c.inicio)
  if (c.repetir === 'diario') return new Date(t + n * DIA_MS)
  if (c.repetir === 'semanal') return new Date(t + n * 7 * DIA_MS)
  const local = new Date(t - 3 * 3_600_000)
  const d = new Date(local)
  d.setUTCMonth(local.getUTCMonth() + n)
  if (d.getUTCDate() !== local.getUTCDate()) return null
  return new Date(d.getTime() + 3 * 3_600_000)
}

/** Ocorrências que caem entre os dias `de` e `ate` (inclusive), em ordem. */
export function ocorrencias(compromissos: Compromisso[], de: string, ate: string): Ocorrencia[] {
  const ini = instante(de).getTime()
  const fimJanela = instante(somarDias(ate, 1)).getTime()
  const saida: Ocorrencia[] = []
  for (const c of compromissos) {
    const dur = Date.parse(c.fim) - Date.parse(c.inicio)
    const passo = c.repetir === 'diario' ? DIA_MS : c.repetir === 'semanal' ? 7 * DIA_MS : 0
    // Pula direto para perto da janela (o mensal anda mês a mês; ponytail: limite de 1200 meses).
    let n = passo ? Math.max(0, Math.floor((ini - Date.parse(c.inicio) - dur) / passo)) : 0
    const maximo = c.repetir === 'nunca' ? 0 : passo ? Infinity : 1200
    for (; n <= maximo; n++) {
      const comeco = enesima(c, n)
      if (!comeco) continue
      const t = comeco.getTime()
      if (t >= fimJanela || (c.repetirAte && dataLocal(comeco.toISOString()) > c.repetirAte)) break
      if (c.puladas?.includes(dataLocal(comeco.toISOString()))) continue
      if (t + dur > ini) saida.push({ id: `${c.id}:${n}`, titulo: c.titulo, inicio: comeco.toISOString(), fim: new Date(t + dur).toISOString(), diaInteiro: c.diaInteiro, compromisso: c })
    }
  }
  return saida.sort((a, b) => Number(b.diaInteiro) - Number(a.diaInteiro) || a.inicio.localeCompare(b.inicio))
}

/** Quem vê o compromisso (e recebe no Google): o criador, a equipe toda ou as pessoas escolhidas. */
export function publico(c: Pick<Compromisso, 'visibilidade' | 'criadoPor' | 'pessoas'>, equipe: string[]): string[] {
  if (c.visibilidade === 'equipe') return [...new Set([c.criadoPor, ...equipe])]
  if (c.visibilidade === 'selecionados') return [...new Set([c.criadoPor, ...c.pessoas])]
  return [c.criadoPor]
}

/** Regra de repetição no formato do Google Agenda (RFC 5545). */
export function regraGoogle(c: Pick<Compromisso, 'repetir' | 'repetirAte' | 'diaInteiro'> & Partial<Pick<Compromisso, 'inicio' | 'puladas'>>): string[] | undefined {
  if (c.repetir === 'nunca') return undefined
  const freq = { diario: 'DAILY', semanal: 'WEEKLY', mensal: 'MONTHLY' }[c.repetir]
  const ate = !c.repetirAte ? '' : c.diaInteiro ? c.repetirAte.replaceAll('-', '') : instante(c.repetirAte, '23:59').toISOString().replace(/[-:]|\.\d+/g, '')
  // Dias cancelados um a um: EXDATE no mesmo formato do início (data, ou o horário do compromisso em UTC).
  const pulos = (c.puladas ?? []).map((d) => (c.diaInteiro || !c.inicio ? `EXDATE;VALUE=DATE:${d.replaceAll('-', '')}` : `EXDATE:${instante(d, horaLocal(c.inicio)).toISOString().replace(/[-:]|\.\d+/g, '')}`))
  return [ate ? `RRULE:FREQ=${freq};UNTIL=${ate}` : `RRULE:FREQ=${freq}`, ...pulos]
}

/** Bloco de um compromisso com horário na grade de horas: minutos desde 0h e a coluna quando há sobreposição. */
export type Bloco = { ocorrencia: Ocorrencia; de: number; ate: number; coluna: number; colunas: number }

/**
 * Compromissos com horário que tocam o dia, cortados em 0h–24h, com as colunas para os que se sobrepõem
 * (como no Google Agenda: um grupo de sobrepostos divide a largura igualmente).
 */
export function blocosDoDia(lista: Ocorrencia[], dia: string): Bloco[] {
  const zero = instante(dia).getTime()
  const fimDia = zero + DIA_MS
  const blocos = lista
    .filter((o) => !o.diaInteiro && Date.parse(o.inicio) < fimDia && Date.parse(o.fim) > zero)
    .map((o) => ({ ocorrencia: o, de: (Math.max(Date.parse(o.inicio), zero) - zero) / 60_000, ate: (Math.min(Date.parse(o.fim), fimDia) - zero) / 60_000, coluna: 0, colunas: 1 }))
    .sort((a, b) => a.de - b.de || b.ate - a.ate)
  let grupo: Bloco[] = []
  let fimGrupo = -1
  const fechar = () => {
    const n = Math.max(1, ...grupo.map((b) => b.coluna + 1))
    grupo.forEach((b) => (b.colunas = n))
    grupo = []
  }
  for (const b of blocos) {
    if (b.de >= fimGrupo) fechar()
    const ocupadas = new Set(grupo.filter((g) => g.ate > b.de).map((g) => g.coluna))
    while (ocupadas.has(b.coluna)) b.coluna++
    grupo.push(b)
    fimGrupo = Math.max(fimGrupo, b.ate)
  }
  fechar()
  return blocos
}

/** Ocorrências que tocam o dia (as de vários dias aparecem em cada um). */
export const doDia = (lista: Ocorrencia[], dia: string) => {
  const zero = instante(dia).getTime()
  return lista.filter((o) => Date.parse(o.inicio) < zero + DIA_MS && Date.parse(o.fim) > zero)
}
