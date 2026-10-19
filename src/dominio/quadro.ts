import * as z from 'zod'
import type { Caixa } from './tela'

export const CORES_NOTA = ['#fde68a', '#fecaca', '#bbf7d0', '#bfdbfe', '#e9d5ff', '#fed7aa', '#e5e7eb', '#ffffff'] as const
export const CORES_TRACO = ['#111827', '#d80d12', '#16a34a', '#2563eb', '#9333ea', '#ea580c', '#64748b'] as const
export const MAX_ELEMENTOS = 2000

const cor = z.string().regex(/^#[0-9a-fA-F]{6}$/)
const num = z.number().finite().min(-1e6).max(1e6)
const tamanho = z.number().finite().min(8).max(4000)
const texto = z.string().max(2000)
const id = z.string().regex(/^[A-Za-z0-9_-]{1,40}$/)

const Nota = z.object({ id, tipo: z.literal('nota'), x: num, y: num, w: tamanho, h: tamanho, texto, cor })
const Texto = z.object({ id, tipo: z.literal('texto'), x: num, y: num, w: tamanho, h: tamanho, texto, cor, tamanho: z.number().min(10).max(120) })
const Forma = z.object({ id, tipo: z.enum(['retangulo', 'elipse', 'losango']), x: num, y: num, w: tamanho, h: tamanho, texto, cor, borda: cor })
const Seta = z.object({ id, tipo: z.literal('seta'), x1: num, y1: num, x2: num, y2: num, cor })
const Desenho = z.object({ id, tipo: z.literal('desenho'), pontos: z.array(num).min(2).max(6000), cor, largura: z.number().min(1).max(40) })

export const ElementoQuadro = z.discriminatedUnion('tipo', [Nota, Texto, Forma, Seta, Desenho])
export type ElementoQuadro = z.infer<typeof ElementoQuadro>
export type ElementoComCaixa = Exclude<ElementoQuadro, { tipo: 'seta' | 'desenho' }>

export const DadosQuadro = z.object({ elementos: z.array(ElementoQuadro).max(MAX_ELEMENTOS) })
export type DadosQuadro = z.infer<typeof DadosQuadro>

export const QUADRO_VAZIO: DadosQuadro = { elementos: [] }

/** Lê o JSON salvo; elementos inválidos são descartados em vez de derrubar o quadro inteiro. */
export function lerDadosQuadro(bruto: unknown): DadosQuadro {
  const lista = (bruto as { elementos?: unknown } | null)?.elementos
  if (!Array.isArray(lista)) return QUADRO_VAZIO
  const elementos = lista.slice(0, MAX_ELEMENTOS).flatMap((e) => {
    const r = ElementoQuadro.safeParse(e)
    return r.success ? [r.data] : []
  })
  return { elementos }
}

export const temCaixa = (e: ElementoQuadro): e is ElementoComCaixa => e.tipo !== 'seta' && e.tipo !== 'desenho'

export function caixaDe(e: ElementoQuadro): Caixa {
  if (temCaixa(e)) return { x: e.x, y: e.y, w: e.w, h: e.h }
  if (e.tipo === 'seta') return { x: Math.min(e.x1, e.x2), y: Math.min(e.y1, e.y2), w: Math.abs(e.x2 - e.x1), h: Math.abs(e.y2 - e.y1) }
  const xs = e.pontos.filter((_, i) => i % 2 === 0)
  const ys = e.pontos.filter((_, i) => i % 2 === 1)
  const x = Math.min(...xs)
  const y = Math.min(...ys)
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y }
}

export function deslocar(e: ElementoQuadro, dx: number, dy: number): ElementoQuadro {
  if (temCaixa(e)) return { ...e, x: e.x + dx, y: e.y + dy }
  if (e.tipo === 'seta') return { ...e, x1: e.x1 + dx, y1: e.y1 + dy, x2: e.x2 + dx, y2: e.y2 + dy }
  return { ...e, pontos: e.pontos.map((v, i) => v + (i % 2 === 0 ? dx : dy)) }
}

/** Menor distância do ponto ao segmento. */
export function distanciaAoSegmento(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1
  const dy = y2 - y1
  const t = dx || dy ? Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy))) : 0
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy))
}

/** O ponto (no mundo) toca o elemento? `folga` aumenta a área de clique de linhas finas. */
export function tocaElemento(e: ElementoQuadro, px: number, py: number, folga = 6): boolean {
  if (e.tipo === 'seta') return distanciaAoSegmento(px, py, e.x1, e.y1, e.x2, e.y2) <= folga
  if (e.tipo === 'desenho') {
    for (let i = 0; i + 3 < e.pontos.length; i += 2) if (distanciaAoSegmento(px, py, e.pontos[i], e.pontos[i + 1], e.pontos[i + 2], e.pontos[i + 3]) <= folga + e.largura / 2) return true
    return false
  }
  return px >= e.x && px <= e.x + e.w && py >= e.y && py <= e.y + e.h
}

/** Elemento mais acima (o último da lista) sob o ponto. */
export function elementoSob(elementos: ElementoQuadro[], px: number, py: number, folga = 6): ElementoQuadro | null {
  for (let i = elementos.length - 1; i >= 0; i--) if (tocaElemento(elementos[i], px, py, folga)) return elementos[i]
  return null
}

/** Elementos que cruzam o retângulo (seleção por área). */
export function elementosNaArea(elementos: ElementoQuadro[], area: Caixa): ElementoQuadro[] {
  return elementos.filter((e) => {
    const c = caixaDe(e)
    return c.x <= area.x + area.w && c.x + c.w >= area.x && c.y <= area.y + area.h && c.y + c.h >= area.y
  })
}

export const caixaDoArrasto = (x1: number, y1: number, x2: number, y2: number): Caixa => ({ x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1), h: Math.abs(y2 - y1) })

/** Pontos do traço simplificados (descarta os muito próximos) para o JSON não crescer à toa. */
export function simplificarTraco(pontos: number[], minimo = 2): number[] {
  const saida = pontos.slice(0, 2)
  for (let i = 2; i < pontos.length - 2; i += 2) if (Math.hypot(pontos[i] - saida[saida.length - 2], pontos[i + 1] - saida[saida.length - 1]) >= minimo) saida.push(pontos[i], pontos[i + 1])
  if (pontos.length >= 4) saida.push(pontos[pontos.length - 2], pontos[pontos.length - 1])
  return saida
}
