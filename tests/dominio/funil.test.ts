import { describe, expect, it } from 'vitest'
import { FUNIL_MODELO, FUNIL_VAZIO, calcularFunil, lerDadosFunil, type DadosFunil, type TipoNo } from '@/dominio/funil'

describe('calcularFunil', () => {
  it('propaga visitantes pelas taxas e calcula receita, custo, CPL, CAC e ROAS (funil modelo)', () => {
    const r = calcularFunil(FUNIL_MODELO)
    // 5000 → 5000 (100%) → 600 (12%) → 420 (70%) → 168 (40%) → 50,4 (30%)
    expect(r.nos.n2.visitantes).toBe(5000)
    expect(r.nos.n3.visitantes).toBe(600)
    expect(r.nos.n6.visitantes).toBeCloseTo(50.4)
    expect(r.nos.n6.receita).toBeCloseTo(126000)
    expect(r.totais).toMatchObject({ entrada: 5000, custo: 3000, leads: 600, vendas: expect.closeTo(50.4) })
    expect(r.totais.cpl).toBeCloseTo(5)
    expect(r.totais.cac).toBeCloseTo(3000 / 50.4)
    expect(r.totais.roas).toBeCloseTo(42)
    expect(r.totais.lucro).toBeCloseTo(123000)
    expect(r.totais.conversao).toBeCloseTo(50.4 / 5000)
  })

  it('soma ligações que chegam ao mesmo nó e várias origens', () => {
    const d: DadosFunil = {
      nos: ['a', 'b', 'c'].map((id, i) => ({ id, tipo: id === 'c' ? 'venda' : 'trafego', nome: id, x: i, y: 0, visitantes: id === 'a' ? 100 : id === 'b' ? 200 : 0, custo: 0, valor: 10 })),
      ligacoes: [{ id: 'l1', de: 'a', para: 'c', taxa: 50 }, { id: 'l2', de: 'b', para: 'c', taxa: 25 }],
    }
    const r = calcularFunil(d)
    expect(r.nos.c.visitantes).toBe(100)
    expect(r.nos.c.receita).toBe(1000)
    expect(r.fluxo).toEqual({ l1: 50, l2: 50 })
    expect(r.totais.entrada).toBe(300)
  })

  it('a visitantes de um nó que recebe ligação é ignorada; razões sem divisor viram null (sem venda, a conversão é 0)', () => {
    const d: DadosFunil = { nos: [{ id: 'a', tipo: 'trafego', nome: 'a', x: 0, y: 0, visitantes: 10, custo: 0, valor: 0 }, { id: 'b', tipo: 'pagina', nome: 'b', x: 1, y: 0, visitantes: 999, custo: 0, valor: 0 }], ligacoes: [{ id: 'l', de: 'a', para: 'b', taxa: 10 }] }
    const r = calcularFunil(d)
    expect(r.nos.b.visitantes).toBe(1)
    expect(r.totais).toMatchObject({ cpl: null, cac: null, roas: null, conversao: 0 })
  })

  it('ciclo não trava: a ligação que volta é ignorada e marcada', () => {
    const d: DadosFunil = {
      nos: [{ id: 'a', tipo: 'trafego', nome: 'a', x: 0, y: 0, visitantes: 100, custo: 0, valor: 0 }, { id: 'b', tipo: 'pagina', nome: 'b', x: 1, y: 0, visitantes: 0, custo: 0, valor: 0 }, { id: 'c', tipo: 'pagina', nome: 'c', x: 2, y: 0, visitantes: 0, custo: 0, valor: 0 }],
      ligacoes: [{ id: 'l1', de: 'a', para: 'b', taxa: 50 }, { id: 'l2', de: 'b', para: 'c', taxa: 50 }, { id: 'l3', de: 'c', para: 'b', taxa: 50 }],
    }
    const r = calcularFunil(d)
    expect(r.ciclos).toHaveLength(1)
    expect(Number.isFinite(r.nos.b.visitantes) && Number.isFinite(r.nos.c.visitantes)).toBe(true)
  })

  it('avisa quando as taxas que saem de um nó passam de 100%', () => {
    const d: DadosFunil = { nos: ['a', 'b', 'c'].map((id, i) => ({ id, tipo: 'pagina', nome: id, x: i, y: 0, visitantes: 10, custo: 0, valor: 0 })), ligacoes: [{ id: 'l1', de: 'a', para: 'b', taxa: 70 }, { id: 'l2', de: 'a', para: 'c', taxa: 60 }] }
    const r = calcularFunil(d)
    expect(r.nos.a.excesso).toBe(true)
    expect(r.nos.b.excesso).toBe(false)
  })
})

