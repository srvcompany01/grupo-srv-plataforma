import * as z from 'zod'
import type { Caixa } from './tela'

export const TIPOS_NO = ['trafego', 'pagina', 'formulario', 'email', 'whatsapp', 'reuniao', 'checkout', 'venda', 'outro'] as const
export type TipoNo = (typeof TIPOS_NO)[number]

export const INFO_NO: Record<TipoNo, { rotulo: string; cor: string }> = {
  trafego: { rotulo: 'Tráfego', cor: '#2563eb' },
  pagina: { rotulo: 'Página', cor: '#9333ea' },
  formulario: { rotulo: 'Formulário / Lead', cor: '#0891b2' },
  email: { rotulo: 'E-mail', cor: '#ea580c' },
  whatsapp: { rotulo: 'WhatsApp', cor: '#16a34a' },
  reuniao: { rotulo: 'Reunião', cor: '#d97706' },
  checkout: { rotulo: 'Checkout', cor: '#db2777' },
  venda: { rotulo: 'Venda', cor: '#15803d' },
  outro: { rotulo: 'Outro', cor: '#64748b' },
}

export const NO_LARGURA = 188
export const NO_ALTURA = 64
export const MAX_NOS = 200
export const MAX_LIGACOES = 400

const id = z.string().regex(/^[A-Za-z0-9_-]{1,40}$/)
const num = z.number().finite().min(-1e6).max(1e6)
const positivo = z.number().finite().min(0).max(1e12)

export const NoFunil = z.object({
  id,
  tipo: z.enum(TIPOS_NO),
  x: num,
  y: num,
  nome: z.string().max(80),
  /** Visitantes que entram por aqui (vale só para quem não recebe nenhuma ligação). */
  visitantes: positivo,
  /** Quanto foi investido neste ponto, em reais (tráfego pago, por exemplo). */
  custo: positivo,
  /** Valor de cada venda, em reais (vale para o tipo Venda). */
  valor: positivo,
})
export type NoFunil = z.infer<typeof NoFunil>

export const LigacaoFunil = z.object({ id, de: id, para: id, taxa: z.number().finite().min(0).max(100) })
export type LigacaoFunil = z.infer<typeof LigacaoFunil>

export const DadosFunil = z.object({ nos: z.array(NoFunil).max(MAX_NOS), ligacoes: z.array(LigacaoFunil).max(MAX_LIGACOES) })
export type DadosFunil = z.infer<typeof DadosFunil>

export const FUNIL_VAZIO: DadosFunil = { nos: [], ligacoes: [] }

/** Lê o JSON salvo: descarta nós inválidos e ligações que apontam para nós que não existem ou para si mesmas. */
export function lerDadosFunil(bruto: unknown): DadosFunil {
  const b = bruto as { nos?: unknown; ligacoes?: unknown } | null
  if (!Array.isArray(b?.nos) || !Array.isArray(b?.ligacoes)) return FUNIL_VAZIO
  const nos = b.nos.slice(0, MAX_NOS).flatMap((n) => {
    const r = NoFunil.safeParse(n)
    return r.success ? [r.data] : []
  })
  const ids = new Set(nos.map((n) => n.id))
  const vistas = new Set<string>()
  const ligacoes = b.ligacoes.slice(0, MAX_LIGACOES).flatMap((l) => {
    const r = LigacaoFunil.safeParse(l)
    if (!r.success || r.data.de === r.data.para || !ids.has(r.data.de) || !ids.has(r.data.para) || vistas.has(`${r.data.de}>${r.data.para}`)) return []
    vistas.add(`${r.data.de}>${r.data.para}`)
    return [r.data]
  })
  return { nos, ligacoes }
}

export const caixaDoNo = (n: NoFunil): Caixa => ({ x: n.x, y: n.y, w: NO_LARGURA, h: NO_ALTURA })

export type ResultadoNo = { visitantes: number; receita: number; /** Soma das taxas que saem daqui passa de 100%. */ excesso: boolean }
export type ResultadoFunil = {
  nos: Record<string, ResultadoNo>
  /** Pessoas que passam por cada ligação. */
  fluxo: Record<string, number>
  /** Ligações ignoradas por formarem um ciclo (voltar a uma etapa anterior). */
  ciclos: string[]
  totais: { entrada: number; custo: number; receita: number; lucro: number; leads: number; vendas: number; cpl: number | null; cac: number | null; roas: number | null; conversao: number | null }
}

/**
 * Propaga os visitantes pelo funil: quem não recebe ligação usa o próprio "visitantes"; os demais recebem,
 * de cada ligação, os visitantes do nó de origem × a taxa. Ligações que fecham um ciclo são ignoradas.
 */
/** Etapas que são lead: formulário/cadastro e conversa no WhatsApp. */
export const TIPOS_LEAD: readonly TipoNo[] = ['formulario', 'whatsapp']

