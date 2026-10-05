import { describe, expect, it } from 'vitest'
import { criarCookieSessao, senhaConfere, sessaoValida } from '@/infra/sessao'

const S = 'segredo-de-teste'
const agora = Date.UTC(2026, 9, 5)
const dia = 24 * 60 * 60 * 1000

describe('sessão', () => {
  it('vale por 30 dias', () => {
    const c = criarCookieSessao(S, agora)
    expect(sessaoValida(c, S, agora)).toBe(true)
    expect(sessaoValida(c, S, agora + 29 * dia)).toBe(true)
    expect(sessaoValida(c, S, agora + 31 * dia)).toBe(false)
  })

  it('recusa assinatura adulterada, outro segredo e ausência', () => {
    const c = criarCookieSessao(S, agora)
    const ultimo = c.at(-1) === 'A' ? 'B' : 'A'
    expect(sessaoValida(c.slice(0, -1) + ultimo, S, agora)).toBe(false)
    expect(sessaoValida(c, 'outro', agora)).toBe(false)
    expect(sessaoValida(undefined, S, agora)).toBe(false)
    expect(sessaoValida('lixo', S, agora)).toBe(false)
  })

  it('recusa validade estendida à mão', () => {
    const c = criarCookieSessao(S, agora)
    const [, assinatura] = c.split('.')
    expect(sessaoValida(`${agora + 365 * dia}.${assinatura}`, S, agora)).toBe(false)
  })
})

describe('senha', () => {
  it('compara exatamente', () => {
    expect(senhaConfere('abc', 'abc')).toBe(true)
    expect(senhaConfere('abc', 'abd')).toBe(false)
    expect(senhaConfere('', 'abc')).toBe(false)
    expect(senhaConfere('', '')).toBe(false)
  })
})
