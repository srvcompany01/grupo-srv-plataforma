import { expect, it } from 'vitest'
import { caminhoDaLista, limparOpcoes, normalizarHex } from '@/dominio/campos-gestao'
import { CORES_PERSONALIZACAO, corDaOpcao } from '@/dominio/personalizacao'

it('normaliza HEX com ou sem # e na forma curta', () => {
  expect(normalizarHex('#D11A22')).toBe('#d11a22')
  expect(normalizarHex('d11a22')).toBe('#d11a22')
  expect(normalizarHex(' #f0a ')).toBe('#ff00aa')
  expect(normalizarHex('#12345')).toBeNull()
  expect(normalizarHex('zzzzzz')).toBeNull()
  expect(normalizarHex('')).toBeNull()
})

it('monta o caminho Espaço › Pasta › Lista', () => {
  const espacos = [{ id: 'e1', nome: 'Marketing' }]
  const pastas = [{ id: 'p1', nome: 'Social', espacoId: 'e1' }]
  expect(caminhoDaLista({ id: 'l1', nome: 'Posts', espacoId: 'e1', pastaId: 'p1' }, espacos, pastas)).toBe('Marketing › Social › Posts')
  expect(caminhoDaLista({ id: 'l2', nome: 'Ideias', espacoId: 'e1', pastaId: null }, espacos, pastas)).toBe('Marketing › Ideias')
  expect(caminhoDaLista({ id: 'l3', nome: 'Geral', espacoId: null, pastaId: null }, espacos, pastas)).toBe('Raiz › Geral')
})

it('limpa opções vazias, repetidas e cores inválidas', () => {
  const r = limparOpcoes({ options: [' A ', '', 'A', 'B', 'C'], optionColors: { A: '#ABC', B: 'xx', Z: '#ffffff' } })
  expect(r.options).toEqual(['A', 'B', 'C'])
  expect(r.optionColors).toEqual({ A: '#aabbcc' })
  expect(limparOpcoes({ currency: 'BRL' })).toEqual({ currency: 'BRL' })
})

it('usa a cor da opção ou a da paleta pela posição', () => {
  const config = { options: ['A', 'B'], optionColors: { B: '#123456' } }
  expect(corDaOpcao(config, 'A')).toBe(CORES_PERSONALIZACAO[0])
  expect(corDaOpcao(config, 'B')).toBe('#123456')
})
