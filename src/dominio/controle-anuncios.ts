/**
 * Regras do controle de anúncios: quem pode mexer, e como a plataforma monta campanha, conjunto (público) e criativo
 * na Meta a partir do pedido da IA. Tudo nasce PAUSADO; ativar e mudar orçamento pela IA viram proposta.
 */

export const podeGerirAnuncios = (papel: string) => papel === 'admin' || papel === 'gestor'

/** Destino do anúncio: conversa no WhatsApp, no Direct, formulário de cadastro (Meta) ou site. */
export const MODOS = ['whatsapp', 'direct', 'formulario', 'site'] as const
export type Modo = (typeof MODOS)[number]

export function configDoModo(modo: Modo) {
  switch (modo) {
    case 'whatsapp':
      return { objetivo: 'OUTCOME_ENGAGEMENT', destino: 'WHATSAPP', otimizacao: 'CONVERSATIONS' }
    case 'direct':
      return { objetivo: 'OUTCOME_ENGAGEMENT', destino: 'INSTAGRAM_DIRECT', otimizacao: 'CONVERSATIONS' }
    case 'formulario':
      return { objetivo: 'OUTCOME_LEADS', destino: 'ON_AD', otimizacao: 'LEAD_GENERATION' }
    case 'site':
      return { objetivo: 'OUTCOME_TRAFFIC', destino: 'WEBSITE', otimizacao: 'LINK_CLICKS' }
  }
}

/** Modo de um conjunto já existente (para subir um anúncio novo nele). */
export function modoDoDestino(destino: string | undefined, objetivo: string | undefined): Modo | null {
  if (destino === 'WHATSAPP') return 'whatsapp'
  if (destino === 'INSTAGRAM_DIRECT') return 'direct'
  if (destino === 'ON_AD' || objetivo === 'OUTCOME_LEADS') return 'formulario'
  if (destino === 'WEBSITE' || objetivo === 'OUTCOME_TRAFFIC') return 'site'
  return null
}

export type Publico = {
  /** Cidades ou estados (chaves de buscar_locais_meta); vazio = Brasil inteiro. */
  locais?: { chave: string; tipo: 'cidade' | 'estado'; raioKm?: number }[]
  idadeMin?: number
  idadeMax?: number
  generos?: 'todos' | 'homens' | 'mulheres'
  /** Interesses (ids de buscar_interesses_meta). */
  interesses?: { id: string; nome: string }[]
  /** Público Advantage+: a Meta amplia além do que foi pedido quando acha melhor. */
  advantage?: boolean
}

export function montarPublico(p: Publico) {
  const cidades = (p.locais ?? []).filter((l) => l.tipo === 'cidade').map((l) => ({ key: l.chave, radius: Math.min(80, Math.max(10, l.raioKm ?? 10)), distance_unit: 'kilometer' }))
  const estados = (p.locais ?? []).filter((l) => l.tipo === 'estado').map((l) => ({ key: l.chave }))
  return {
    geo_locations: cidades.length || estados.length ? { ...(cidades.length ? { cities: cidades } : {}), ...(estados.length ? { regions: estados } : {}) } : { countries: ['BR'] },
    age_min: Math.min(65, Math.max(18, p.idadeMin ?? 18)),
    age_max: Math.min(65, Math.max(p.idadeMin ?? 18, p.idadeMax ?? 65)),
    ...(p.generos === 'homens' ? { genders: [1] } : p.generos === 'mulheres' ? { genders: [2] } : {}),
    ...(p.interesses?.length ? { flexible_spec: [{ interests: p.interesses.map((i) => ({ id: i.id, name: i.nome })) }] } : {}),
    targeting_automation: { advantage_audience: p.advantage ? 1 : 0 },
  }
}

export type TextoAnuncio = { texto: string; titulo?: string; descricao?: string; botao?: string }

const LINK_WHATSAPP = 'https://api.whatsapp.com/send'

