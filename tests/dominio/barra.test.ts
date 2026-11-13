import { describe, expect, it } from 'vitest'
import { COR_BARRA_PADRAO, lerCorBarra, variaveisBarra } from '@/dominio/barra'

describe('cor da barra', () => {
  it('cor inválida ou vazia volta ao padrão; hex curto é expandido', () => {
    expect(lerCorBarra(undefined)).toBe(COR_BARRA_PADRAO)
    expect(lerCorBarra('azul')).toBe(COR_BARRA_PADRAO)
    expect(lerCorBarra('%23FFF')).toBe('#ffffff')
  })
  it('fundo escuro mantém ícones vermelhos com ativo vermelho e ícone branco', () => {
    const v = variaveisBarra('#0b0b0c')
    expect(v['--faixa-icone']).toBe('#e5232a')
    expect(v['--faixa-ativo']).toBe('#d80d12')
    expect(v['--faixa-ativo-icone']).toBe('#ffffff')
  })
  it('fundo vermelho troca os ícones para branco (vermelho sumiria)', () => {
    expect(variaveisBarra('#d80d12')['--faixa-icone']).toBe('#ffffff')
  })
  it('fundo claro usa ícone vermelho quando legível', () => {
    expect(variaveisBarra('#ffffff')['--faixa-icone']).toBe('#e5232a')
  })
})
