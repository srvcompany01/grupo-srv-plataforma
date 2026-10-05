import { describe, expect, it } from 'vitest'
import { edicaoCriaNovaVersao, podeEnviar, statusAposEdicao, statusAposResposta } from '@/dominio/status'

describe('status', () => {
  it('só cria versão nova depois de uma resposta', () => {
    expect(edicaoCriaNovaVersao('rascunho')).toBe(false)
    expect(edicaoCriaNovaVersao('aguardando')).toBe(false)
    expect(edicaoCriaNovaVersao('ajuste')).toBe(true)
    expect(edicaoCriaNovaVersao('aprovado')).toBe(true)
  })

  it('edição mantém rascunho e manda o resto para aguardando', () => {
    expect(statusAposEdicao('rascunho')).toBe('rascunho')
    expect(statusAposEdicao('aguardando')).toBe('aguardando')
    expect(statusAposEdicao('ajuste')).toBe('aguardando')
    expect(statusAposEdicao('aprovado')).toBe('aguardando')
  })

  it('só envia a partir de rascunho', () => {
    expect(podeEnviar('rascunho')).toBe(true)
    expect(podeEnviar('aguardando')).toBe(false)
    expect(podeEnviar('ajuste')).toBe(false)
    expect(podeEnviar('aprovado')).toBe(false)
  })

  it('resposta define o status', () => {
    expect(statusAposResposta('aprovado')).toBe('aprovado')
    expect(statusAposResposta('ajuste')).toBe('ajuste')
  })
})