/** object_story_spec do criativo (imagem pelo hash, vídeo pelo id + capa). */
export function montarCriativo(o: { modo: Modo; paginaId: string; instagramId: string | null; midia: { imagemHash: string } | { videoId: string; capa: string }; anuncio: TextoAnuncio; link?: string; formularioId?: string }) {
  const { modo, anuncio } = o
  const link = modo === 'whatsapp' ? LINK_WHATSAPP : modo === 'formulario' ? 'http://fb.me/' : modo === 'direct' ? 'https://www.instagram.com/' : o.link
  if (!link) throw new Error('Informe o link do site.')
  if (modo === 'formulario' && !o.formularioId) throw new Error('Informe o formulário de cadastro (listar_formularios_meta).')
  const cta =
    modo === 'whatsapp' ? { type: 'WHATSAPP_MESSAGE', value: { app_destination: 'WHATSAPP', link } }
    : modo === 'direct' ? { type: 'INSTAGRAM_MESSAGE', value: { app_destination: 'INSTAGRAM_DIRECT' } }
    : modo === 'formulario' ? { type: anuncio.botao || 'SIGN_UP', value: { lead_gen_form_id: o.formularioId } }
    : { type: anuncio.botao || 'LEARN_MORE', value: { link } }
  const base = { page_id: o.paginaId, ...(o.instagramId ? { instagram_user_id: o.instagramId } : {}) }
  if ('imagemHash' in o.midia) {
    return { ...base, link_data: { image_hash: o.midia.imagemHash, link, message: anuncio.texto, ...(anuncio.titulo ? { name: anuncio.titulo } : {}), ...(anuncio.descricao ? { description: anuncio.descricao } : {}), call_to_action: cta } }
  }
  return { ...base, video_data: { video_id: o.midia.videoId, image_url: o.midia.capa, message: anuncio.texto, ...(anuncio.titulo ? { title: anuncio.titulo } : {}), ...(anuncio.descricao ? { link_description: anuncio.descricao } : {}), call_to_action: cta } }
}

/** Orçamento diário em reais → centavos (a Meta usa a menor unidade da moeda). */
export function centavos(reais: number): number {
  if (!Number.isFinite(reais) || reais <= 0) throw new Error('Orçamento inválido.')
  if (reais > 50_000) throw new Error('Orçamento diário acima de R$ 50.000: confira o valor.')
  return Math.round(reais * 100)
}

export const ROTULO_STATUS: Record<string, string> = {
  ACTIVE: 'Ativo', PAUSED: 'Pausado', CAMPAIGN_PAUSED: 'Campanha pausada', ADSET_PAUSED: 'Conjunto pausado', IN_PROCESS: 'Processando',
  WITH_ISSUES: 'Com problema', PENDING_REVIEW: 'Em análise', DISAPPROVED: 'Reprovado', PREAPPROVED: 'Pré-aprovado', ENABLED: 'Ativo',
}

// ───────────────────────────── Google Ads: campanha de Pesquisa ─────────────────────────────

export type NovaPesquisaGoogle = {
  nome: string
  orcamentoDiario: number
  /** cliques = Maximizar cliques (conta nova, sem conversões); conversoes = Maximizar conversões. */
  estrategia: 'cliques' | 'conversoes'
  /** geoTargetConstants/… de buscar_locais_google; vazio = Brasil. */
  locais: string[]
  palavras: { texto: string; correspondencia: 'ampla' | 'frase' | 'exata' }[]
  negativas?: string[]
  titulos: string[]
  descricoes: string[]
  url: string
  caminho1?: string
  caminho2?: string
}

/** Regras do anúncio responsivo de pesquisa do Google; devolve o primeiro problema ou null. */
export function problemaPesquisaGoogle(n: NovaPesquisaGoogle): string | null {
  const titulos = n.titulos.map((t) => t.trim()).filter(Boolean)
  const descricoes = n.descricoes.map((d) => d.trim()).filter(Boolean)
  if (titulos.length < 3 || titulos.length > 15) return 'O anúncio precisa de 3 a 15 títulos.'
  const longo = titulos.find((t) => t.length > 30)
  if (longo) return `Título com mais de 30 caracteres: "${longo}".`
  if (new Set(titulos.map((t) => t.toLowerCase())).size !== titulos.length) return 'Há títulos repetidos.'
  if (descricoes.length < 2 || descricoes.length > 4) return 'O anúncio precisa de 2 a 4 descrições.'
  const longa = descricoes.find((d) => d.length > 90)
  if (longa) return `Descrição com mais de 90 caracteres: "${longa.slice(0, 40)}…".`
  if (!n.palavras.length || n.palavras.length > 80) return 'Informe de 1 a 80 palavras-chave.'
  const ruim = n.palavras.find((p) => !p.texto.trim() || p.texto.length > 80 || p.texto.split(/\s+/).length > 10)
  if (ruim) return `Palavra-chave inválida: "${ruim.texto}" (até 80 caracteres e 10 palavras).`
  if ([n.caminho1, n.caminho2].some((c) => c && c.length > 15)) return 'Os caminhos da URL têm até 15 caracteres.'
  if (!/^https:\/\/[^\s]+\.[^\s]+/.test(n.url)) return 'A URL final precisa começar com https://.'
  if (n.locais.some((l) => !/^geoTargetConstants\/\d+$/.test(l))) return 'Local inválido (use buscar_locais_google).'
  return null
}

const CORRESPONDENCIA = { ampla: 'BROAD', frase: 'PHRASE', exata: 'EXACT' } as const

