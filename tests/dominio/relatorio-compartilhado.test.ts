import { describe, expect, it } from 'vitest'
import { leadsDoRelatorio, linkWhatsapp, textoWhatsapp, type RelatorioCompartilhado } from '@/dominio/relatorio-compartilhado'

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
