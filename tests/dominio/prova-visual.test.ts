import { describe, expect, it } from 'vitest'
import {
  contarAbertos,
  descreverLocal,
  formatarInstante,
  moverMira,
  numerarComentarios,
  pontoEmPercentual,
  percentualEmPosicao,
  retanguloDaMidia,
  tempoRelativo,
  validarComentario,
  type ComentarioProva,
} from '@/dominio/prova-visual'

const c = (id: string, extra: Partial<ComentarioProva> = {}): ComentarioProva => ({
  id, versaoId: 'v1', paiId: null, autorTipo: 'cliente', autor: 'Maria', texto: 't', midia: 0, x: 10, y: 10, segundo: null, resolvidoEm: null, resolvidoPor: null, criadoEm: '2026-11-24T10:00:00Z', ...extra,
})

describe('numeração', () => {
  it('numera as raízes pela ordem e junta as respostas', () => {
    const lista = [
      c('b', { criadoEm: '2026-11-24T10:05:00Z' }),
      c('a', { criadoEm: '2026-11-24T10:00:00Z' }),
      c('r2', { paiId: 'a', autorTipo: 'equipe', autor: 'Ana', midia: null, x: null, y: null, criadoEm: '2026-11-24T10:20:00Z' }),
      c('r1', { paiId: 'a', criadoEm: '2026-11-24T10:10:00Z', midia: null, x: null, y: null }),
    ]
    const n = numerarComentarios(lista)
    expect(n.map((x) => [x.id, x.numero])).toEqual([['a', 1], ['b', 2]])
    expect(n[0].respostas.map((r) => r.id)).toEqual(['r1', 'r2'])
  })

  it('conta só raízes em aberto', () => {
    expect(contarAbertos([c('a'), c('b', { resolvidoEm: '2026-11-25T00:00:00Z' }), c('r', { paiId: 'a' })])).toBe(1)
  })
})

describe('texto', () => {
  it('formata o instante do vídeo', () => {
    expect(formatarInstante(12.9)).toBe('0:12')
    expect(formatarInstante(65)).toBe('1:05')
    expect(formatarInstante(3725)).toBe('1:02:05')
  })

  it('descreve o local', () => {
    expect(descreverLocal({ midia: null, segundo: null }, [])).toBe('Geral')
    expect(descreverLocal({ midia: 1, segundo: null }, ['imagem', 'imagem'])).toBe('Imagem 2')
    expect(descreverLocal({ midia: 0, segundo: 12 }, ['video'])).toBe('Vídeo 1 · 0:12')
  })

  it('tempo relativo', () => {
    const agora = Date.parse('2026-11-24T12:00:00Z')
    expect(tempoRelativo('2026-11-24T11:59:40Z', agora)).toBe('agora')
    expect(tempoRelativo('2026-11-24T11:55:00Z', agora)).toBe('há 5 min')
    expect(tempoRelativo('2026-11-24T09:00:00Z', agora)).toBe('há 3 h')
    expect(tempoRelativo('2026-11-22T12:00:00Z', agora)).toBe('há 2 dias')
  })
})

