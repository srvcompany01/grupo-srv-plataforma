import { describe, expect, it } from 'vitest'
import { classificarComentario, textoDoAlerta } from '@/dominio/comentarios'

describe('tom dos comentários', () => {
  it('agressivo, negativo, positivo e neutro', () => {
    expect(classificarComentario('Isso é um GOLPE, não comprem').tom).toBe('agressivo')
    expect(classificarComentario('vou te processar, seus ladrões').tom).toBe('agressivo')
    expect(classificarComentario('que merda de atendimento').tom).toBe('agressivo')
    expect(classificarComentario('Atendimento péssimo, ninguém responde no WhatsApp').tom).toBe('negativo')
    expect(classificarComentario('Meu pedido não chegou até hoje').tom).toBe('negativo')
    expect(classificarComentario('Amei!! 😍').tom).toBe('positivo')
    expect(classificarComentario('Qual o valor?').tom).toBe('neutro')
    expect(classificarComentario('Absurdo esse preço').motivo).toMatch(/absurdo/)
  })
  it('texto do aviso', () => {
    expect(textoDoAlerta({ tom: 'agressivo', cliente: 'Ouro Assis', plataforma: 'instagram', origem: 'anuncio', autor: 'joao', texto: 'golpe' })).toBe('🔴 Comentário agressivo · Ouro Assis · Instagram (anúncio) · @joao: "golpe"')
  })
})
