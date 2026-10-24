import { describe, expect, it } from 'vitest'
import { escopoPedido, pkceConfere, retornoValido } from '@/dominio/oauth'

describe('oauth do MCP', () => {
  it('aceita https e localhost, recusa o resto', () => {
    expect(retornoValido('https://claude.ai/api/mcp/auth_callback')).toBe(true)
    expect(retornoValido('http://localhost:6274/callback')).toBe(true)
    expect(retornoValido('http://exemplo.com/cb')).toBe(false)
    expect(retornoValido('javascript:alert(1)')).toBe(false)
    expect(retornoValido('https://x.com/cb#frag')).toBe(false)
  })

  it('PKCE S256 (exemplo da RFC 7636)', async () => {
    expect(await pkceConfere('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk', 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM')).toBe(true)
    expect(await pkceConfere('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXX', 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM')).toBe(false)
  })

  it('escopo', () => {
    expect([escopoPedido(null), escopoPedido('mcp'), escopoPedido('read'), escopoPedido('read write')]).toEqual(['write', 'write', 'read', 'write'])
  })
})