describe('geometria do ponto (object-contain)', () => {
  it('imagem larga numa caixa 4:5 tem faixas em cima e embaixo', () => {
    const r = retanguloDaMidia({ largura: 400, altura: 500 }, { largura: 1000, altura: 500 })
    expect(r).toEqual({ x: 0, y: 150, largura: 400, altura: 200 })
  })

  it('imagem alta numa caixa larga tem faixas dos lados', () => {
    const r = retanguloDaMidia({ largura: 400, altura: 300 }, { largura: 300, altura: 600 })
    expect(r).toEqual({ x: 125, y: 0, largura: 150, altura: 300 })
  })

  it('sem tamanho natural usa a caixa inteira', () => {
    expect(retanguloDaMidia({ largura: 400, altura: 500 }, null)).toEqual({ x: 0, y: 0, largura: 400, altura: 500 })
  })

  it('toque vira percentual da mídia, descontando o letterbox, e toque na faixa é ignorado', () => {
    const r = retanguloDaMidia({ largura: 400, altura: 500 }, { largura: 1000, altura: 500 })
    expect(pontoEmPercentual({ x: 200, y: 250 }, r)).toEqual({ x: 50, y: 50 })
    expect(pontoEmPercentual({ x: 100, y: 150 }, r)).toEqual({ x: 25, y: 0 })
    expect(pontoEmPercentual({ x: 100, y: 100 }, r)).toBeNull() // faixa de cima
  })

  it('ida e volta entre percentual e px', () => {
    const r = retanguloDaMidia({ largura: 400, altura: 500 }, { largura: 1000, altura: 500 })
    const p = percentualEmPosicao({ x: 25, y: 75 }, r)
    expect(p).toEqual({ x: 100, y: 300 })
    expect(pontoEmPercentual(p, r)).toEqual({ x: 25, y: 75 })
  })

  it('a mira anda 2% (10% com Shift) e não sai da mídia', () => {
    expect(moverMira({ x: 50, y: 50 }, 'ArrowRight', false)).toEqual({ x: 52, y: 50 })
    expect(moverMira({ x: 50, y: 50 }, 'ArrowUp', true)).toEqual({ x: 50, y: 40 })
    expect(moverMira({ x: 1, y: 99 }, 'ArrowLeft', true)).toEqual({ x: 0, y: 99 })
    expect(moverMira({ x: 50, y: 50 }, 'a', false)).toEqual({ x: 50, y: 50 })
  })
})

describe('validação', () => {
  const ok = { texto: 'Trocar a cor', nome: 'Maria', midia: 0, x: 10, y: 20, segundo: null }
  it('aceita ponto, instante e comentário geral', () => {
    expect(validarComentario(ok)).toBeNull()
    expect(validarComentario({ ...ok, x: null, y: null, segundo: 12 })).toBeNull()
    expect(validarComentario({ ...ok, midia: null, x: null, y: null })).toBeNull()
  })
  it('recusa o que o banco também recusa', () => {
    expect(validarComentario({ ...ok, nome: ' ' })).toBe('Informe o seu nome.')
    expect(validarComentario({ ...ok, texto: '' })).toBe('Escreva o comentário.')
    expect(validarComentario({ ...ok, x: 120 })).toBe('Ponto fora da mídia.')
    expect(validarComentario({ ...ok, y: null })).toBe('Ponto inválido.')
    expect(validarComentario({ ...ok, midia: null })).toBe('Escolha a mídia do comentário.')
    expect(validarComentario({ ...ok, texto: 'x'.repeat(2001) })).toBe('O comentário passou de 2000 caracteres.')
  })
})

import { filtroDeCursor, ipDoPedido, limitesDoComentario } from '@/dominio/limite'

describe('limite público e leitura paginada', () => {
  it('IP do x-forwarded-for: primeiro da lista, e lixo vira "sem-ip"', () => {
    expect(ipDoPedido('203.0.113.9, 10.0.0.1')).toBe('203.0.113.9')
    expect(ipDoPedido('2001:db8::1')).toBe('2001:db8::1')
    expect(ipDoPedido(null)).toBe('sem-ip')
    expect(ipDoPedido("1.2.3.4'; drop table x;--")).toBe('sem-ip')
  })

  it('duas chaves por comentário: por link+post e por IP', () => {
    const l = limitesDoComentario('loja-aurora-abc123', 't1', '203.0.113.9')
    expect(l.map((x) => x.chave)).toEqual(['prova|post|loja-aurora-abc123|t1', 'prova|ip|203.0.113.9'])
    expect(l.every((x) => x.max > 0 && x.janelaSegundos > 0)).toBe(true)
  })

  it('cursor (created_at, id): sem cursor não filtra; com cursor pega o que vem depois, com desempate pelo id', () => {
    expect(filtroDeCursor(null)).toBeNull()
    expect(filtroDeCursor({ criadoEm: '2026-11-24T10:00:00+00:00', id: 'abc' })).toBe('created_at.gt.2026-11-24T10:00:00+00:00,and(created_at.eq.2026-11-24T10:00:00+00:00,id.gt.abc)')
  })
})
