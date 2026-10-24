import { describe, expect, it } from 'vitest'
import { centavos, configDoModo, modoDoDestino, montarCriativo, montarPublico, alertaSemGasto, estruturaParaIA, googleParaIA, operacoesPesquisaGoogle, podeGerirAnuncios, problemaPesquisaGoogle, problemaPublico, type ItemArvore } from '@/dominio/controle-anuncios'

describe('controle de anúncios', () => {
  it('só admin e gestor mexem', () => {
    expect([podeGerirAnuncios('admin'), podeGerirAnuncios('gestor'), podeGerirAnuncios('membro')]).toEqual([true, true, false])
  })

  it('público: Brasil quando não há local; cidade com raio limitado; gênero e interesses', () => {
    expect(montarPublico({}).geo_locations).toEqual({ countries: ['BR'] })
    const p = montarPublico({ locais: [{ chave: '123', tipo: 'cidade', raioKm: 200 }, { chave: '7', tipo: 'estado' }], idadeMin: 25, idadeMax: 20, generos: 'mulheres', interesses: [{ id: '6003', nome: 'Odontologia' }] })
    expect(p.geo_locations).toEqual({ cities: [{ key: '123', radius: 80, distance_unit: 'kilometer' }], regions: [{ key: '7' }] })
    expect([p.age_min, p.age_max, p.genders]).toEqual([25, 25, [2]])
    expect(p.flexible_spec).toEqual([{ interests: [{ id: '6003', name: 'Odontologia' }] }])
    expect(p.targeting_automation).toEqual({ advantage_audience: 0 })
  })

  it('criativo de WhatsApp com imagem e de formulário com vídeo', () => {
    const w = montarCriativo({ modo: 'whatsapp', paginaId: 'p', instagramId: 'ig', midia: { imagemHash: 'h' }, anuncio: { texto: 'Oi' } })
    expect(w).toMatchObject({ page_id: 'p', instagram_user_id: 'ig', link_data: { image_hash: 'h', call_to_action: { type: 'WHATSAPP_MESSAGE' } } })
    expect(() => montarCriativo({ modo: 'formulario', paginaId: 'p', instagramId: null, midia: { imagemHash: 'h' }, anuncio: { texto: 'x' } })).toThrow(/formulário/)
    const f = montarCriativo({ modo: 'formulario', paginaId: 'p', instagramId: null, midia: { videoId: 'v', capa: 'c' }, anuncio: { texto: 'x', titulo: 'T' }, formularioId: 'f' })
    expect(f).toMatchObject({ video_data: { video_id: 'v', image_url: 'c', title: 'T', call_to_action: { type: 'SIGN_UP', value: { lead_gen_form_id: 'f' } } } })
    expect(() => montarCriativo({ modo: 'site', paginaId: 'p', instagramId: null, midia: { imagemHash: 'h' }, anuncio: { texto: 'x' } })).toThrow(/link/)
  })

  it('modo e orçamento', () => {
    expect(configDoModo('formulario').otimizacao).toBe('LEAD_GENERATION')
    expect(modoDoDestino('WHATSAPP', 'OUTCOME_ENGAGEMENT')).toBe('whatsapp')
    expect(modoDoDestino(undefined, 'OUTCOME_LEADS')).toBe('formulario')
    expect(modoDoDestino('MESSENGER', 'OUTCOME_ENGAGEMENT')).toBeNull()
    expect(centavos(49.9)).toBe(4990)
    expect(() => centavos(0)).toThrow()
    expect(() => centavos(60_000)).toThrow()
  })
})

