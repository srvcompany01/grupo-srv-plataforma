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
  criadoPor: string
  pessoas: string[]
  clienteId: string | null
  tags: string[]
}

export type TagAgenda = { id: string; nome: string; cor: string }

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
  return { campos: { titulo, descricao, inicio: inicio.toISOString(), fim: fim.toISOString(), diaInteiro, visibilidade, repetir, repetirAte, pessoas, clienteId, tags } }
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
export function regraGoogle(c: Pick<Compromisso, 'repetir' | 'repetirAte' | 'diaInteiro'>): string[] | undefined {
  if (c.repetir === 'nunca') return undefined
  const freq = { diario: 'DAILY', semanal: 'WEEKLY', mensal: 'MONTHLY' }[c.repetir]
  if (!c.repetirAte) return [`RRULE:FREQ=${freq}`]
  const ate = c.diaInteiro ? c.repetirAte.replaceAll('-', '') : instante(c.repetirAte, '23:59').toISOString().replace(/[-:]|\.\d+/g, '')
  return [`RRULE:FREQ=${freq};UNTIL=${ate}`]
}
