import { describe, expect, it } from 'vitest'
import { alertaDeErro, alertaDoTokenMeta } from '@/dominio/alertas'

const AGORA = Date.UTC(2026, 10, 10)
const emDias = (d: number) => Math.floor((AGORA + d * 86_400_000) / 1000) + 3600

describe('alertaDoTokenMeta', () => {
  it('não avisa token que não vence, com folga ou sem resposta', () => {
    expect(alertaDoTokenMeta({ is_valid: true, expires_at: 0 }, AGORA)).toBeNull()
    expect(alertaDoTokenMeta({ is_valid: true, expires_at: emDias(30) }, AGORA)).toBeNull()
    expect(alertaDoTokenMeta(null, AGORA)).toBeNull()
  })
  it('avisa inválido e perto de vencer', () => {
    expect(alertaDoTokenMeta({ is_valid: false }, AGORA)).toMatch(/inválido/)
    expect(alertaDoTokenMeta({ is_valid: true, expires_at: emDias(7) }, AGORA)).toMatch(/em 7 dias/)
    expect(alertaDoTokenMeta({ is_valid: true, expires_at: emDias(1) }, AGORA)).toMatch(/amanhã/)
    expect(alertaDoTokenMeta({ is_valid: true, expires_at: emDias(0) }, AGORA)).toMatch(/hoje/)
  })
})

describe('alertaDeErro', () => {
  it('tira a consulta do caminho e limita o tamanho', () => {
    const t = alertaDeErro('falhou\n  feio', '/r/abc?token=segredo', 'render', '123')
    expect(t).toBe('Erro na plataforma ao abrir a página /r/abc: falhou feio (código 123)')
    expect(alertaDeErro('x'.repeat(500), '/a', 'route').length).toBe(300)
  })
})
