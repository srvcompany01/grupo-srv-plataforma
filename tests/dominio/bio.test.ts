import { describe, expect, it } from 'vitest'
import { analisarBio, caminhoInternoDaBio, ehRobo, hostEhDaBio, lerLinkBio, montarResumoBio, origemDaBio, urlDaBio } from '@/dominio/bio'

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

describe('relatório da bio', () => {
  const resumo = montarResumoBio({
    visitas: [{ day: '2026-10-20', origem: 'bio', clicks: 40 }, { day: '2026-10-21', origem: 'bio', clicks: 30 }, { day: '2026-10-21', origem: 'story', clicks: 30 }],
    botoes: [
      { botao: 'whatsapp', rotulo: 'WhatsApp', day: '2026-10-20', clicks: 30 },
      { botao: 'whatsapp', rotulo: 'WhatsApp', day: '2026-10-21', clicks: 20 },
      { botao: 'maps', rotulo: 'Localização', day: '2026-10-21', clicks: 10 },
      { botao: 'velho', rotulo: 'Catálogo antigo', day: '2026-10-21', clicks: 4 },
    ],
    links: [{ id: 'maps', rotulo: 'Localização' }, { id: 'site', rotulo: 'Nosso site' }],
    temWhatsapp: true,
  })

  it('soma visitas e toques por botão, inclusive botão sem toque e botão removido', () => {
    expect(resumo).toMatchObject({ visitas: 100, toques: 64 })
    expect(resumo.botoes.map((b) => [b.rotulo, b.toques, b.ativo])).toEqual([['WhatsApp', 50, true], ['Localização', 10, true], ['Catálogo antigo', 4, false], ['Nosso site', 0, true]])
    expect(resumo.porOrigem).toEqual([{ origem: 'bio', visitas: 70 }, { origem: 'story', visitas: 30 }])
    expect(resumo.porDia).toEqual([{ dia: '2026-10-20', visitas: 40, toques: 30 }, { dia: '2026-10-21', visitas: 60, toques: 34 }])
  })

  it('insights: botão líder com a fatia dos toques, botão parado, origem e pico', () => {
    const a = analisarBio(resumo)
    expect(a.destaques.map((d) => d.texto).join(' ')).toMatch(/O botão WhatsApp concentra 78,1% dos toques \(50 de 64\)/)
    expect(a.destaques.map((d) => d.texto).join(' ')).toMatch(/70% das visitas vêm de link da bio/)
    expect(a.recomendacoes.map((d) => d.texto).join(' ')).toMatch(/Sem nenhum toque no período: Nosso site/)
    expect(a.recomendacoes.map((d) => d.tom)).not.toContain('ruim')
  })

  it('sem visita e sem toque: avisa e recomenda', () => {
    expect(analisarBio(montarResumoBio({ visitas: [], botoes: [], links: [], temWhatsapp: true })).destaques[0].texto).toMatch(/Ninguém abriu/)
    const sem = analisarBio(montarResumoBio({ visitas: [{ day: '2026-10-20', origem: 'bio', clicks: 30 }], botoes: [], links: [], temWhatsapp: true }))
    expect(sem.destaques.map((d) => d.texto).join(' ')).toMatch(/ninguém toca em nenhum botão/)
    expect(sem.recomendacoes[0].tom).toBe('ruim')
  })
})