/** Operações do googleAds:mutate (tudo numa transação, com ids temporários negativos). Campanha PAUSADA. */
export function operacoesPesquisaGoogle(conta: string, n: NovaPesquisaGoogle) {
  const c = `customers/${conta}`
  const orc = `${c}/campaignBudgets/-1`
  const camp = `${c}/campaigns/-2`
  const grupo = `${c}/adGroups/-3`
  const locais = n.locais.length ? n.locais : ['geoTargetConstants/2076']
  return [
    { campaignBudgetOperation: { create: { resourceName: orc, name: `${n.nome} · orçamento ${Date.now()}`, amountMicros: String(centavos(n.orcamentoDiario) * 10_000), deliveryMethod: 'STANDARD', explicitlyShared: false } } },
    {
      campaignOperation: {
        create: {
          resourceName: camp, name: n.nome, status: 'PAUSED', advertisingChannelType: 'SEARCH', campaignBudget: orc,
          networkSettings: { targetGoogleSearch: true, targetSearchNetwork: false, targetContentNetwork: false, targetPartnerSearchNetwork: false },
          containsEuPoliticalAdvertising: 'DOES_NOT_CONTAIN_EU_POLITICAL_ADVERTISING',
          ...(n.estrategia === 'conversoes' ? { maximizeConversions: {} } : { targetSpend: {} }),
        },
      },
    },
    ...locais.map((l) => ({ campaignCriterionOperation: { create: { campaign: camp, location: { geoTargetConstant: l } } } })),
    { campaignCriterionOperation: { create: { campaign: camp, language: { languageConstant: 'languageConstants/1014' } } } },
    ...(n.negativas ?? []).filter((x) => x.trim()).slice(0, 200).map((x) => ({ campaignCriterionOperation: { create: { campaign: camp, negative: true, keyword: { text: x.trim().slice(0, 80), matchType: 'BROAD' } } } })),
    { adGroupOperation: { create: { resourceName: grupo, campaign: camp, name: `${n.nome} · Grupo 1`, status: 'ENABLED', type: 'SEARCH_STANDARD' } } },
    ...n.palavras.map((p) => ({ adGroupCriterionOperation: { create: { adGroup: grupo, status: 'ENABLED', keyword: { text: p.texto.trim(), matchType: CORRESPONDENCIA[p.correspondencia] } } } })),
    {
      adGroupAdOperation: {
        create: {
          adGroup: grupo, status: 'ENABLED',
          ad: { finalUrls: [n.url], responsiveSearchAd: { headlines: n.titulos.map((t) => t.trim()).filter(Boolean).map((text) => ({ text })), descriptions: n.descricoes.map((d) => d.trim()).filter(Boolean).map((text) => ({ text })), ...(n.caminho1 ? { path1: n.caminho1 } : {}), ...(n.caminho2 ? { path2: n.caminho2 } : {}) } },
        },
      },
    },
  ]
}

// ───────────────────────────── Resposta enxuta para a IA ─────────────────────────────

export type ItemArvore = { id: string; nome: string; nivel: 'campanha' | 'conjunto' | 'anuncio'; status: string; ligado: boolean; diario: number | null; total: number | null; gasto: number; leads: number; criadaEm?: string | null; filhos: ItemArvore[] }
export type FiltroEstrutura = { status: 'ativos' | 'pausados' | 'todos'; comGasto: boolean; campanhaId?: string; pagina?: number; /** Período do gasto (para o alerta de ligada sem gasto). */ periodo?: { de: string; ate: string } }

const passa = (o: Pick<ItemArvore, 'ligado' | 'gasto'>, f: FiltroEstrutura) => (f.status === 'todos' || (f.status === 'ativos') === o.ligado) && (!f.comGasto || o.gasto > 0)
const arred = (n: number) => Math.round(n * 100) / 100

/**
 * Ligada (status ACTIVE) e sem gasto em todo o período: "ativa sem gasto há N dias" (contando da criação, se for depois
 * do início do período). Campanhas e conjuntos com orçamento; anúncio dentro de conjunto que gasta não entra.
 */
export function alertaSemGasto(o: Pick<ItemArvore, 'ligado' | 'gasto' | 'criadaEm' | 'nivel' | 'diario' | 'total'>, periodo?: { de: string; ate: string }): string | null {
  if (!periodo || !o.ligado || o.gasto > 0 || o.nivel === 'anuncio') return null
  if (o.nivel === 'conjunto' && !o.diario && !o.total) return null
  const fim = Date.parse(`${periodo.ate}T23:59:59-03:00`)
  const inicio = Math.max(Date.parse(`${periodo.de}T00:00:00-03:00`), o.criadaEm ? Date.parse(o.criadaEm) : 0)
  const dias = Math.floor((fim - inicio) / 86_400_000) + 1
  return dias >= 2 ? `ativa sem gasto há ${dias} dias (em revisão, reprovada, público pequeno ou pagamento?)` : null
}

