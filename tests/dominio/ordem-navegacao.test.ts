import { expect, it } from 'vitest'
import { escreverOrdem, lerOrdem, mesclarOrdem, ordenarItens } from '@/dominio/tema-lateral'

const itens = ['a', 'b', 'c', 'd'].map((id) => ({ id }))

it('aplica a ordem salva; itens novos vão para o fim e ids que sumiram são ignorados', () => {
  expect(ordenarItens(itens, ['c', 'a', 'x']).map((i) => i.id)).toEqual(['c', 'a', 'b', 'd'])
  expect(ordenarItens(itens, []).map((i) => i.id)).toEqual(['a', 'b', 'c', 'd'])
})

it('lê o cookie ignorando lixo e repetidos', () => {
  expect(lerOrdem('b.a.b.<script>.c')).toEqual(['b', 'a', 'c'])
  expect(lerOrdem(undefined)).toEqual([])
  expect(lerOrdem(escreverOrdem(['x', 'y']))).toEqual(['x', 'y'])
})

it('mesclarOrdem mantém a ordem de outras listas ao reorganizar uma', () => {
  // grupo Marketing reorganizado; a ordem dos atalhos soltos (home, chat) não se perde
  expect(mesclarOrdem(['gmn', 'anuncios'], ['home', 'chat', 'anuncios', 'gmn'])).toEqual(['gmn', 'anuncios', 'home', 'chat'])
  expect(mesclarOrdem(['a', 'b'], [])).toEqual(['a', 'b'])
})
