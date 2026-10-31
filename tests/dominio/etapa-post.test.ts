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
  it('não confunde aprovação interna com a do cliente e devolve null se não houver', () => {
    expect(opcaoDaEtapa(['Aprovação interna', 'Edição'], 'aprovacao_cliente')).toBeNull()
    expect(opcaoDaEtapa(['Roteiro'], 'postado')).toBeNull()
  })
})

it('reconhece o campo Etapa', () => {
  expect(ehCampoEtapa(' Etapa ')).toBe(true)
  expect(ehCampoEtapa('Etapas do post')).toBe(false)
})
