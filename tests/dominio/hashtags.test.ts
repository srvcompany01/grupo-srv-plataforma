import { describe, expect, it } from 'vitest'
import { comHashtagsDoCliente, lerHashtags } from '@/dominio/hashtags'

describe('lerHashtags', () => {
  it('aceita espaços, vírgulas e linhas, põe # e tira repetidas', () => {
    expect(lerHashtags('#Belém, marketing\n##Marketing  #aurum_belem; ###')).toEqual(['#Belém', '#marketing', '#aurum_belem'])
  })
  it('respeita o limite e ignora símbolos', () => {
    expect(lerHashtags('a b c d', 2)).toEqual(['#a', '#b'])
    expect(lerHashtags('#o-i! #@@')).toEqual(['#oi'])
  })
})

describe('comHashtagsDoCliente', () => {
  it('acrescenta as que faltam depois de uma linha em branco', () => {
    expect(comHashtagsDoCliente('Texto do post', ['#a', '#b'])).toBe('Texto do post\n\n#a #b')
  })
  it('não repete as que já estão na legenda (ignora maiúsculas)', () => {
    expect(comHashtagsDoCliente('Texto #A', ['#a', '#b'])).toBe('Texto #A\n\n#b')
    expect(comHashtagsDoCliente('Texto #a #b', ['#a', '#b'])).toBe('Texto #a #b')
  })
  it('legenda vazia vira só as hashtags; sem hashtags não muda nada', () => {
    expect(comHashtagsDoCliente('', ['#a'])).toBe('#a')
    expect(comHashtagsDoCliente('Texto', [])).toBe('Texto')
  })
})
