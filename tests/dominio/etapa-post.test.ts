import { describe, expect, it } from 'vitest'
import { ehCampoEtapa, opcaoDaEtapa } from '@/dominio/etapa-post'

const opcoes = ['Roteiro', 'Gravação', 'Edição', 'Aprovação cliente', 'Agendado', 'Postado']

describe('opcaoDaEtapa', () => {
  it('acha a opção de cada etapa pelo nome', () => {
    expect(opcaoDaEtapa(opcoes, 'aprovacao_cliente')).toBe('Aprovação cliente')
    expect(opcaoDaEtapa(opcoes, 'agendado')).toBe('Agendado')
    expect(opcaoDaEtapa(opcoes, 'postado')).toBe('Postado')
  })
  it('ignora acento, maiúsculas e variações', () => {
    expect(opcaoDaEtapa(['APROVACAO DO CLIENTE'], 'aprovacao_cliente')).toBe('APROVACAO DO CLIENTE')
    expect(opcaoDaEtapa(['Publicado'], 'postado')).toBe('Publicado')
    expect(opcaoDaEtapa(['Agendada'], 'agendado')).toBe('Agendada')
  })
  it('usa "Aprovação" quando não há uma opção específica do cliente, e prefere a do cliente se existir', () => {
    expect(opcaoDaEtapa(['Ideia', 'Copy', 'Design', 'Aprovação', 'Agendado', 'Postado'], 'aprovacao_cliente')).toBe('Aprovação')
    expect(opcaoDaEtapa(['Aprovação interna', 'Aprovação cliente'], 'aprovacao_cliente')).toBe('Aprovação cliente')
  })
  it('devolve null quando não há opção parecida', () => {
    expect(opcaoDaEtapa(['Edição'], 'aprovacao_cliente')).toBeNull()
    expect(opcaoDaEtapa(['Roteiro'], 'postado')).toBeNull()
  })
})

it('reconhece o campo Etapa', () => {
  expect(ehCampoEtapa(' Etapa ')).toBe(true)
  expect(ehCampoEtapa('Etapas do post')).toBe(false)
})
