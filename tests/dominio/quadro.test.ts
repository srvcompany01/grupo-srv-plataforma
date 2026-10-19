import { describe, expect, it } from 'vitest'
import { QUADRO_VAZIO, caixaDe, deslocar, distanciaAoSegmento, elementoSob, elementosNaArea, lerDadosQuadro, simplificarTraco, type ElementoQuadro } from '@/dominio/quadro'
import { CAMERA_INICIAL, ZOOM, desfazer, enquadrar, iniciarHistorico, refazer, registrar, telaParaMundo, uniao, zoomNoPonto } from '@/dominio/tela'

const nota = (id: string, x: number, y: number): ElementoQuadro => ({ id, tipo: 'nota', x, y, w: 100, h: 100, texto: '', cor: '#fde68a' })
const seta: ElementoQuadro = { id: 's', tipo: 'seta', x1: 0, y1: 0, x2: 100, y2: 0, cor: '#111827' }

describe('geometria do quadro', () => {
  it('distância ao segmento (inclusive nas pontas e segmento de tamanho zero)', () => {
    expect(distanciaAoSegmento(50, 10, 0, 0, 100, 0)).toBe(10)
    expect(distanciaAoSegmento(-30, 40, 0, 0, 100, 0)).toBe(50)
    expect(distanciaAoSegmento(3, 4, 0, 0, 0, 0)).toBe(5)
  })
  it('elementoSob pega o de cima e acerta linhas finas', () => {
    const els = [nota('a', 0, 0), nota('b', 50, 50), seta]
    expect(elementoSob(els, 75, 75)?.id).toBe('b')
    expect(elementoSob(els, 10, 10)?.id).toBe('a')
    expect(elementoSob(els, 50, 3)?.id).toBe('s')
    expect(elementoSob(els, 500, 500)).toBeNull()
  })
  it('deslocar e caixaDe valem para todos os tipos', () => {
    const traco: ElementoQuadro = { id: 'd', tipo: 'desenho', pontos: [0, 0, 10, 20], cor: '#111827', largura: 3 }
    expect(caixaDe(deslocar(traco, 5, 5))).toEqual({ x: 5, y: 5, w: 10, h: 20 })
    expect(caixaDe(deslocar(seta, 1, 2))).toEqual({ x: 1, y: 2, w: 100, h: 0 })
    expect(caixaDe(deslocar(nota('a', 0, 0), 7, 8))).toEqual({ x: 7, y: 8, w: 100, h: 100 })
  })
  it('seleção por área pega o que cruza o retângulo', () => {
    const els = [nota('a', 0, 0), nota('b', 500, 500)]
    expect(elementosNaArea(els, { x: 90, y: 90, w: 20, h: 20 }).map((e) => e.id)).toEqual(['a'])
  })
  it('simplificarTraco mantém o primeiro e o último ponto', () => {
    const r = simplificarTraco([0, 0, 0.5, 0.5, 1, 1, 10, 10])
    expect(r.slice(0, 2)).toEqual([0, 0])
    expect(r.slice(-2)).toEqual([10, 10])
    expect(r.length).toBeLessThan(8)
  })
})

describe('dados do quadro', () => {
  it('descarta elementos inválidos e tolera lixo', () => {
    expect(lerDadosQuadro({ elementos: [nota('a', 0, 0), { tipo: 'nota' }, { ...nota('b', 0, 0), cor: 'vermelho' }, 5] }).elementos.map((e) => e.id)).toEqual(['a'])
    for (const v of [null, 1, {}, { elementos: 'x' }]) expect(lerDadosQuadro(v)).toEqual(QUADRO_VAZIO)
  })
})

describe('câmera e histórico', () => {
  it('zoom no ponto mantém o ponto do mundo sob o cursor e respeita os limites', () => {
    const c = zoomNoPonto({ x: 40, y: 20, z: 1 }, 300, 200, 2)
    expect(telaParaMundo(c, 300, 200)).toEqual(telaParaMundo({ x: 40, y: 20, z: 1 }, 300, 200))
    expect(zoomNoPonto(CAMERA_INICIAL, 0, 0, 1000).z).toBe(ZOOM.maximo)
    expect(zoomNoPonto(CAMERA_INICIAL, 0, 0, 0.0001).z).toBe(ZOOM.minimo)
  })
  it('enquadrar centraliza a caixa e nunca passa de 100%', () => {
    const c = enquadrar({ x: 0, y: 0, w: 100, h: 100 }, 1000, 800)
    expect(c.z).toBe(1)
    expect(c.x + 50 * c.z).toBeCloseTo(500)
    expect(enquadrar(null, 10, 10)).toEqual(CAMERA_INICIAL)
    expect(uniao([{ x: 0, y: 0, w: 10, h: 10 }, { x: 20, y: 20, w: 10, h: 10 }])).toEqual({ x: 0, y: 0, w: 30, h: 30 })
  })
  it('desfazer e refazer; uma nova ação limpa o "refazer"', () => {
    let h = iniciarHistorico(1)
    h = registrar(registrar(h, 2), 3)
    h = desfazer(h)
    expect(h.atual).toBe(2)
    h = refazer(h)
    expect(h.atual).toBe(3)
    h = registrar(desfazer(h), 9)
    expect(h.futuro).toEqual([])
    expect(refazer(h).atual).toBe(9)
    expect(desfazer(iniciarHistorico(1)).atual).toBe(1)
    expect(registrar(h, h.atual)).toBe(h)
  })
})
