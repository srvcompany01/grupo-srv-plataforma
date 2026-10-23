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