describe('campanha de pesquisa no Google', () => {
  const ok = { nome: 'Clareamento', orcamentoDiario: 40, estrategia: 'cliques' as const, locais: ['geoTargetConstants/1001773'], palavras: [{ texto: 'clareamento dental belém', correspondencia: 'frase' as const }], negativas: ['grátis'], titulos: ['Clareamento em Belém', 'Agende sua avaliação', 'Resultado natural'], descricoes: ['Clínica com 10 anos de experiência.', 'Agende pelo WhatsApp hoje.'], url: 'https://clinica.com.br' }

  it('valida títulos, descrições, palavras e url', () => {
    expect(problemaPesquisaGoogle(ok)).toBeNull()
    expect(problemaPesquisaGoogle({ ...ok, titulos: ['a', 'b'] })).toMatch(/3 a 15/)
    expect(problemaPesquisaGoogle({ ...ok, titulos: [...ok.titulos.slice(0, 2), 'x'.repeat(31)] })).toMatch(/30 caracteres/)
    expect(problemaPesquisaGoogle({ ...ok, descricoes: ['só uma'] })).toMatch(/2 a 4/)
    expect(problemaPesquisaGoogle({ ...ok, url: 'http://site.com' })).toMatch(/https/)
    expect(problemaPesquisaGoogle({ ...ok, locais: ['Belém'] })).toMatch(/Local/)
  })

  it('monta orçamento, campanha pausada, local, idioma, negativa, grupo, palavra e anúncio', () => {
    const ops = operacoesPesquisaGoogle('123', ok)
    expect(ops.map((o) => Object.keys(o)[0])).toEqual(['campaignBudgetOperation', 'campaignOperation', 'campaignCriterionOperation', 'campaignCriterionOperation', 'campaignCriterionOperation', 'adGroupOperation', 'adGroupCriterionOperation', 'adGroupAdOperation'])
    expect(ops[0]).toMatchObject({ campaignBudgetOperation: { create: { amountMicros: '40000000' } } })
    expect(ops[1]).toMatchObject({ campaignOperation: { create: { status: 'PAUSED', targetSpend: {} } } })
    expect(operacoesPesquisaGoogle('123', { ...ok, locais: [] })[2]).toMatchObject({ campaignCriterionOperation: { create: { location: { geoTargetConstant: 'geoTargetConstants/2076' } } } })
  })
})

describe('estrutura enxuta para a IA', () => {
  const o = (id: string, nivel: ItemArvore['nivel'], ligado: boolean, gasto: number, filhos: ItemArvore[] = []): ItemArvore => ({ id, nome: id, nivel, status: ligado ? 'ACTIVE' : 'PAUSED', ligado, diario: nivel === 'conjunto' ? 25 : null, total: null, gasto, leads: 0, filhos })
  const conta = [
    o('ativa', 'campanha', true, 10, [o('c1', 'conjunto', true, 10, [o('a1', 'anuncio', true, 10), o('a2', 'anuncio', false, 0)]), o('c2', 'conjunto', false, 0)]),
    o('parada', 'campanha', true, 0),
    o('velha', 'campanha', false, 0),
  ]

  it('padrão: só ativas, conjuntos ativos e a contagem de anúncios, sem campos nulos', () => {
    const r = estruturaParaIA(conta, { status: 'ativos', comGasto: false }) as unknown as { campanhas: Record<string, unknown>[]; total: number; dica: string }
    expect(r.campanhas.map((c) => c.id)).toEqual(['ativa', 'parada'])
    expect(r.campanhas[0]).toEqual({ id: 'ativa', nome: 'ativa', status: 'ACTIVE', gasto: 10, leads: 0, conjuntos: [{ id: 'c1', nome: 'c1', status: 'ACTIVE', orcamentoDiario: 25, gasto: 10, leads: 0, anuncios: 2 }] })
    expect(r.total).toBe(2)
    expect(r.dica).toMatch(/1 campanha\(s\) ficaram fora do filtro \(pausadas\)/)
    expect(r.dica).toMatch(/arquivadas ou excluídas/)
    expect((estruturaParaIA(conta, { status: 'todos', comGasto: true }) as { campanhas: unknown[] }).campanhas).toHaveLength(1)
  })

  it('campanhaId abre os anúncios', () => {
    expect(estruturaParaIA(conta, { status: 'ativos', comGasto: false, campanhaId: 'ativa' })).toMatchObject({ campanha: { conjuntos: [{ id: 'c1', anuncios: [{ id: 'a1' }] }] } })
    expect(estruturaParaIA(conta, { status: 'ativos', comGasto: false, campanhaId: 'x' })).toHaveProperty('erro')
  })
})

