import { describe, expect, it } from 'vitest'
import { arvoreParaDestino } from '@/dominio/destino-caixa'
import type { Navegacao } from '@/dominio/arvore-espacos'

const visual = { cor: '', icone: '', emoji: null }
const lista = (id: string, nome: string) => ({ id, nome, espacoId: null, pastaId: null, posicao: 'a', clienteNome: '', mes: null, ...visual })
const nav = {
  espacos: [
    { id: 'e1', nome: 'Aurum', descricao: null, posicao: 'a', paiId: null, ...visual, listas: [lista('l1', 'Posts'), lista('l2', 'Tarefas')], pastas: [{ id: 'p1', nome: 'Maio', espacoId: 'e1', posicao: 'a', ...visual, listas: [lista('l3', 'Reels')] }], filhos: [{ id: 'e2', nome: 'Ouro', descricao: null, posicao: 'a', paiId: 'e1', ...visual, listas: [lista('l4', 'Feed')], pastas: [], filhos: [] }] },
    { id: 'e3', nome: 'Vazio', descricao: null, posicao: 'b', paiId: null, ...visual, listas: [lista('l5', 'Outra')], pastas: [], filhos: [] },
  ],
  pastasRaiz: [],
  listasRaiz: [lista('l6', 'Solta')],
} as unknown as Navegacao

describe('arvoreParaDestino', () => {
  it('só traz listas de conteúdo, com sub-áreas achatadas e sem ramos vazios', () => {
    const r = arvoreParaDestino(nav, new Set(['l1', 'l3', 'l4', 'l6']))
    expect(r.map((e) => e.nome)).toEqual(['Aurum', 'Aurum › Ouro', 'Sem espaço'])
    expect(r[0].listas.map((l) => l.id)).toEqual(['l1'])
    expect(r[0].pastas[0].listas.map((l) => l.id)).toEqual(['l3'])
    expect(r[2].listas.map((l) => l.id)).toEqual(['l6'])
  })
})
