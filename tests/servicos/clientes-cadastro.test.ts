import { describe, expect, it } from 'vitest'
import type { Supabase } from '@/infra/supabase/servidor'
import { atualizarCadastro, conexoesDoCliente, type Cliente } from '@/servicos/clientes-plataforma'

const cliente = (extra: Partial<Cliente> = {}): Cliente => ({ id: 'c', nome: 'Aurum', cor: '#000', razaoSocial: null, documento: null, email: null, telefone: null, status: 'ativo', interno: false, posicaoGaleria: null, metaPaginaId: '288286987700968', metaContaId: '123456789', whatsapp: null, googleAdsId: null, googlePerfil: null, googlePerfilNome: null, googlePlaceId: null, ...extra })

describe('P2-1: cadastro do cliente pelo MCP', () => {
  it('mostra o que está ligado e o que falta', () => {
    const r = conexoesDoCliente(cliente())
    expect(r.ligado).toEqual({ whatsapp: false, paginaFacebook: true, contaAnunciosMeta: true, googleAds: false, meuNegocio: false })
    expect(r.falta.join(' ')).toMatch(/WhatsApp/)
  })

  it('valida antes de gravar: WhatsApp, act_ e nome vazio', async () => {
    const sb = {} as Supabase
    await expect(atualizarCadastro(sb, 'c', { whatsapp: '123' })).rejects.toThrow(/WhatsApp inválido/)
    await expect(atualizarCadastro(sb, 'c', { contaMeta: 'minha conta' })).rejects.toThrow(/act_/)
    await expect(atualizarCadastro(sb, 'c', { nome: '  ' })).rejects.toThrow(/nome/)
    await expect(atualizarCadastro(sb, 'c', {})).rejects.toThrow(/Nada para alterar/)
  })
})
