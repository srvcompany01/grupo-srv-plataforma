import { describe, expect, it } from 'vitest'
import { gastoDeMarca } from '@/dominio/anuncios-meta'
import { mesDoRelatorio, anunciosGoogle, anunciosMeta, anunciosMetaSeparados, avisosInternos, campanhaGoogleRelatorio, campanhaMetaRelatorio, leadsDoRelatorio, linkWhatsapp, referenciaRelatorio, relatorioDeveSerSubstituido, textoWhatsapp, type RelatorioCompartilhado } from '@/dominio/relatorio-compartilhado'

const base: RelatorioCompartilhado = {
  cliente: 'Aurum Belém', de: '2026-10-01', ate: '2026-10-31', geradoEm: '2026-11-01T12:00:00Z',
  anuncios: { investido: 7209.12, conversas: 276, formularios: 10, conversoesGoogle: 4.6, cliques: 3000, impressoes: 90000, custoPorLead: 24.8 },
  instagram: { usuario: 'aurumbelem', seguidores: 5200, novosSeguidores: 180, alcance: 143547, alcancePosts: 1012, visualizacoes: 90000, interacoes: 1200, posts: 12, engajamentoPosts: 3.1, melhorPost: null },
  gmn: { nota: 4.9, avaliacoes: 391, saude: 88, geogrid: null },
  destaques: [],
}

describe('relatório para o cliente', () => {
  it('C5/C6: bloqueia versão antiga ou revogada e aceita id/URL para revogação', () => {
    expect(relatorioDeveSerSubstituido(undefined)).toBe(true)
    expect(relatorioDeveSerSubstituido(3)).toBe(true)
    expect(relatorioDeveSerSubstituido(4)).toBe(false)
    expect(relatorioDeveSerSubstituido(4, true)).toBe(true)
    expect(referenciaRelatorio('https://app.gruposrv.com.br/r/PX7wAYZ3YpA28oN2v0yHoIc8iWh75V8e')).toEqual({ token: 'PX7wAYZ3YpA28oN2v0yHoIc8iWh75V8e' })
    expect(referenciaRelatorio('39f033be-10fa-4315-aeb6-6db5025ffbb5')).toEqual({ id: '39f033be-10fa-4315-aeb6-6db5025ffbb5' })
  })

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
    expect(t).toMatch(/12 posts orgânicos, com 1\.012 de alcance e 1\.200 interações/)
    expect(t).not.toMatch(/143\.547|com anúncios/)
    expect(leadsDoRelatorio({ ...base.anuncios!, leadsSite: 5 })).toBe(296)
  })
})

it('orgânico: os cliques no link da bio entram no texto do WhatsApp', () => {
  const t = textoWhatsapp({ ...base, instagram: { ...base.instagram!, cliquesLinkBio: 87 } }, 'u')
  expect(t).toMatch(/87 cliques no link da bio/)
  expect(textoWhatsapp({ ...base, instagram: { ...base.instagram!, cliquesLinkBio: 0 } }, 'u')).not.toMatch(/link da bio/)
})

it('seguidores: o total ganho vem primeiro e embaixo anúncios, orgânicos e quem saiu', () => {
  const t = textoWhatsapp({ ...base, instagram: { ...base.instagram!, seguidoresGanhos: 400, seguidoresPerdidos: 60, seguidoresPagos: 171, seguidoresOrganicos: 229 } }, 'u')
  expect(t).toMatch(/400 seguidores ganhos no período \(total 5\.200\)\n  - 171 pelos anúncios · 229 orgânicos · 60 deixaram de seguir/)
  const semAnuncios = textoWhatsapp({ ...base, instagram: { ...base.instagram!, seguidoresGanhos: 400, seguidoresPerdidos: 60, seguidoresPagos: null, seguidoresOrganicos: null } }, 'u')
  expect(semAnuncios).toMatch(/400 seguidores ganhos[^\n]*\n  - 60 deixaram de seguir/)
})

