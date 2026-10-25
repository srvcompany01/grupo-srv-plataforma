import { describe, expect, it } from 'vitest'
import { campanhaGoogleRelatorio, campanhaMetaRelatorio, leadsDoRelatorio, linkWhatsapp, textoWhatsapp, type RelatorioCompartilhado } from '@/dominio/relatorio-compartilhado'

const base: RelatorioCompartilhado = {
  cliente: 'Aurum Belém', de: '2026-10-01', ate: '2026-10-31', geradoEm: '2026-11-01T12:00:00Z',
  anuncios: { investido: 7209.12, conversas: 276, formularios: 10, conversoesGoogle: 4.6, cliques: 3000, impressoes: 90000, custoPorLead: 24.8 },
  instagram: { usuario: 'aurumbelem', seguidores: 5200, novosSeguidores: 180, alcance: 143547, alcancePosts: 1012, visualizacoes: 90000, interacoes: 1200, posts: 12, engajamentoPosts: 3.1, melhorPost: null },
  gmn: { nota: 4.9, avaliacoes: 391, saude: 88, geogrid: null },
  destaques: [],
}

describe('relatório para o cliente', () => {
  it('texto do WhatsApp com anúncios, Instagram, Google e o link', () => {
    const t = textoWhatsapp(base, 'https://app.gruposrv.com.br/r/abc')
    expect(t).toMatch(/Aurum Belém de 01\/10 a 31\/10/)
    expect(t).toMatch(/Investimento: R\$\s?7\.209,12/)
    expect(t).toMatch(/Leads: 291 \(276 conversas/)
    expect(t).toMatch(/\+180 seguidores/)
    expect(t).toMatch(/★ 4,9 com 391 avaliações/)
    expect(t.endsWith('Relatório completo: https://app.gruposrv.com.br/r/abc')).toBe(true)
  })

  it('sem investimento quando a agência esconde; sem seções sem dado', () => {
    const t = textoWhatsapp({ ...base, anuncios: { ...base.anuncios!, investido: null }, instagram: null, gmn: null }, 'u')
    expect(t).not.toMatch(/Investimento|Custo por lead|Instagram|Google/)
    expect(leadsDoRelatorio(base.anuncios!)).toBe(291)
  })

  it('link do WhatsApp com o número do cliente ou sem número', () => {
    expect(linkWhatsapp('Oi 😊', '5591999999999')).toBe('https://wa.me/5591999999999?text=Oi%20%F0%9F%98%8A')
    expect(linkWhatsapp('Oi', null)).toBe('https://wa.me/?text=Oi')
  })

  it('R0-2: o texto usa o alcance dos posts e rotula o total da conta com anúncios', () => {
    const t = textoWhatsapp(base, 'u')
    expect(t).toMatch(/12 posts, que alcançaram 1\.012 pessoas \(alcance da conta com anúncios: 143\.547\)/)
    expect(leadsDoRelatorio({ ...base.anuncios!, leadsSite: 5 })).toBe(296)
  })
})

describe('R1-1: campanhas no relatório', () => {
  it('lead mostra leads e custo por lead; marca mostra cliques no link, sem CPL; sem investimento não mostra custo', () => {
    const whats = campanhaMetaRelatorio({ nome: 'CBO / ENGJ - WHATS', status: 'ACTIVE', objetivo: 'OUTCOME_ENGAGEMENT', gasto: 400, cliquesLink: 300, leads: { formularios: 0, conversas: 20, site: 0 } }, true)
    expect(whats).toMatchObject({ papel: 'lead', resultado: 20, rotuloResultado: 'conversas', custoPorResultado: 20, ativa: true })
    const marca = campanhaMetaRelatorio({ nome: 'CONTEÚDO / TRAF-INSTA', status: 'PAUSED', objetivo: 'OUTCOME_TRAFFIC', gasto: 100, cliquesLink: 500, leads: { formularios: 0, conversas: 0, site: 0 } }, true)
    expect(marca).toMatchObject({ papel: 'marca', resultado: 500, rotuloResultado: 'cliques no link', custoPorResultado: 0.2, ativa: false })
    expect(campanhaMetaRelatorio({ nome: 'x', status: 'ACTIVE', objetivo: 'OUTCOME_LEADS', gasto: 100, cliquesLink: 1, leads: { formularios: 4, conversas: 0, site: 0 } }, false)).toMatchObject({ gasto: null, custoPorResultado: null, rotuloResultado: 'leads' })
    expect(campanhaGoogleRelatorio({ nome: 'Pesquisa | Concorrentes', status: 'ENABLED', custo: 0, conversoes: 0 }, true)).toMatchObject({ resultado: 0, custoPorResultado: null })
  })
})

describe('R1-3: geogrid no texto do relatório', () => {
  it('diz quem lidera em vez de só o top 3', () => {
    const geo = { palavra: 'compro ouro', metricas: { posicaoMedia: 2, posicaoMediaTotal: 2, top3: 98.8, top10: 100, encontrado: 100, pontos: 81 }, centro: { lat: 0, lng: 0 }, pontos: [], em: '', primeiro: 1.2, lider: { nome: 'Compra Ouro Pará', pct: 100 } }
    const t = textoWhatsapp({ ...base, gmn: { nota: 4.9, avaliacoes: 613, saude: 80, geogrid: geo } }, 'u')
    expect(t).toMatch(/1º lugar em 1,2%.*Compra Ouro Pará \(100% dos pontos\)/)
  })
})
