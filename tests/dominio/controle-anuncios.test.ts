import { describe, expect, it } from 'vitest'
import { centavos, configDoModo, modoDoDestino, montarCriativo, montarPublico, estruturaParaIA, operacoesPesquisaGoogle, podeGerirAnuncios, problemaPesquisaGoogle, type ItemArvore } from '@/dominio/controle-anuncios'

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
    expect(r.campanhas[0]).toEqual({ id: 'ativa', nome: 'ativa', status: 'ACTIVE', gasto: 10, conjuntos: [{ id: 'c1', nome: 'c1', status: 'ACTIVE', orcamentoDiario: 25, gasto: 10, anuncios: 2 }] })
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