describe('resultado do mês no relatório (o mesmo da aba Performance)', () => {
  const m = { mes: '2026-10', investidoMeta: 7970.68, investidoGoogle: 3479.29, formularios: 0, conversas: 491, leadsSite: 0, conversoesGoogle: 68, leadsOrganicos: 50, cliquesLinkBio: 200, cliquesPerfilInstagram: null, faturamento: 80000, vendas: 20 }

  it('investimento, leads por origem, faturamento, ROAS, custo por venda, ticket e conversão', () => {
    const r = mesDoRelatorio(m, true)
    expect(r).toMatchObject({ investido: 11449.97, investidoMeta: 7970.68, investidoGoogle: 3479.29, leadsPagos: 559, leadsOrganicos: 50, leads: 609, faturamento: 80000, vendas: 20 })
    expect(r.cpl).toBeCloseTo(20.48, 2)
    expect(r.roas).toBeCloseTo(6.99, 2)
    expect(r.custoPorVenda).toBeCloseTo(572.5, 1)
    expect(r.ticketMedio).toBe(4000)
    expect(r.conversao).toBeCloseTo(3.28, 2)
  })

  it('sem mostrar o investimento, nada que dependa dele aparece (CPL, ROAS, custo por venda); faturamento e vendas continuam', () => {
    const r = mesDoRelatorio(m, false)
    expect(r).toMatchObject({ investido: null, investidoMeta: null, investidoGoogle: null, cpl: null, roas: null, custoPorVenda: null, faturamento: 80000, vendas: 20, ticketMedio: 4000 })
  })

  it('vendas e faturamento são opcionais: sem eles saem null, sem quebrar', () => {
    const r = mesDoRelatorio({ ...m, faturamento: null, vendas: null }, true)
    expect(r).toMatchObject({ faturamento: null, vendas: null, roas: null, custoPorVenda: null, ticketMedio: null, conversao: null })
    expect(r.cpl).not.toBeNull()
  })

  it('o texto do WhatsApp traz o bloco do mês', () => {
    const atual = mesDoRelatorio(m, true)
    const t = textoWhatsapp({ ...base, resultados: { mes: '2026-10', emAndamento: true, atual, meses: [atual] } }, 'u')
    expect(t).toMatch(/\*Resultado de outubro de 2026 \(até hoje\)\*/)
    expect(t).toMatch(/Investido: R\$\s?11\.449,97 \(Meta R\$\s?7\.970,68 · Google R\$\s?3\.479,29\)/)
    expect(t).toMatch(/Leads: 609 \(559 pagos \+ 50 orgânicos\) · custo por lead R\$\s?20,48/)
    expect(t).toMatch(/Faturamento: R\$\s?80\.000,00 · ROAS 7x/)
    expect(t).toMatch(/20 vendas · custo por venda R\$\s?572,50 · ticket médio R\$\s?4\.000,00/)
  })
})

describe('anúncios separados por plataforma', () => {
  it('Meta e Google com investido, leads e custo por lead próprios, sem somar', () => {
    const meta = anunciosMeta({ gasto: 4047.52, cliques: 2000, impressoes: 80000, conversas: 182, formularios: 0, site: 3 }, 0, true)
    const google = anunciosGoogle({ custo: 1200, conversoes: 4.6, cliques: 900, impressoes: 10000 }, true)
    expect(meta).toMatchObject({ investido: 4047.52, leads: 185, custoPorLead: 21.88 })
    expect(google).toMatchObject({ investido: 1200, leads: 4.6, custoPorLead: 260.87 })
    expect(anunciosMeta({ gasto: 10, cliques: 0, impressoes: 0, conversas: 1, formularios: 0, site: 0 }, 0, false)).toMatchObject({ investido: null, custoPorLead: null })
    const t = textoWhatsapp({ ...base, anuncios: { ...base.anuncios!, meta, google } }, 'u')
    expect(t).toMatch(/\*Meta Ads \(Instagram e Facebook\)\*\n• Investimento: R\$\s?4\.047,52\n• Leads: 185 \(182 conversas no WhatsApp\/Direct\)\n• Custo por lead: R\$\s?21,88/)
    expect(t).toMatch(/\*Google Ads\*\n• Investimento: R\$\s?1\.200,00\n• Leads: 4,6 \(conversões\)\n• Custo por lead: R\$\s?260,87/)
    expect(t).not.toMatch(/\*Anúncios\*/)
  })

  it('C3: custo por lead de captação (sem o gasto das campanhas de marca) e o geral, rotulados', () => {
    const camps = [
      { objetivo: 'OUTCOME_ENGAGEMENT', gasto: 1933, leads: { formularios: 0, conversas: 181, site: 0 } },
      { objetivo: 'OUTCOME_TRAFFIC', gasto: 700, leads: { formularios: 0, conversas: 1, site: 0 } },
    ]
    expect(gastoDeMarca(camps)).toBe(700)
    const meta = anunciosMeta({ gasto: 2633, cliques: 0, impressoes: 0, conversas: 182, formularios: 0, site: 0 }, gastoDeMarca(camps), true)
    expect(meta).toMatchObject({ investido: 2633, investidoCaptacao: 1933, custoPorLead: 10.62, custoPorLeadGeral: 14.47 })
    expect(textoWhatsapp({ ...base, anuncios: { ...base.anuncios!, meta, google: null } }, 'u')).toMatch(/Custo por lead \(campanhas de captação\): R\$\s?10,62 · considerando todo o investimento: R\$\s?14,47/)
    expect(anunciosMeta({ gasto: 100, cliques: 0, impressoes: 0, conversas: 10, formularios: 0, site: 0 }, 0, true).custoPorLeadGeral).toBeNull()
  })

  it('C6: relatório novo mostra captação e reconhecimento separadamente', () => {
    const meta = anunciosMetaSeparados({
      total: { gasto: 2200, cliques: 500, impressoes: 30000, seguidoresAnuncio: 230 },
      captacao: { gasto: 1500, leads: 150, conversas: 120, formularios: 10, site: 20, seguidoresAnuncio: 8, custoPorLead: 10, campanhas: 2 },
      reconhecimento: { gasto: 700, cliquesLink: 2301, visitasPerfil: 1800, custoPorVisitaPerfil: 700 / 1800, seguidoresAnuncio: 222, custoPorSeguidor: 700 / 222, custoPorClique: 700 / 2301, campanhas: 1 },
    }, true)
    expect(meta).toMatchObject({ investido: 2200, custoPorLead: 10, captacao: { investido: 1500, leads: 150, leadsSite: 20 }, reconhecimento: { investido: 700, visitasPerfil: 1800, custoPorVisitaPerfil: 0.39 } })
    const t = textoWhatsapp({ ...base, anuncios: { ...base.anuncios!, meta, google: null } }, 'u')
    expect(t).toMatch(/Captação: R\$\s?1\.500,00 · 150 leads.*CPL R\$\s?10,00/)
    expect(t).toMatch(/Reconhecimento\/tráfego: R\$\s?700,00 · 1\.800 visitas ao perfil · custo por visita R\$\s?0,39/)
    expect(t).toMatch(/230 novos seguidores pelos anúncios · custo por seguidor nas campanhas de perfil R\$\s?3,15/)
  })
})

