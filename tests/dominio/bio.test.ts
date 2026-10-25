import { describe, expect, it } from 'vitest'
import { caminhoInternoDaBio, ehRobo, hostEhDaBio, lerLinkBio, origemDaBio, urlDaBio } from '@/dominio/bio'

describe('página da bio', () => {
  it('robôs e pré-visualizações não contam; navegador de celular conta', () => {
    expect(ehRobo('facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)')).toBe(true)
    expect(ehRobo('WhatsApp/2.23.20 A')).toBe(true)
    expect(ehRobo('Mozilla/5.0 (compatible; Googlebot/2.1)')).toBe(true)
    expect(ehRobo(null)).toBe(true)
    expect(ehRobo('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Instagram 300.0')).toBe(false)
  })

  it('endereço: domínio dedicado sem prefixo e sem a marca; sem ele, /l/; origem vira ?o=', () => {
    expect(urlDaBio('aurum-belem', null, 'links.exemplo.com')).toBe('https://links.exemplo.com/aurum-belem')
    expect(urlDaBio('aurum-belem', 'story', 'links.exemplo.com')).toBe('https://links.exemplo.com/aurum-belem?o=story')
    expect(urlDaBio('aurum-belem', 'bio', undefined)).toBe('https://www.gruposrv.com.br/l/aurum-belem')
    expect(origemDaBio('Story!')).toBe('bio')
    expect(origemDaBio('anuncio')).toBe('anuncio')
  })

  it('no domínio da bio só /<cliente> e /<cliente>/ir/<botao> existem', () => {
    expect(caminhoInternoDaBio('/aurum-belem')).toBe('/l/aurum-belem')
    expect(caminhoInternoDaBio('/aurum-belem/ir/whatsapp')).toBe('/l/aurum-belem/ir/whatsapp')
    expect(caminhoInternoDaBio('/')).toBeNull()
    expect(caminhoInternoDaBio('/login')).toBe('/l/login')
    expect(caminhoInternoDaBio('/a/b/c')).toBeNull()
    expect(hostEhDaBio('Links.Exemplo.com:443', 'links.exemplo.com')).toBe(true)
    expect(hostEhDaBio('app.gruposrv.com.br', 'links.exemplo.com')).toBe(false)
    expect(hostEhDaBio('links.exemplo.com', undefined)).toBe(false)
  })

  it('botão extra: completa https, recusa endereço inválido e nome vazio', () => {
    expect(lerLinkBio(' Nosso site ', 'www.aurum.com.br')).toEqual({ rotulo: 'Nosso site', url: 'https://www.aurum.com.br/' })
    expect(lerLinkBio('Maps', 'https://maps.app.goo.gl/abc')).toMatchObject({ url: 'https://maps.app.goo.gl/abc' })
    expect(lerLinkBio('X', 'javascript:alert(1)')).toHaveProperty('erro')
    expect(lerLinkBio('X', 'semponto')).toHaveProperty('erro')
    expect(lerLinkBio('  ', 'https://a.com')).toHaveProperty('erro')
  })
})
