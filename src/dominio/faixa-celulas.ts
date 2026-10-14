import type { DefinicaoCampo } from './personalizacao'
import type { Json } from '@/infra/supabase/tipos'
import type { Pessoa } from './tarefas'

/** Seleção retangular de células da lista (como numa planilha): as linhas e as colunas cobertas, na ordem da tela. */
export type Faixa = { linhas: string[]; colunas: string[] }
export type Posicao = { linha: string; coluna: string }

/** Retângulo entre duas células (âncora e ponta), na ordem de exibição. Célula fora da ordem devolve null. */
export function retangulo(linhasOrdem: string[], colunasOrdem: string[], a: Posicao, b: Posicao): Faixa | null {
  const [la, lb, ca, cb] = [linhasOrdem.indexOf(a.linha), linhasOrdem.indexOf(b.linha), colunasOrdem.indexOf(a.coluna), colunasOrdem.indexOf(b.coluna)]
  if ([la, lb, ca, cb].some((i) => i < 0)) return null
  return {
    linhas: linhasOrdem.slice(Math.min(la, lb), Math.max(la, lb) + 1),
    colunas: colunasOrdem.slice(Math.min(ca, cb), Math.max(ca, cb) + 1),
  }
}

/** Campos cujo valor dá para colar, copiar e limpar em grupo. Fórmula, progresso automático, arquivos, relações e botão ficam de fora. */
const TIPOS_DA_FAIXA = new Set([
  'text', 'long_text', 'email', 'phone', 'site', 'instagram', 'tiktok', 'location',
  'number', 'money', 'rating', 'progress_manual', 'vote',
  'date', 'dropdown', 'labels', 'checkbox', 'people',
])
export const campoDaFaixa = (c: Pick<DefinicaoCampo, 'tipo'>) => TIPOS_DA_FAIXA.has(c.tipo)

const SIM = new Set(['sim', 's', 'true', 'verdadeiro', '1', 'x', 'yes'])
const NAO = new Set(['nao', 'não', 'n', 'false', 'falso', '0', 'no'])

function numero(texto: string): number | null {
  // "1.234,56" (BR) ou "1234.56": se há vírgula, ela é o decimal e os pontos são milhar.
  const limpo = texto.replace(/[^\d.,-]/g, '')
  if (!limpo) return null
  const normal = limpo.includes(',') ? limpo.replace(/\./g, '').replace(',', '.') : limpo
  const n = Number(normal)
  return Number.isFinite(n) ? n : null
}

function dataIso(texto: string): string | null {
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto)
  const br = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(texto)
  const [a, m, d] = iso ? [iso[1], iso[2], iso[3]] : br ? [br[3], br[2], br[1]] : []
  if (!a || !m || !d) return null
  const data = new Date(`${a}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T00:00:00Z`)
  return Number.isNaN(data.getTime()) || data.getUTCDate() !== Number(d) ? null : data.toISOString().slice(0, 10)
}

export type ResultadoValor = { ok: true; valor: Json | null } | { ok: false }

/** Texto da área de transferência → valor do campo. Texto vazio limpa o campo; algo que não reconhece (opção inexistente, data inválida…) é recusado. */
export function textoParaValor(def: DefinicaoCampo, bruto: string, equipe: Pessoa[]): ResultadoValor {
  const texto = bruto.trim()
  if (!campoDaFaixa(def)) return { ok: false }
  if (!texto) return { ok: true, valor: null }
  const opcoes = def.configuracao.options ?? []
  const achar = (t: string) => opcoes.find((o) => o.toLowerCase() === t.trim().toLowerCase())
  switch (def.tipo) {
    case 'number': case 'money': case 'rating': case 'progress_manual': case 'vote': {
      const n = numero(texto)
      return n === null ? { ok: false } : { ok: true, valor: n }
    }
    case 'date': {
      const d = dataIso(texto)
      return d ? { ok: true, valor: d } : { ok: false }
    }
    case 'dropdown': {
      const o = achar(texto)
      return o ? { ok: true, valor: o } : { ok: false }
    }
    case 'labels': {
      const itens = texto.split(/[,;]/).map((t) => achar(t))
      return itens.every(Boolean) ? { ok: true, valor: [...new Set(itens as string[])] } : { ok: false }
    }
    case 'checkbox': {
      const t = texto.toLowerCase()
      return SIM.has(t) ? { ok: true, valor: true } : NAO.has(t) ? { ok: true, valor: false } : { ok: false }
    }
    case 'people': {
      const ids = texto.split(/[,;]/).map((t) => equipe.find((p) => p.nome.toLowerCase() === t.trim().toLowerCase())?.id)
      return ids.every(Boolean) ? { ok: true, valor: [...new Set(ids as string[])] } : { ok: false }
    }
    default:
      return { ok: true, valor: texto }
  }
}

/** Valor do campo → texto para copiar (o que a pessoa vê na célula). */
export function valorParaTexto(def: DefinicaoCampo, valor: Json | null | undefined, equipe: Pessoa[]): string {
  if (valor == null || valor === '') return ''
  if (def.tipo === 'people' && Array.isArray(valor)) return valor.map((id) => equipe.find((p) => p.id === id)?.nome ?? '').filter(Boolean).join(', ')
  if (def.tipo === 'date' && typeof valor === 'string') return valor.split('-').reverse().join('/')
  if (def.tipo === 'checkbox') return valor === true ? 'Sim' : 'Não'
  if (Array.isArray(valor)) return valor.map(String).join(', ')
  return String(valor)
}

/** Texto copiado de uma planilha (linhas por quebra, colunas por tab) → matriz. Ignora a quebra final. */
export function interpretarColagem(texto: string): string[][] {
  const linhas = texto.replace(/\r\n/g, '\n').replace(/\n$/, '').split('\n')
  return linhas.map((l) => l.split('\t'))
}

/**
 * Onde cada pedaço colado cai. Um valor só preenche toda a seleção; vários começam na célula do canto superior esquerdo
 * e param no fim da seleção (ou da tabela, se a seleção for de uma célula só).
 */
export function planejarColagem(faixa: Faixa, matriz: string[][], linhasOrdem: string[], colunasOrdem: string[]): { linha: string; coluna: string; texto: string }[] {
  const unico = matriz.length === 1 && matriz[0].length === 1
  if (unico) return faixa.linhas.flatMap((linha) => faixa.colunas.map((coluna) => ({ linha, coluna, texto: matriz[0][0] })))
  const l0 = linhasOrdem.indexOf(faixa.linhas[0])
  const c0 = colunasOrdem.indexOf(faixa.colunas[0])
  const celulaUnica = faixa.linhas.length === 1 && faixa.colunas.length === 1
  const saida: { linha: string; coluna: string; texto: string }[] = []
  matriz.forEach((linhaTexto, i) => {
    linhaTexto.forEach((texto, j) => {
      const linha = linhasOrdem[l0 + i]
      const coluna = colunasOrdem[c0 + j]
      if (!linha || !coluna) return
      if (!celulaUnica && (i >= faixa.linhas.length || j >= faixa.colunas.length)) return
      saida.push({ linha, coluna, texto })
    })
  })
  return saida
}
