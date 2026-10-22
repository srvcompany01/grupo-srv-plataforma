import { describe, expect, it } from 'vitest'
import { duracao, situacao } from '@/dominio/time'

describe('time', () => {
  const agora = new Date('2026-10-22T15:00:00Z')
  const ha = (min: number) => new Date(agora.getTime() - min * 60_000).toISOString()
  it('situação pela última atividade', () => {
    expect(situacao({ vistoEm: ha(1), ativoEm: ha(2) }, agora)).toBe('ativo')
    expect(situacao({ vistoEm: ha(1), ativoEm: ha(20) }, agora)).toBe('ocioso')
    expect(situacao({ vistoEm: ha(10), ativoEm: ha(10) }, agora)).toBe('offline')
    expect(situacao({ vistoEm: null, ativoEm: null }, agora)).toBe('offline')
  })
  it('duração legível', () => {
    expect(duracao(7)).toBe('7 min')
    expect(duracao(125)).toBe('2 h 05 min')
    expect(duracao(120)).toBe('2 h')
    expect(duracao(3 * 1440)).toBe('3 dias')
  })
})