describe('lerDadosFunil', () => {
  it('descarta nós inválidos e ligações órfãs, duplicadas ou para si mesmas', () => {
    const bom = FUNIL_MODELO.nos[0]
    const r = lerDadosFunil({
      nos: [bom, { ...FUNIL_MODELO.nos[1] }, { id: 'ruim', tipo: 'inexistente' }, 'lixo'],
      ligacoes: [{ id: 'a', de: 'n1', para: 'n2', taxa: 50 }, { id: 'b', de: 'n1', para: 'n2', taxa: 60 }, { id: 'c', de: 'n1', para: 'n1', taxa: 5 }, { id: 'd', de: 'n1', para: 'ruim', taxa: 5 }, { id: 'e', de: 'n1', para: 'n2', taxa: 500 }],
    })
    expect(r.nos.map((n) => n.id)).toEqual(['n1', 'n2'])
    expect(r.ligacoes.map((l) => l.id)).toEqual(['a'])
  })
  it.each([null, undefined, 3, 'x', {}, { nos: 1, ligacoes: [] }])('dados quebrados (%j) viram funil vazio', (v) => expect(lerDadosFunil(v)).toEqual(FUNIL_VAZIO))
})

import { organizarFunil } from '@/dominio/funil'

describe('organizarFunil', () => {
  it('coloca cada etapa à direita da anterior e empilha as que dividem a coluna', () => {
    const r = organizarFunil({ ...FUNIL_MODELO, ligacoes: [...FUNIL_MODELO.ligacoes, { id: 'x', de: 'n1', para: 'n3', taxa: 5 }] })
    const col = (id: string) => r.nos.find((n) => n.id === id)!.x / 280
    expect(['n1', 'n2', 'n3', 'n4', 'n5', 'n6'].map(col)).toEqual([0, 1, 2, 3, 4, 5])
    const dois = organizarFunil({ nos: FUNIL_MODELO.nos.slice(0, 3), ligacoes: [{ id: 'a', de: 'n1', para: 'n2', taxa: 1 }, { id: 'b', de: 'n1', para: 'n3', taxa: 1 }] })
    expect(dois.nos.map((n) => [n.x, n.y])).toEqual([[0, 0], [280, 0], [280, 110]])
  })
  it('não trava com ciclo', () => {
    const d = { nos: FUNIL_MODELO.nos.slice(0, 2), ligacoes: [{ id: 'a', de: 'n1', para: 'n2', taxa: 1 }, { id: 'b', de: 'n2', para: 'n1', taxa: 1 }] }
    expect(organizarFunil(d).nos).toHaveLength(2)
  })

  it('WhatsApp conta como lead (sem contar duas vezes depois de um formulário) e sem investimento cpl/cac são null', () => {
    const n = (id: string, tipo: TipoNo, visitantes = 0, custo = 0) => ({ id, tipo, nome: id, x: 0, y: 0, visitantes, custo, valor: tipo === 'venda' ? 100 : 0 })
    const direto = calcularFunil({ nos: [n('t', 'trafego', 1000), n('w', 'whatsapp'), n('v', 'venda')], ligacoes: [{ id: 'a', de: 't', para: 'w', taxa: 7 }, { id: 'b', de: 'w', para: 'v', taxa: 10 }] })
    expect(direto.totais.leads).toBeCloseTo(70)
    expect(direto.totais).toMatchObject({ cpl: null, cac: null })
    expect(direto.totais.conversao).toBeCloseTo(0.007)
    const emSequencia = calcularFunil({ nos: [n('t', 'trafego', 1000, 500), n('f', 'formulario'), n('w', 'whatsapp')], ligacoes: [{ id: 'a', de: 't', para: 'f', taxa: 10 }, { id: 'b', de: 'f', para: 'w', taxa: 50 }] })
    expect(emSequencia.totais.leads).toBeCloseTo(100)
    expect(emSequencia.totais.cpl).toBeCloseTo(5)
  })
})