describe('alerta de ligada sem gasto', () => {
  const periodo = { de: '2026-10-16', ate: '2026-10-22' }
  const base = { ligado: true, gasto: 0, criadaEm: '2026-09-01T10:00:00-0300', nivel: 'campanha' as const, diario: null, total: null }

  it('campanha ligada sem gasto no período inteiro', () => {
    expect(alertaSemGasto(base, periodo)).toMatch(/há 7 dias/)
    expect(alertaSemGasto({ ...base, criadaEm: '2026-10-21T10:00:00-0300' }, periodo)).toMatch(/há 2 dias/)
    expect(alertaSemGasto({ ...base, criadaEm: '2026-10-22T10:00:00-0300' }, periodo)).toBeNull() // criada ontem
  })

  it('não alerta pausada, com gasto, anúncio ou conjunto sem orçamento próprio (CBO)', () => {
    expect(alertaSemGasto({ ...base, ligado: false }, periodo)).toBeNull()
    expect(alertaSemGasto({ ...base, gasto: 1 }, periodo)).toBeNull()
    expect(alertaSemGasto({ ...base, nivel: 'anuncio' }, periodo)).toBeNull()
    expect(alertaSemGasto({ ...base, nivel: 'conjunto' }, periodo)).toBeNull()
    expect(alertaSemGasto({ ...base, nivel: 'conjunto', diario: 25 }, periodo)).toMatch(/há 7 dias/)
  })
})

describe('P1-1: conjuntos fecham com a campanha', () => {
  const o = (id: string, nivel: ItemArvore['nivel'], ligado: boolean, gasto: number, filhos: ItemArvore[] = []): ItemArvore => ({ id, nome: id, nivel, status: ligado ? 'ACTIVE' : 'PAUSED', ligado, diario: null, total: null, gasto, leads: 0, filhos })
  // Campanha pausada; o conjunto que gastou continua "ligado" (status próprio ACTIVE, efetivo CAMPAIGN_PAUSED).
  const conta = [o('pausada', 'campanha', false, 187.04, [o('gastou', 'conjunto', true, 187.04), o('parado', 'conjunto', false, 0)])]

  it('status=pausados mostra o conjunto que gastou mesmo ligado; comGasto esconde conjunto sem gasto', () => {
    const r = estruturaParaIA(conta, { status: 'pausados', comGasto: true }) as unknown as { campanhas: { gasto: number; conjuntos: { id: string; gasto: number }[] }[] }
    expect(r.campanhas[0].conjuntos.map((j) => j.id)).toEqual(['gastou'])
    expect(r.campanhas[0].conjuntos.reduce((s, j) => s + j.gasto, 0)).toBeCloseTo(r.campanhas[0].gasto)
  })

  it('explica a diferença quando o gasto da campanha não fecha com os conjuntos listados', () => {
    const arquivado = [o('c', 'campanha', true, 100, [o('j', 'conjunto', true, 60)])]
    const r = estruturaParaIA(arquivado, { status: 'ativos', comGasto: false }) as unknown as { campanhas: Record<string, unknown>[] }
    expect(r.campanhas[0].gastoForaDosConjuntos).toEqual({ valor: 40, motivo: expect.stringMatching(/arquivados ou excluídos/) })
  })
})

describe('P1-2: alerta no Google', () => {
  it('campanha ENABLED com R$ 20/dia e zero de custo no período ganha alerta; pausada não', () => {
    const c = (status: 'ENABLED' | 'PAUSED', custo: number) => ({ id: '24284106360', nome: 'Pesquisa | Concorrentes', status, tipo: 'SEARCH', orcamento: { diario: 20, compartilhado: false }, custo, conversoes: 0, cliques: 0 })
    const periodo = { de: '2026-10-16', ate: '2026-10-22' }
    expect(googleParaIA([c('ENABLED', 0)], { status: 'ativos', comGasto: false, periodo })[0]).toMatchObject({ orcamentoDiario: 20, alerta: expect.stringMatching(/há 7 dias/) })
    expect(googleParaIA([c('ENABLED', 5)], { status: 'ativos', comGasto: false, periodo })[0]).not.toHaveProperty('alerta')
    expect(googleParaIA([c('PAUSED', 0)], { status: 'todos', comGasto: false, periodo })[0]).not.toHaveProperty('alerta')
  })
})