export function calcularFunil(d: DadosFunil): ResultadoFunil {
  const porId = new Map(d.nos.map((n) => [n.id, n]))
  const entradas = new Map<string, LigacaoFunil[]>()
  for (const l of d.ligacoes) entradas.set(l.para, [...(entradas.get(l.para) ?? []), l])

  const memo = new Map<string, number>()
  const visitando = new Set<string>()
  const ciclos = new Set<string>()
  const visitantesDe = (idNo: string): number => {
    const feito = memo.get(idNo)
    if (feito !== undefined) return feito
    const no = porId.get(idNo)
    if (!no) return 0
    const chegando = entradas.get(idNo) ?? []
    visitando.add(idNo)
    let total = chegando.length === 0 ? no.visitantes : 0
    for (const l of chegando) {
      if (visitando.has(l.de)) ciclos.add(l.id)
      else total += (visitantesDe(l.de) * l.taxa) / 100
    }
    visitando.delete(idNo)
    memo.set(idNo, total)
    return total
  }

  const saindo = new Map<string, number>()
  for (const l of d.ligacoes) saindo.set(l.de, (saindo.get(l.de) ?? 0) + l.taxa)

  const nos: Record<string, ResultadoNo> = {}
  for (const n of d.nos) {
    const visitantes = visitantesDe(n.id)
    nos[n.id] = { visitantes, receita: n.tipo === 'venda' ? visitantes * n.valor : 0, excesso: (saindo.get(n.id) ?? 0) > 100.0001 }
  }
  const fluxo: Record<string, number> = {}
  for (const l of d.ligacoes) fluxo[l.id] = ciclos.has(l.id) ? 0 : (nos[l.de]?.visitantes ?? 0) * (l.taxa / 100)

  const soma = (f: (n: NoFunil) => number) => d.nos.reduce((s, n) => s + f(n), 0)
  const entrada = soma((n) => ((entradas.get(n.id)?.length ?? 0) === 0 ? n.visitantes : 0))
  const custo = soma((n) => n.custo)
  const receita = soma((n) => nos[n.id].receita)
  // Lead = a primeira etapa de lead do caminho: formulário → WhatsApp é a mesma pessoa, conta uma vez.
  const ehLead = (n: NoFunil) => TIPOS_LEAD.includes(n.tipo)
  const leadAntes = (n: NoFunil) => (entradas.get(n.id) ?? []).some((l) => { const de = porId.get(l.de); return !!de && ehLead(de) })
  const leads = soma((n) => (ehLead(n) && !leadAntes(n) ? nos[n.id].visitantes : 0))
  const vendas = soma((n) => (n.tipo === 'venda' ? nos[n.id].visitantes : 0))
  const razao = (a: number, b: number) => (b > 0 ? a / b : null)
  return { nos, fluxo, ciclos: [...ciclos], totais: { entrada, custo, receita, lucro: receita - custo, leads, vendas, cpl: custo > 0 ? razao(custo, leads) : null, cac: custo > 0 ? razao(custo, vendas) : null, roas: razao(receita, custo), conversao: razao(vendas, entrada) } }
}

const no = (idNo: string, tipo: TipoNo, nome: string, x: number, y: number, extra: Partial<NoFunil> = {}): NoFunil => ({ id: idNo, tipo, nome, x, y, visitantes: 0, custo: 0, valor: 0, ...extra })

/** Funil de exemplo para começar sem tela em branco (números de ilustração, edite à vontade). */
export const FUNIL_MODELO: DadosFunil = {
  nos: [
    no('n1', 'trafego', 'Meta Ads', 0, 120, { visitantes: 5000, custo: 3000 }),
    no('n2', 'pagina', 'Landing page', 280, 120),
    no('n3', 'formulario', 'Lead (formulário)', 560, 120),
    no('n4', 'whatsapp', 'Contato no WhatsApp', 840, 120),
    no('n5', 'reuniao', 'Reunião de diagnóstico', 1120, 120),
    no('n6', 'venda', 'Venda', 1400, 120, { valor: 2500 }),
  ],
  ligacoes: [
    { id: 'l1', de: 'n1', para: 'n2', taxa: 100 },
    { id: 'l2', de: 'n2', para: 'n3', taxa: 12 },
    { id: 'l3', de: 'n3', para: 'n4', taxa: 70 },
    { id: 'l4', de: 'n4', para: 'n5', taxa: 40 },
    { id: 'l5', de: 'n5', para: 'n6', taxa: 30 },
  ],
}

export const NOVO_NO_PADRAO: Omit<NoFunil, 'id' | 'x' | 'y'> = { tipo: 'pagina', nome: 'Nova etapa', visitantes: 0, custo: 0, valor: 0 }

/** Arruma os nós em colunas: cada etapa fica uma coluna à direita da mais distante que chega nela (ciclos são ignorados). */
export function organizarFunil(d: DadosFunil, larguraColuna = 280, alturaLinha = 110): DadosFunil {
  const entradas = new Map<string, string[]>()
  for (const l of d.ligacoes) entradas.set(l.para, [...(entradas.get(l.para) ?? []), l.de])
  const nivel = new Map<string, number>()
  const visitando = new Set<string>()
  const nivelDe = (id: string): number => {
    const feito = nivel.get(id)
    if (feito !== undefined) return feito
    visitando.add(id)
    const n = Math.max(-1, ...(entradas.get(id) ?? []).filter((o) => !visitando.has(o)).map(nivelDe)) + 1
    visitando.delete(id)
    nivel.set(id, n)
    return n
  }
  const usados = new Map<number, number>()
  return {
    ...d,
    nos: d.nos.map((n) => {
      const coluna = nivelDe(n.id)
      const linha = usados.get(coluna) ?? 0
      usados.set(coluna, linha + 1)
      return { ...n, x: coluna * larguraColuna, y: linha * alturaLinha }
    }),
  }
}
