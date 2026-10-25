import { describe, expect, it } from 'vitest'
import { analisarSaude, concorrentesDaGrade, corDaPosicao, gerarGrade, linkAvaliacao, metricasDaGrade, pioraNoGeogrid, pixel, raioDoVies, textoProposta, zoomParaCaber, type PerfilPublico } from '@/dominio/gmn'

describe('geogrid', () => {
  const belem = { lat: -1.4558, lng: -48.4902 }

  it('grade n×n centrada, do noroeste ao sudeste, com o raio até a borda', () => {
    const g = gerarGrade(belem, 3, 2)
    expect(g).toHaveLength(9)
    expect(g[4].lat).toBeCloseTo(belem.lat)
    expect(g[4].lng).toBeCloseTo(belem.lng)
    expect(g[0].lat).toBeGreaterThan(belem.lat) // norte
    expect(g[0].lng).toBeLessThan(belem.lng) // oeste
    expect((g[0].lat - belem.lat) * 111.32).toBeCloseTo(2)
    expect(gerarGrade(belem, 7, 5)).toHaveLength(49)
  })

  it('viés de busca entre 300 m e 5 km', () => {
    expect(raioDoVies(5, 2)).toBe(500)
    expect(raioDoVies(3, 0.2)).toBe(300)
    expect(raioDoVies(3, 50)).toBe(5000)
  })

  it('métricas: média de quem aparece, média total com "fora" = 21, top 3 e encontrado', () => {
    expect(metricasDaGrade([1, 2, 5, null])).toEqual({ posicaoMedia: 2.7, posicaoMediaTotal: 7.3, top3: 50, top10: 75, encontrado: 75, pontos: 4 })
    expect(metricasDaGrade([null, null]).posicaoMedia).toBeNull()
  })

  it('cores por faixa e concorrentes mais frequentes no top 3', () => {
    expect(corDaPosicao(1).fundo).toBe('#1f8a4c')
    expect(corDaPosicao(15).fundo).toBe('#d64545')
    expect(corDaPosicao(null).fundo).toBe('#9b9a96')
    const pontos = [{ lat: 0, lng: 0, posicao: 1, top: ['eu', 'a', 'b'] }, { lat: 0, lng: 0, posicao: 4, top: ['a', 'c', 'b'] }, { lat: 0, lng: 0, posicao: null, top: ['a', 'b', 'd'] }]
    expect(concorrentesDaGrade(pontos, 'eu', 2)).toEqual([{ id: 'a', vezes: 3 }, { id: 'b', vezes: 3 }])
  })

  it('mapa: pixel Web Mercator e zoom que cabe a grade', () => {
    expect(pixel({ lat: 0, lng: 0 }, 0)).toEqual({ x: 128, y: 128 })
    const z = zoomParaCaber(gerarGrade(belem, 5, 3), 640)
    expect(z).toBeGreaterThanOrEqual(11)
    expect(z).toBeLessThanOrEqual(14)
  })
})

describe('análise de saúde pública', () => {
  const completo: PerfilPublico = { status: 'OPERATIONAL', nota: 4.8, avaliacoes: 150, fotos: 10, temHorario: true, site: 'https://x.com', telefone: '(91) 3333-3333', categoriaPrincipal: 'Joalheria', categorias: ['jewelry_store', 'store', 'watch_store', 'gift_shop'], resumo: 'Joalheria tradicional', ultimaAvaliacaoEm: '2026-10-20T10:00:00Z' }

  it('perfil completo tira 100; sem site, telefone e horário cai e aponta o que falta', () => {
    expect(analisarSaude(completo, '2026-10-24').nota).toBe(100)
    const r = analisarSaude({ ...completo, site: null, telefone: null, temHorario: false }, '2026-10-24')
    expect(r.nota).toBeLessThan(80)
    expect(r.itens.filter((i) => i.tom === 'ruim').map((i) => i.titulo)).toEqual(['Horário de funcionamento', 'Site', 'Telefone'])
  })

  it('compara avaliações com os concorrentes do geogrid', () => {
    const r = analisarSaude({ ...completo, avaliacoes: 150 }, '2026-10-24', { nota: 4.7, avaliacoes: 400 })
    expect(r.itens.find((i) => i.titulo === 'Quantidade de avaliações')).toMatchObject({ tom: 'ruim', detalhe: expect.stringMatching(/concorrentes: 400/) })
  })

  it('link de avaliação', () => {
    expect(linkAvaliacao('ChIJabc')).toBe('https://search.google.com/local/writereview?placeid=ChIJabc')
  })
})

describe('texto de proposta', () => {
  it('nota e pontos fracos, os ruins primeiro', () => {
    const t = textoProposta('Ótica Sol', { nota: 55, itens: [{ titulo: 'Site', tom: 'ruim', detalhe: 'Sem site no perfil.', peso: 2 }, { titulo: 'Fotos', tom: 'atencao', detalhe: '3 foto(s).', peso: 2 }, { titulo: 'Telefone', tom: 'bom', detalhe: 'ok', peso: 2 }] })
    expect(t).toMatch(/Ótica Sol/)
    expect(t).toMatch(/55\/100/)
    expect(t.indexOf('Site')).toBeLessThan(t.indexOf('Fotos'))
    expect(t).not.toMatch(/Telefone/)
  })
})

describe('geogrid agendado', () => {
  const m = (posicaoMediaTotal: number, top3: number) => ({ posicaoMedia: null, posicaoMediaTotal, top3, top10: 0, encontrado: 0, pontos: 25 })
  it('avisa quando a posição média sobe 1+ ou o top 3 cai 10+ pontos; oscilação pequena não avisa', () => {
    expect(pioraNoGeogrid(m(4.5, 60), m(3.2, 64))).toMatch(/posição média de 3,2º para 4,5º/)
    expect(pioraNoGeogrid(m(3.4, 40), m(3.2, 60))).toMatch(/top 3 de 60% para 40%/)
    expect(pioraNoGeogrid(m(3.5, 58), m(3.2, 60))).toBeNull()
    expect(pioraNoGeogrid(m(2.1, 80), m(3.2, 60))).toBeNull()
  })
})
