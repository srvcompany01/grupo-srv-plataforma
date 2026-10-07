import { describe, expect, it } from 'vitest'
import { filtrarLinhaDoTempo, montarLinhaDoTempo, recortarLinhaDoTempo } from '@/dominio/linha-do-tempo'

const a = (id: number, criadoEm: string) => ({ id, criadoEm })
const c = (id: string, criadoEm: string, texto = '') => ({ id, criadoEm, texto })

describe('montarLinhaDoTempo', () => {
  it('junta em ordem crescente, atividade antes de comentário no empate', () => {
    const r = montarLinhaDoTempo(
      [a(3, '2026-10-07T12:00:00Z'), a(2, '2026-10-07T10:00:00Z'), a(1, '2026-10-07T09:00:00Z')],
      [c('x', '2026-10-07T10:00:00Z'), c('y', '2026-10-07T11:00:00Z')],
    )
    expect(r.map((i) => i.chave)).toEqual(['a-1', 'a-2', 'c-x', 'c-y', 'a-3'])
    expect(r[0]).toMatchObject({ tipo: 'atividade', em: '2026-10-07T09:00:00Z' })
    expect(r[2].tipo).toBe('comentario')
  })
})

describe('recortarLinhaDoTempo', () => {
  const lista = (n: number) => Array.from({ length: n }, (_, i) => i)
  it('11 itens: todos visíveis', () => {
    expect(recortarLinhaDoTempo(lista(11), false)).toEqual({ visiveis: lista(11), ocultos: 0 })
  })
  it('15 itens: o primeiro e os 10 últimos', () => {
    expect(recortarLinhaDoTempo(lista(15), false)).toEqual({ visiveis: [0, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14], ocultos: 4 })
  })
  it('expandido: todos', () => {
    expect(recortarLinhaDoTempo(lista(15), true)).toEqual({ visiveis: lista(15), ocultos: 0 })
  })
})

describe('filtrarLinhaDoTempo', () => {
  const itens = montarLinhaDoTempo([a(1, '2026-10-07T09:00:00Z')], [c('x', '2026-10-07T10:00:00Z', 'Desejo')])
  const texto = (i: (typeof itens)[number]) => (i.tipo === 'comentario' ? i.item.texto : 'Gatilho')
  it('filtra por tipo', () => {
    expect(filtrarLinhaDoTempo(itens, 'comentarios', '', texto).map((i) => i.tipo)).toEqual(['comentario'])
    expect(filtrarLinhaDoTempo(itens, 'historico', '', texto).map((i) => i.tipo)).toEqual(['atividade'])
  })
  it('busca sem acento e sem maiúsculas', () => {
    expect(filtrarLinhaDoTempo(itens, 'tudo', 'désejo', texto)).toHaveLength(1)
    expect(filtrarLinhaDoTempo(itens, 'tudo', 'DESEJO', texto)).toHaveLength(1)
  })
  it('busca vazia não filtra', () => {
    expect(filtrarLinhaDoTempo(itens, 'tudo', '  ', texto)).toHaveLength(2)
  })
})
