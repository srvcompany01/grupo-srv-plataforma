/** Câmera de uma tela infinita (quadro e funil): deslocamento em pixels da tela e zoom. */
export type Camera = { x: number; y: number; z: number }

export const ZOOM = { minimo: 0.2, maximo: 3 } as const
export const CAMERA_INICIAL: Camera = { x: 0, y: 0, z: 1 }

export const limitarZoom = (z: number): number => Math.min(ZOOM.maximo, Math.max(ZOOM.minimo, z))

export const telaParaMundo = (c: Camera, x: number, y: number) => ({ x: (x - c.x) / c.z, y: (y - c.y) / c.z })

/** Muda o zoom mantendo o ponto (px, py) da tela parado, como no Miro. */
export function zoomNoPonto(c: Camera, px: number, py: number, fator: number): Camera {
  const z = limitarZoom(c.z * fator)
  const mundo = telaParaMundo(c, px, py)
  return { z, x: px - mundo.x * z, y: py - mundo.y * z }
}

export type Caixa = { x: number; y: number; w: number; h: number }

/** Câmera que enquadra a caixa dentro da área (largura × altura) com uma margem; sem caixa, volta ao início. */
export function enquadrar(caixa: Caixa | null, largura: number, altura: number, margem = 60): Camera {
  if (!caixa || largura <= 0 || altura <= 0) return CAMERA_INICIAL
  const z = limitarZoom(Math.min((largura - margem * 2) / Math.max(caixa.w, 1), (altura - margem * 2) / Math.max(caixa.h, 1), 1))
  return { z, x: (largura - caixa.w * z) / 2 - caixa.x * z, y: (altura - caixa.h * z) / 2 - caixa.y * z }
}

export function uniao(caixas: Caixa[]): Caixa | null {
  if (!caixas.length) return null
  const x1 = Math.min(...caixas.map((c) => c.x))
  const y1 = Math.min(...caixas.map((c) => c.y))
  const x2 = Math.max(...caixas.map((c) => c.x + c.w))
  const y2 = Math.max(...caixas.map((c) => c.y + c.h))
  return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 }
}

export const novoId = (): string => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID().slice(0, 12) : Math.random().toString(36).slice(2, 14))

/** Histórico de desfazer/refazer com instantâneos imutáveis. */
export type Historico<T> = { passado: T[]; atual: T; futuro: T[] }
export const LIMITE_HISTORICO = 100

export const iniciarHistorico = <T>(atual: T): Historico<T> => ({ passado: [], atual, futuro: [] })
export const registrar = <T>(h: Historico<T>, novo: T): Historico<T> => (novo === h.atual ? h : { passado: [...h.passado, h.atual].slice(-LIMITE_HISTORICO), atual: novo, futuro: [] })
export const desfazer = <T>(h: Historico<T>): Historico<T> => (h.passado.length ? { passado: h.passado.slice(0, -1), atual: h.passado[h.passado.length - 1], futuro: [h.atual, ...h.futuro] } : h)
export const refazer = <T>(h: Historico<T>): Historico<T> => (h.futuro.length ? { passado: [...h.passado, h.atual], atual: h.futuro[0], futuro: h.futuro.slice(1) } : h)