/** Só o que a IA precisa: sem nulos, campanhas com os conjuntos; anúncios só ao abrir uma campanha (campanhaId). */
export function estruturaParaIA(campanhas: ItemArvore[], f: FiltroEstrutura) {
  const item = (o: ItemArvore) => {
    const alerta = alertaSemGasto(o, f.periodo)
    return { id: o.id, nome: o.nome, status: o.status, ...(o.diario ? { orcamentoDiario: o.diario } : {}), ...(o.total ? { orcamentoTotal: o.total } : {}), gasto: arred(o.gasto), ...(o.leads ? { leads: o.leads } : {}), ...(alerta ? { alerta } : {}) }
  }
  // Dentro de uma campanha o filtro de status não esconde quem gastou (ex.: conjunto ligado numa campanha pausada).
  const filho = (o: ItemArvore) => (f.comGasto ? o.gasto > 0 : passa(o, { ...f, comGasto: false }) || o.gasto > 0)
  const fecha = (c: ItemArvore, listados: ItemArvore[]) => {
    const fora = arred(c.gasto - listados.reduce((s, j) => s + j.gasto, 0))
    return fora > 0.01 ? { gastoForaDosConjuntos: { valor: fora, motivo: 'gasto de conjuntos arquivados ou excluídos, ou de conjuntos fora do filtro (use status=todos)' } } : {}
  }
  if (f.campanhaId) {
    const c = campanhas.find((x) => x.id === f.campanhaId)
    if (!c) return { erro: 'Campanha não encontrada nesta conta.' }
    const conjuntos = c.filhos.filter(filho)
    return { campanha: { ...item(c), ...fecha(c, conjuntos), conjuntos: conjuntos.map((j) => ({ ...item(j), anuncios: j.filhos.filter(filho).map(item) })) } }
  }
  const visiveis = campanhas.filter((c) => passa(c, f))
  const pagina = Math.max(1, f.pagina ?? 1)
  const nestaPagina = visiveis.slice((pagina - 1) * 60, pagina * 60)
  const foraDoFiltro = campanhas.length - visiveis.length
  const outrasPaginas = visiveis.length - nestaPagina.length
  return {
    campanhas: nestaPagina.map((c) => {
      const conjuntos = c.filhos.filter(filho)
      return { ...item(c), ...fecha(c, conjuntos), conjuntos: conjuntos.map((j) => ({ ...item(j), anuncios: j.filhos.length })) }
    }),
    total: visiveis.length,
    pagina,
    ...(visiveis.length > pagina * 60 ? { proximaPagina: pagina + 1 } : {}),
    dica: [
      'Ordem: ativas primeiro, depois maior gasto. Para ver os anúncios de uma campanha, chame de novo com campanhaId (texto).',
      ...(foraDoFiltro ? [`${foraDoFiltro} campanha(s) ficaram fora do filtro (${f.status === 'ativos' ? 'pausadas' : f.status === 'pausados' ? 'ativas' : 'sem gasto'}${f.comGasto && f.status !== 'todos' ? ' ou sem gasto' : ''}).`] : []),
      ...(outrasPaginas ? [`${outrasPaginas} campanha(s) em outras páginas (60 por página): use pagina.`] : []),
      'Campanhas arquivadas ou excluídas na Meta não aparecem.',
    ].join(' '),
  }
}

export type CampanhaGoogleIA = { id: string; nome: string; status: 'ENABLED' | 'PAUSED'; tipo: string; orcamento: { diario: number; compartilhado: boolean } | null; custo: number; conversoes: number; cliques: number }

/** Campanhas do Google para a IA: mesmo filtro da Meta, orçamento achatado e alerta de ligada sem gasto. */
export function googleParaIA(campanhas: CampanhaGoogleIA[], f: FiltroEstrutura) {
  return campanhas
    .filter((c) => passa({ ligado: c.status === 'ENABLED', gasto: c.custo }, f))
    .map(({ orcamento, ...c }) => {
      const alerta = alertaSemGasto({ ligado: c.status === 'ENABLED', gasto: c.custo, nivel: 'campanha', diario: orcamento?.diario ?? null, total: null }, f.periodo)
      return { ...c, custo: arred(c.custo), ...(orcamento ? { orcamentoDiario: orcamento.diario, ...(orcamento.compartilhado ? { orcamentoCompartilhado: true } : {}) } : {}), ...(alerta ? { alerta } : {}) }
    })
}
