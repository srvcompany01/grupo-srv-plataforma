import { describe, expect, it } from 'vitest'
import { analisarBio, analisarQuiz, caminhoInternoDaBio, ehRobo, hostEhDaBio, lerLinkBio, montarResumoBio, origemDaBio, urlDaBio } from '@/dominio/bio'

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
    visualizacoes: [{ day: '2026-10-20', origem: 'bio', views: 36, visitantes: 30 }, { day: '2026-10-21', origem: 'bio', views: 24, visitantes: 20 }, { day: '2026-10-21', origem: 'story', views: 25, visitantes: 20 }],
    botoes: [
      { botao: 'whatsapp', rotulo: 'WhatsApp', day: '2026-10-20', clicks: 30 },
      { botao: 'whatsapp', rotulo: 'WhatsApp', day: '2026-10-21', clicks: 20 },
      { botao: 'maps', rotulo: 'Localização', day: '2026-10-21', clicks: 10 },
      { botao: 'velho', rotulo: 'Catálogo antigo', day: '2026-10-21', clicks: 4 },
    ],
    links: [{ id: 'maps', rotulo: 'Localização' }, { id: 'site', rotulo: 'Nosso site' }],
    leads: [{ day: '2026-10-20', origem: 'bio', respostas: [{ p: 'Como podemos ajudar?', o: 'Orçamento' }] }, { day: '2026-10-21', origem: 'story', respostas: [{ p: 'Como podemos ajudar?', o: 'Orçamento' }] }],
    temWhatsapp: true,
  })

  it('separa cliques (quem tocou no link) de visualizações (a página abriu) e conta pessoas distintas', () => {
    expect(resumo).toMatchObject({ cliques: 100, visualizacoes: 85, pessoas: 70, toques: 64 })
    expect(resumo.porOrigem).toEqual([{ origem: 'bio', cliques: 70, visualizacoes: 60 }, { origem: 'story', cliques: 30, visualizacoes: 25 }])
    expect(resumo.porDia).toEqual([{ dia: '2026-10-20', cliques: 40, visualizacoes: 36, toques: 30, leads: 1 }, { dia: '2026-10-21', cliques: 60, visualizacoes: 49, toques: 34, leads: 1 }])
  })

  it('lead orgânico = quiz concluído (não o toque no botão); respostas contadas por pergunta', () => {
    expect(resumo.leadsOrganicos).toBe(2)
    expect(resumo.quiz).toMatchObject({ iniciaram: 50, concluiram: 2 })
    expect(resumo.quiz.respostas).toEqual([{ pergunta: 'Como podemos ajudar?', total: 2, opcoes: [{ opcao: 'Orçamento', n: 2 }] }])
    expect(montarResumoBio({ visitas: [], botoes: [{ botao: 'whatsapp', rotulo: 'WhatsApp', day: '2026-10-20', clicks: 9 }], links: [], temWhatsapp: true }).leadsOrganicos).toBe(0)
  })

  it('botões: todos aparecem, inclusive sem toque e já removidos', () => {
    expect(resumo.botoes.map((b) => [b.rotulo, b.toques, b.ativo])).toEqual([['WhatsApp', 50, true], ['Localização', 10, true], ['Catálogo antigo', 4, false], ['Nosso site', 0, true]])
  })

  it('insights: quem clica e desiste, botão líder, leads orgânicos, botão parado e origem', () => {
    const a = analisarBio(resumo)
    const dest = a.destaques.map((d) => d.texto).join(' ')
    expect(dest).toMatch(/100 cliques no link da bio, 85 visualizações da página \(70 pessoas distintas por dia\) e 64 toques/)
    expect(dest).toMatch(/85% dos cliques abriram a página/)
    expect(dest).toMatch(/2 leads orgânicos: pessoas que responderam ao quiz/)
    expect(a.recomendacoes.map((d) => d.texto).join(' ')).toMatch(/Só 4% de quem tocou no WhatsApp terminou o quiz/)
    expect(dest).toMatch(/O botão WhatsApp concentra 78,1% dos toques \(50 de 64\)/)
    expect(dest).toMatch(/70% dos cliques vêm de link da bio/)
    expect(a.recomendacoes.map((d) => d.texto).join(' ')).toMatch(/Sem nenhum toque no período: Nosso site/)
  })

  it('insights do quiz: conclusão, resposta mais comum e quiz sem uso', () => {
    const a = analisarQuiz(resumo)
    expect(a.destaques.map((d) => d.texto).join(' ')).toMatch(/2 leads orgânicos de 50 pessoas que abriram o quiz/)
    expect(a.destaques.map((d) => d.texto).join(' ')).toMatch(/"Como podemos ajudar\?": a resposta mais comum é "Orçamento" \(100%\)/)
    expect(a.recomendacoes[0].tom).toBe('ruim')
    expect(analisarQuiz(montarResumoBio({ visitas: [], botoes: [], links: [], temWhatsapp: true })).destaques[0].texto).toMatch(/Ninguém abriu o quiz/)
  })

  it('muita gente clica e a página não abre: recomenda ver a velocidade e o endereço', () => {
    const r = montarResumoBio({ visitas: [{ day: '2026-10-20', origem: 'bio', clicks: 100 }], visualizacoes: [{ day: '2026-10-20', origem: 'bio', views: 40, visitantes: 35 }], botoes: [], links: [], temWhatsapp: true })
    const rec = analisarBio(r).recomendacoes
    expect(rec[0]).toMatchObject({ tom: 'ruim' })
    expect(rec[0].texto).toMatch(/Só 40% dos cliques chegaram a abrir/)
  })

  it('sem clique e sem toque: avisa e recomenda', () => {
    expect(analisarBio(montarResumoBio({ visitas: [], botoes: [], links: [], temWhatsapp: true })).destaques[0].texto).toMatch(/Ninguém clicou/)
    const sem = analisarBio(montarResumoBio({ visitas: [{ day: '2026-10-20', origem: 'bio', clicks: 30 }], visualizacoes: [{ day: '2026-10-20', origem: 'bio', views: 30, visitantes: 25 }], botoes: [], links: [], temWhatsapp: true }))
    expect(sem.destaques.map((d) => d.texto).join(' ')).toMatch(/ninguém toca em nenhum botão/)
    expect(sem.recomendacoes[0].tom).toBe('ruim')
  })

  it('o caminho /<cliente>/v e /<cliente>/quiz chegam nas rotas internas', () => {
    expect(caminhoInternoDaBio('/aurum-belem/v')).toBe('/l/aurum-belem/v')
    expect(caminhoInternoDaBio('/aurum-belem/quiz')).toBe('/l/aurum-belem/quiz')
  })
})