describe('R1-1: campanhas no relatório', () => {
  it('lead mostra leads e custo por lead; marca mostra cliques no link, sem CPL; sem investimento não mostra custo', () => {
    const whats = campanhaMetaRelatorio({ nome: 'CBO / ENGJ - WHATS', status: 'ACTIVE', objetivo: 'OUTCOME_ENGAGEMENT', gasto: 400, cliquesLink: 300, leads: { formularios: 0, conversas: 20, site: 0 } }, true)
    expect(whats).toMatchObject({ papel: 'lead', resultado: 20, rotuloResultado: 'conversas', custoPorResultado: 20, ativa: true })
    const marca = campanhaMetaRelatorio({ nome: 'CONTEÚDO / TRAF-INSTA', status: 'PAUSED', objetivo: 'OUTCOME_TRAFFIC', gasto: 100, cliquesLink: 500, leads: { formularios: 0, conversas: 0, site: 0 } }, true)
    expect(marca).toMatchObject({ papel: 'marca', resultado: 500, rotuloResultado: 'cliques no link', custoPorResultado: 0.2, ativa: false })
    expect(campanhaMetaRelatorio({ nome: 'x', status: 'ACTIVE', objetivo: 'OUTCOME_LEADS', gasto: 100, cliquesLink: 1, leads: { formularios: 4, conversas: 0, site: 0 } }, false)).toMatchObject({ gasto: null, custoPorResultado: null, rotuloResultado: 'formulários' })
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

describe('R1-2, R1-4 e R1-5: avisos internos', () => {
  it('cadastro, Meu Negócio e operação; nada quando está tudo certo', () => {
    const a = avisosInternos({ whatsapp: null, meuNegocioLigado: false, erroMeuNegocio: null, ativasSemEntrega: ['Pesquisa | Concorrentes'], pausadasComGasto: ['CAMAS [PP]', 'CBO-TESTE / ICARUS'], avisosGoogle: ['Conversões sem valor configurado'] })
    expect(a).toHaveLength(5)
    expect(a[0]).toMatch(/sem WhatsApp no cadastro.*sem destinatário/)
    expect(a[1]).toMatch(/Meu Negócio indisponíveis.*não ligado/)
    expect(a[2]).toMatch(/Pesquisa \| Concorrentes/)
    expect(a[3]).toMatch(/CAMAS \[PP\]; CBO-TESTE/)
    expect(avisosInternos({ whatsapp: '5591', meuNegocioLigado: true, erroMeuNegocio: null, ativasSemEntrega: [], pausadasComGasto: [], avisosGoogle: [] })).toEqual([])
  })
})
