import { describe, expect, it } from 'vitest'
import { analisarSaude, avaliacoesPorMes, categoriasExtras, comparativo, concorrentesDaGrade, corDaPosicao, fraseGeogrid, liderDaGrade, pctPrimeiro, telefoneDivergente, gerarGrade, linkAvaliacao, metricasDaGrade, pioraNoGeogrid, pixel, raioDoVies, textoProposta, zoomParaCaber, type PerfilPublico } from '@/dominio/gmn'

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

describe('comparativo com concorrentes', () => {
  const p = (extra: Partial<PerfilPublico>): PerfilPublico => ({ status: 'OPERATIONAL', nota: 4.8, avaliacoes: 100, fotos: 10, temHorario: true, site: 'x', telefone: 'x', categoriaPrincipal: 'Joalheria', categorias: ['jewelry_store'], resumo: null, ultimaAvaliacaoEm: null, ...extra })
  it('verde quando ganha de todos, vermelho quando perde para todos, amarelo no meio; sim/não', () => {
    const linhas = comparativo([
      { nome: 'Cliente', perfil: p({ avaliacoes: 40, site: null }), saude: 70 },
      { nome: 'A', perfil: p({ avaliacoes: 391 }), saude: 90 },
      { nome: 'B', perfil: p({ avaliacoes: 13, site: null }), saude: 60 },
    ])
    const l = (r: string) => linhas.find((x) => x.rotulo === r)!
    expect(l('Avaliações')).toMatchObject({ valores: ['40', '391', '13'], tomCliente: 'atencao' })
    expect(l('Saúde do perfil').tomCliente).toBe('atencao')
    expect(l('Nota').tomCliente).toBe('bom')
    expect(l('Site')).toMatchObject({ valores: ['Não', 'Sim', 'Não'], tomCliente: 'ruim' })
  })
})

describe('R1-3: liderança no geogrid', () => {
  const ponto = (posicao: number | null, top: string[]) => ({ lat: 0, lng: 0, posicao, top })
  const pontos = [ponto(2, ['rival', 'eu', 'x']), ponto(2, ['rival', 'eu', 'y']), ponto(1, ['eu', 'rival', 'x']), ponto(3, ['rival', 'z', 'eu'])]
  it('% em 1º, o concorrente líder e a frase que não esconde quem lidera', () => {
    expect(pctPrimeiro(pontos)).toBe(25)
    expect(liderDaGrade(pontos, 'eu')).toEqual({ id: 'rival', vezes: 3, pct: 75 })
    const f = fraseGeogrid('compro ouro', { top3: 100, posicaoMediaTotal: 2 }, 25, { nome: 'Compra Ouro Pará', pct: 75 })
    expect(f).toMatch(/Top 3 .* 100% da região.*1º lugar em 25%.*Compra Ouro Pará \(75% dos pontos\)/)
    expect(fraseGeogrid('x', { top3: 100, posicaoMediaTotal: 1.2 }, 80, null)).toMatch(/^1º lugar no Google Maps em 80%/)
  })
})

describe('R2-1: categorias adicionais com uma conta só', () => {
  it('a saúde e o comparativo dão o mesmo número (a principal é comparada pelo id)', () => {
    const perfil = { status: 'OPERATIONAL', nota: 4.9, avaliacoes: 613, fotos: 10, temHorario: true, site: 'x', telefone: 'x', categoriaPrincipal: 'Joalheria', tipoPrincipal: 'jewelry_store', categorias: ['jewelry_store', 'store', 'point_of_interest', 'establishment'], resumo: null, ultimaAvaliacaoEm: null }
    expect(categoriasExtras(perfil)).toBe(0)
    expect(analisarSaude(perfil, '2026-10-24').itens.find((i) => i.titulo === 'Categorias adicionais')?.detalhe).toMatch(/^0 categoria/)
    expect(comparativo([{ nome: 'Aurum', perfil, saude: 80 }]).find((l) => l.rotulo === 'Categorias adicionais')?.valores[0]).toBe('0')
  })
})

describe('R2-2: avaliações novas pela foto diária', () => {
  it('sem 7 dias de histórico: "sem dados" e não pesa na nota; com histórico: ritmo por mês', () => {
    const perfil = { status: 'OPERATIONAL', nota: 4.9, avaliacoes: 613, fotos: 10, temHorario: true, site: 'x', telefone: 'x', categoriaPrincipal: 'J', tipoPrincipal: 'a', categorias: ['a', 'b', 'c'], resumo: 'r', ultimaAvaliacaoEm: '2026-06-17T10:00:00Z' }
    const sem = analisarSaude(perfil, '2026-10-24')
    expect(sem.itens.find((i) => i.titulo === 'Avaliações novas')).toMatchObject({ tom: 'atencao', peso: 0, detalhe: expect.stringMatching(/Sem dados ainda/) })
    expect(sem.nota).toBe(100) // a avaliação destacada de 129 dias atrás não derruba mais a nota
    expect(avaliacoesPorMes([{ dia: '2026-10-01', avaliacoes: 600 }, { dia: '2026-10-31', avaliacoes: 612 }])).toEqual({ porMes: 12, dias: 30 })
    expect(avaliacoesPorMes([{ dia: '2026-10-20', avaliacoes: 600 }, { dia: '2026-10-24', avaliacoes: 601 }])).toBeNull()
    const com = analisarSaude(perfil, '2026-10-31', null, [{ dia: '2026-10-01', avaliacoes: 613 }, { dia: '2026-10-31', avaliacoes: 613 }])
    expect(com.itens.find((i) => i.titulo === 'Avaliações novas')).toMatchObject({ tom: 'ruim', peso: 2 })
  })
})

describe('R2-4: telefone divergente', () => {
  it('avisa quando o do Google não bate com o telefone nem com o WhatsApp do cadastro', () => {
    expect(telefoneDivergente('(91) 98325-0007', ['91984479696', null])).toMatch(/\(91\) 98325-0007.*91984479696/)
    expect(telefoneDivergente('(91) 98325-0007', [null, '5591983250007'])).toBeNull()
    expect(telefoneDivergente('(91) 3333-4444', ['9133334444'])).toBeNull()
    expect(telefoneDivergente(null, ['91984479696'])).toBeNull()
    expect(telefoneDivergente('(91) 98325-0007', [null, null])).toBeNull()
  })
})
