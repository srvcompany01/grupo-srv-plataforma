import { describe, expect, it } from 'vitest'
import type { Navegacao } from '@/dominio/arvore-espacos'
import { ehCampoDeTexto, itensDaNavegacao, rotaDoAtalho } from '@/dominio/paleta'

const visual = { cor: '#000', icone: 'x', emoji: null }
const nav: Navegacao = {
  espacos: [
    {
      ...visual, id: 'e1', nome: 'Operação', descricao: null, posicao: 'a', paiId: null,
      listas: [{ ...visual, id: 'l1', nome: 'Geral', espacoId: 'e1', pastaId: null, posicao: 'a', clienteNome: '', mes: null }],
      pastas: [{ ...visual, id: 'p1', nome: 'Social', espacoId: 'e1', posicao: 'a', listas: [{ ...visual, id: 'l2', nome: 'Máquina', espacoId: 'e1', pastaId: 'p1', posicao: 'a', clienteNome: '', mes: null }] }],
      filhos: [],
    },
  ],
  pastasRaiz: [],
  listasRaiz: [{ ...visual, id: 'l3', nome: 'Solta', espacoId: null, pastaId: null, posicao: 'a', clienteNome: '', mes: null }],
}

describe('paleta de comandos', () => {
  it('acha espaços e listas com o caminho legível', () => {
    const itens = itensDaNavegacao(nav)
    expect(itens.map((i) => i.href)).toEqual(['/espacos/e1', '/listas/l1', '/listas/l2', '/listas/l3'])
    expect(itens.find((i) => i.id === 'l2')?.contexto).toBe('Operação / Social')
    expect(itens.find((i) => i.id === 'l3')?.contexto).toBe('')
  })
  it('atalhos de uma tecla levam à rota certa, sem diferenciar maiúscula', () => {
    expect(rotaDoAtalho('h')).toBe('/home')
    expect(rotaDoAtalho('D')).toBe('/painel-de-gestao')
    expect(rotaDoAtalho('z')).toBeNull()
  })
  it('não dispara atalho enquanto a pessoa digita', () => {
    expect(ehCampoDeTexto({ tagName: 'input' })).toBe(true)
    expect(ehCampoDeTexto({ tagName: 'DIV', isContentEditable: true })).toBe(true)
    expect(ehCampoDeTexto({ tagName: 'BUTTON' })).toBe(false)
    expect(ehCampoDeTexto(null)).toBe(false)
  })
})