describe('P1-3: formato estável', () => {
  it('leads vem sempre, inclusive 0', () => {
    const c: ItemArvore = { id: 'x', nome: 'x', nivel: 'campanha', status: 'ACTIVE', ligado: true, diario: null, total: null, gasto: 0, leads: 0, filhos: [] }
    const r = estruturaParaIA([c], { status: 'ativos', comGasto: false }) as unknown as { campanhas: Record<string, unknown>[] }
    expect(r.campanhas[0]).toHaveProperty('leads', 0)
  })
})

describe('P2-7: criar_campanha_meta', () => {
  it('recusa idade mínima maior que a máxima (antes era corrigida em silêncio)', () => {
    expect(problemaPublico({ idadeMin: 25, idadeMax: 20 })).toMatch(/maior que a máxima/)
    expect(problemaPublico({ idadeMin: 20, idadeMax: 45 })).toBeNull()
  })

  it('modo perfil_instagram (MARCA): tráfego para o perfil, link e botão do perfil', () => {
    expect(configDoModo('perfil_instagram')).toEqual({ objetivo: 'OUTCOME_TRAFFIC', destino: 'INSTAGRAM_PROFILE', otimizacao: 'VISIT_INSTAGRAM_PROFILE' })
    expect(modoDoDestino('INSTAGRAM_PROFILE', 'OUTCOME_TRAFFIC')).toBe('perfil_instagram')
    const c = montarCriativo({ modo: 'perfil_instagram', paginaId: 'p', instagramId: 'ig', instagramUsuario: 'aurumbelem', midia: { imagemHash: 'h' }, anuncio: { texto: 'Siga' } })
    expect(c).toMatchObject({ instagram_user_id: 'ig', link_data: { link: 'https://www.instagram.com/aurumbelem/', call_to_action: { type: 'VIEW_INSTAGRAM_PROFILE' } } })
    expect(() => montarCriativo({ modo: 'perfil_instagram', paginaId: 'p', instagramId: null, midia: { imagemHash: 'h' }, anuncio: { texto: 'x' } })).toThrow(/Instagram profissional/)
  })
})

describe('P2-8: lances e extensões no Google', () => {
  const ok = { nome: 'Clareamento', orcamentoDiario: 40, estrategia: 'cliques' as const, locais: [], palavras: [{ texto: 'clareamento dental', correspondencia: 'frase' as const }], titulos: ['Clareamento em Belém', 'Agende sua avaliação', 'Resultado natural'], descricoes: ['Clínica com 10 anos de experiência.', 'Agende pelo WhatsApp hoje.'], url: 'https://clinica.com.br' }

  it('teto de CPC em cliques, CPA em conversões e validação cruzada', () => {
    expect(operacoesPesquisaGoogle('1', { ...ok, cpcMaximo: 2.5 })[1]).toMatchObject({ campaignOperation: { create: { targetSpend: { cpcBidCeilingMicros: '2500000' } } } })
    expect(operacoesPesquisaGoogle('1', { ...ok, estrategia: 'conversoes', cpaDesejado: 30 })[1]).toMatchObject({ campaignOperation: { create: { maximizeConversions: { targetCpaMicros: '30000000' } } } })
    expect(problemaPesquisaGoogle({ ...ok, cpaDesejado: 30 })).toMatch(/só para a estratégia conversoes/)
  })

  it('sitelinks e chamada viram recursos ligados à campanha', () => {
    const ops = operacoesPesquisaGoogle('1', { ...ok, sitelinks: [{ texto: 'Agendar', url: 'https://clinica.com.br/agenda' }], telefone: '(91) 99999-0000' })
    const tipos = ops.map((o) => Object.keys(o)[0])
    expect(tipos.filter((t) => t === 'assetOperation')).toHaveLength(2)
    expect(ops).toContainEqual({ campaignAssetOperation: { create: { campaign: 'customers/1/campaigns/-2', asset: 'customers/1/assets/-10', fieldType: 'SITELINK' } } })
    expect(ops).toContainEqual(expect.objectContaining({ assetOperation: { create: { resourceName: 'customers/1/assets/-30', callAsset: { countryCode: 'BR', phoneNumber: '91999990000' } } } }))
    expect(problemaPesquisaGoogle({ ...ok, sitelinks: [{ texto: 'x'.repeat(26), url: 'https://a.com' }] })).toMatch(/Sitelink inválido/)
    expect(problemaPesquisaGoogle({ ...ok, telefone: '123' })).toMatch(/Telefone/)
  })
})
