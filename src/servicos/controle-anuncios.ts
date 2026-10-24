import 'server-only'
import { centavos, configDoModo, modoDoDestino, montarCriativo, montarPublico, operacoesPesquisaGoogle, podeGerirAnuncios, problemaPesquisaGoogle, type Modo, type NovaPesquisaGoogle, type Publico, type TextoAnuncio } from '@/dominio/controle-anuncios'
import { leadsDasAcoes } from '@/dominio/performance'
import { urlLeitura } from '@/infra/r2'
import { criarClienteAdmin } from '@/infra/supabase/admin'
import type { Supabase } from '@/infra/supabase/servidor'
import type { Json } from '@/infra/supabase/tipos'
import type { Cliente } from './clientes-plataforma'
import { paginaDoCliente } from './comentarios-redes'
import { campanhaGoogle, ErroGoogle, mutarGoogle, orcamentoGoogle, situacaoGoogle, statusCampanhaGoogle } from './google-agencia'
import { ErroMeta, graph } from './publicacao-meta'
import { dados } from './resultado'

/**
 * Controle dos anúncios (Meta e Google Ads) pela plataforma e pela IA (MCP). Precisa do token da Meta com
 * ads_management (e pages_manage_ads / leads_retrieval para formulários) e da conta Google da agência com acesso
 * Padrão ou Administrador na MCC. Toda alteração fica em ad_changes. Pela IA, ativar e mudar orçamento viram proposta
 * (ad_proposals) que admin ou gestor aprova na aba Anúncios; criar campanha e anúncio sempre nasce PAUSADO.
 */

export type Nivel = 'campanha' | 'conjunto' | 'anuncio'
export type Acao = 'pausar' | 'ativar' | 'orcamento'
type Quem = { id: string; papel: string }

/** Erro com mensagem para a tela (mensagemErro mostra o texto de P0001). */
const falha = (message: string) => Object.assign(new Error(message), { code: 'P0001' })

async function comMensagem<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn()
  } catch (e) {
    if (e instanceof ErroMeta || e instanceof ErroGoogle) throw falha(e.message)
    throw e
  }
}

const reais = (n: number | null) => (n === null ? '—' : n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }))

// ───────────────────────────── Meta: leitura ─────────────────────────────

export type ObjetoMeta = { id: string; nome: string; nivel: Nivel; status: string; ligado: boolean; diario: number | null; total: number | null; gasto: number; leads: number; miniatura: string | null; criadaEm: string | null; filhos: ObjetoMeta[] }

type Bruto = { id: string; name: string; status: string; effective_status: string; created_time?: string; daily_budget?: string; lifetime_budget?: string; campaign_id?: string; adset_id?: string; creative?: { thumbnail_url?: string } }
const reaisDe = (centavos?: string) => (centavos && Number(centavos) > 0 ? Number(centavos) / 100 : null)

/** Campanhas › conjuntos › anúncios (ativos e pausados) com orçamento, gasto e leads do período. Sem cache. */
export async function estruturaMeta(contaId: string, periodo: { de: string; ate: string }): Promise<ObjetoMeta[]> {
  return comMensagem(async () => {
    const act = `act_${contaId}`
    // ponytail: só a primeira página de cada lista (100 campanhas / 300 conjuntos / 500 anúncios); paginar se alguma conta passar disso.
    const insights = (level: string, campo: string) =>
      graph<{ data: ({ spend?: string; actions?: { action_type: string; value: string }[] } & Record<string, string>)[] }>(`${act}/insights`, { params: { level, fields: `${campo},spend,actions`, time_range: JSON.stringify({ since: periodo.de, until: periodo.ate }), limit: '500' } })
    const [camps, conjs, ads, ins, insCamp, insConj] = await Promise.all([
      graph<{ data: Bruto[] }>(`${act}/campaigns`, { params: { fields: 'id,name,status,effective_status,created_time,daily_budget,lifetime_budget', effective_status: '["ACTIVE","PAUSED"]', limit: '100' } }),
      graph<{ data: Bruto[] }>(`${act}/adsets`, { params: { fields: 'id,name,status,effective_status,created_time,daily_budget,lifetime_budget,campaign_id', effective_status: '["ACTIVE","PAUSED","CAMPAIGN_PAUSED"]', limit: '300' } }),
      graph<{ data: Bruto[] }>(`${act}/ads`, { params: { fields: 'id,name,status,effective_status,adset_id,creative{thumbnail_url}', effective_status: '["ACTIVE","PAUSED","ADSET_PAUSED","CAMPAIGN_PAUSED","PENDING_REVIEW","DISAPPROVED","WITH_ISSUES","IN_PROCESS"]', limit: '500' } }),
      insights('ad', 'ad_id'),
      // Gasto de campanha e conjunto direto da Meta: inclui anúncios e conjuntos arquivados que gastaram no período.
      insights('campaign', 'campaign_id'),
      insights('adset', 'adset_id'),
    ])
    const ler = (lista: typeof ins.data, chave: string) => new Map(lista.map((i) => {
      const l = leadsDasAcoes(i.actions)
      return [i[chave], { gasto: Number(i.spend ?? 0), leads: l.formularios + l.conversas }]
    }))
    const numeros = ler(ins.data, 'ad_id')
    const porCampanha = ler(insCamp.data, 'campaign_id')
    const porConjunto = ler(insConj.data, 'adset_id')
    const obj = (b: Bruto, nivel: Nivel, filhos: ObjetoMeta[]): ObjetoMeta => {
      const n = (nivel === 'anuncio' ? numeros : nivel === 'conjunto' ? porConjunto : porCampanha).get(b.id) ?? (nivel === 'anuncio' ? { gasto: 0, leads: 0 } : { gasto: filhos.reduce((s, f) => s + f.gasto, 0), leads: filhos.reduce((s, f) => s + f.leads, 0) })
      return { id: b.id, nome: b.name, nivel, status: b.effective_status, ligado: b.status === 'ACTIVE', diario: reaisDe(b.daily_budget), total: reaisDe(b.lifetime_budget), ...n, miniatura: b.creative?.thumbnail_url ?? null, criadaEm: b.created_time ?? null, filhos }
    }
    const anunciosDe = (conj: string) => ads.data.filter((a) => a.adset_id === conj).map((a) => obj(a, 'anuncio', []))
    const conjuntosDe = (camp: string) => conjs.data.filter((c) => c.campaign_id === camp).map((c) => obj(c, 'conjunto', anunciosDe(c.id)))
    return camps.data
      .map((c) => obj(c, 'campanha', conjuntosDe(c.id)))
      .sort((a, b) => Number(b.ligado) - Number(a.ligado) || b.gasto - a.gasto)
  })
}

/** Confere que o objeto é da conta do cliente e devolve o nome, o status e o orçamento atuais. */
async function objetoMeta(contaId: string, id: string): Promise<{ nome: string; ligado: boolean; diario: number | null; total: number | null }> {
  if (!/^\d{1,25}$/.test(id)) throw falha('Id inválido.')
  const o = await graph<{ account_id?: string; name: string; status: string; daily_budget?: string; lifetime_budget?: string }>(id, { params: { fields: 'account_id,name,status,daily_budget,lifetime_budget' } })
  if (o.account_id !== contaId) throw falha('Este item não é da conta de anúncios do cliente.')
  return { nome: o.name, ligado: o.status === 'ACTIVE', diario: reaisDe(o.daily_budget), total: reaisDe(o.lifetime_budget) }
}

// ───────────────────────────── Alterações (tela e IA) ─────────────────────────────

export type Pedido = { plataforma: 'meta' | 'google'; nivel: Nivel; objetoId: string; acao: Acao; valor?: number }

/** Situação atual (nome, ligado, orçamento) do item na conta do cliente. */
async function atual(cliente: Cliente, p: Pick<Pedido, 'plataforma' | 'nivel' | 'objetoId'>): Promise<{ nome: string; ligado: boolean; orcamento: number | null; tipoOrcamento: 'diario' | 'total' | null; recursoGoogle?: string; compartilhado?: boolean }> {
  if (p.plataforma === 'meta') {
    if (!cliente.metaContaId) throw falha('O cliente não tem conta de anúncios da Meta no cadastro.')
    const o = await objetoMeta(cliente.metaContaId, p.objetoId)
    return { nome: o.nome, ligado: o.ligado, orcamento: o.diario ?? o.total, tipoOrcamento: o.diario ? 'diario' : o.total ? 'total' : null }
  }
  if (!cliente.googleAdsId) throw falha('O cliente não tem conta do Google Ads no cadastro.')
  if (p.nivel !== 'campanha') throw falha('No Google Ads a plataforma controla as campanhas.')
  const c = await campanhaGoogle(cliente.googleAdsId, p.objetoId)
  if (!c) throw falha('Campanha não encontrada na conta do Google Ads do cliente.')
  return { nome: c.nome, ligado: c.status === 'ENABLED', orcamento: c.orcamento?.diario ?? null, tipoOrcamento: c.orcamento ? 'diario' : null, recursoGoogle: c.orcamento?.recurso, compartilhado: c.orcamento?.compartilhado }
}

/** Pausa, ativa ou muda o orçamento, e registra no histórico. Só admin e gestor. */
export async function executarAlteracao(sb: Supabase, quem: Quem, cliente: Cliente, p: Pedido, origem: 'plataforma' | 'ia' = 'plataforma'): Promise<string> {
  if (!podeGerirAnuncios(quem.papel)) throw falha('Só admin e gestor alteram anúncios.')
  return comMensagem(async () => {
    const a = await atual(cliente, p)
    let antes = a.ligado ? 'ativo' : 'pausado'
    let depois = p.acao === 'pausar' ? 'pausado' : 'ativo'
    if (p.acao === 'orcamento') {
      if (!a.tipoOrcamento) throw falha(p.nivel === 'campanha' ? 'Esta campanha não tem orçamento próprio: o orçamento está nos conjuntos.' : 'Este conjunto não tem orçamento próprio: o orçamento está na campanha.')
      const v = centavos(p.valor ?? 0)
      antes = `${reais(a.orcamento)}${a.tipoOrcamento === 'total' ? ' (total)' : '/dia'}`
      depois = `${reais(v / 100)}${a.tipoOrcamento === 'total' ? ' (total)' : '/dia'}`
      if (p.plataforma === 'meta') await graph(p.objetoId, { metodo: 'POST', params: { [a.tipoOrcamento === 'total' ? 'lifetime_budget' : 'daily_budget']: String(v) } })
      else await orcamentoGoogle(cliente.googleAdsId!, a.recursoGoogle!, v / 100)
    } else if (p.plataforma === 'meta') {
      await graph(p.objetoId, { metodo: 'POST', params: { status: p.acao === 'pausar' ? 'PAUSED' : 'ACTIVE' } })
    } else {
      await statusCampanhaGoogle(cliente.googleAdsId!, p.objetoId, p.acao === 'ativar')
    }
    await registrar(sb, cliente.id, { ...p, nome: a.nome, antes, depois, origem })
    return a.compartilhado && p.acao === 'orcamento' ? `${a.nome}: ${antes} → ${depois} (orçamento compartilhado: vale para todas as campanhas que o usam).` : `${a.nome}: ${antes} → ${depois}.`
  })
}

async function registrar(sb: Supabase, clienteId: string, r: { plataforma: string; nivel: string; objetoId: string; acao: string; nome: string; antes?: string; depois?: string; origem: string }) {
  const { error } = await sb.from('ad_changes').insert({ client_id: clienteId, plataforma: r.plataforma, nivel: r.nivel, objeto_id: r.objetoId, objeto_nome: r.nome.slice(0, 300), acao: r.acao, antes: (r.antes ?? '').slice(0, 200), depois: (r.depois ?? '').slice(0, 200), origem: r.origem })
  if (error) console.error('ad_changes', error)
}

export type Alteracao = { id: string; plataforma: string; nivel: string; nome: string; acao: string; antes: string; depois: string; origem: string; por: string; em: string }

export async function historico(sb: Supabase, clienteId: string, limite = 20): Promise<Alteracao[]> {
  const { data, error } = await sb.from('ad_changes').select('id, plataforma, nivel, objeto_nome, acao, antes, depois, origem, created_at, profiles!ad_changes_created_by_fkey(full_name)').eq('client_id', clienteId).order('created_at', { ascending: false }).limit(limite)
  if (error) return []
  return (data as unknown as { id: string; plataforma: string; nivel: string; objeto_nome: string; acao: string; antes: string; depois: string; origem: string; created_at: string; profiles: { full_name: string } | null }[]).map((r) => ({ id: r.id, plataforma: r.plataforma, nivel: r.nivel, nome: r.objeto_nome, acao: r.acao, antes: r.antes, depois: r.depois, origem: r.origem, por: r.profiles?.full_name ?? '', em: r.created_at }))
}

// ───────────────────────────── Propostas da IA ─────────────────────────────

export type Proposta = { id: string; clienteId: string; cliente: string; plataforma: string; nivel: string; objetoId: string; nome: string; acao: string; valorAtual: number | null; valorNovo: number | null; motivo: string; por: string; em: string }

/** A IA pede para ativar ou mudar orçamento: fica pendente e avisa admin e gestor no sino. */
export async function proporAlteracao(sb: Supabase, cliente: Cliente, p: Pedido & { acao: 'ativar' | 'orcamento'; motivo: string }): Promise<string> {
  return comMensagem(async () => {
    const a = await atual(cliente, p)
    if (p.acao === 'orcamento') {
      if (!a.tipoOrcamento) throw falha('Este item não tem orçamento próprio (veja o nível da campanha ou do conjunto).')
      centavos(p.valor ?? 0)
    }
    if (p.acao === 'ativar' && a.ligado) throw falha('Este item já está ativo.')
    const orcamento = p.acao === 'orcamento'
    const { data: nova, error } = await sb.from('ad_proposals').insert({ client_id: cliente.id, plataforma: p.plataforma, nivel: p.nivel, objeto_id: p.objetoId, objeto_nome: a.nome.slice(0, 300), acao: p.acao, valor_atual: orcamento ? a.orcamento : null, valor_novo: orcamento ? (p.valor ?? null) : null, motivo: p.motivo.slice(0, 500) }).select('id').single()
    if (error) throw error
    const admin = criarClienteAdmin()
    const { data: gestores } = await admin.from('profiles').select('id').in('role', ['admin', 'gestor']).eq('active', true)
    const texto = p.acao === 'orcamento' ? `IA propõe orçamento de ${reais(p.valor!)} em "${a.nome}" (${cliente.nome})` : `IA propõe ativar "${a.nome}" (${cliente.nome})`
    if (gestores?.length) await admin.from('notifications').insert(gestores.map((g) => ({ user_id: g.id, kind: 'alerta', message: texto.slice(0, 300), link: `/anuncios?cliente=${cliente.id}` })))
    return nova.id
  })
}

export async function propostasPendentes(sb: Supabase, clienteId?: string): Promise<Proposta[]> {
  let q = sb.from('ad_proposals').select('id, client_id, plataforma, nivel, objeto_id, objeto_nome, acao, valor_atual, valor_novo, motivo, created_at, clients!ad_proposals_client_id_fkey(name), profiles!ad_proposals_created_by_fkey(full_name)').eq('status', 'pendente').order('created_at', { ascending: false }).limit(50)
  if (clienteId) q = q.eq('client_id', clienteId)
  const { data, error } = await q
  if (error) return []
  return (data as unknown as { id: string; client_id: string; plataforma: string; nivel: string; objeto_id: string; objeto_nome: string; acao: string; valor_atual: number | null; valor_novo: number | null; motivo: string; created_at: string; clients: { name: string } | null; profiles: { full_name: string } | null }[]).map((r) => ({
    id: r.id, clienteId: r.client_id, cliente: r.clients?.name ?? '', plataforma: r.plataforma, nivel: r.nivel, objetoId: r.objeto_id, nome: r.objeto_nome, acao: r.acao,
    valorAtual: r.valor_atual === null ? null : Number(r.valor_atual), valorNovo: r.valor_novo === null ? null : Number(r.valor_novo), motivo: r.motivo, por: r.profiles?.full_name ?? '', em: r.created_at,
  }))
}

/** Admin ou gestor aprova (executa na hora) ou recusa. */
export async function decidirProposta(sb: Supabase, quem: Quem, id: string, aprovar: boolean, buscarCliente: (id: string) => Promise<Cliente | null>): Promise<string> {
  if (!podeGerirAnuncios(quem.papel)) throw falha('Só admin e gestor decidem as propostas.')
  const { data: p, error } = await sb.from('ad_proposals').select('*').eq('id', id).eq('status', 'pendente').maybeSingle()
  if (error) throw error
  if (!p) throw falha('Proposta não encontrada ou já decidida.')
  const fim = { decided_by: quem.id, decided_at: new Date().toISOString() }
  if (!aprovar) {
    dados(await sb.from('ad_proposals').update({ ...fim, status: 'recusada' }).eq('id', id).select('id'))
    return 'Proposta recusada.'
  }
  const cliente = await buscarCliente(p.client_id)
  if (!cliente) throw falha('Cliente não encontrado.')
  try {
    const r = await executarAlteracao(sb, quem, cliente, { plataforma: p.plataforma as Pedido['plataforma'], nivel: p.nivel as Nivel, objetoId: p.objeto_id, acao: p.acao as Acao, valor: p.valor_novo === null ? undefined : Number(p.valor_novo) }, 'ia')
    dados(await sb.from('ad_proposals').update({ ...fim, status: 'aprovada' }).eq('id', id).select('id'))
    return r
  } catch (e) {
    await sb.from('ad_proposals').update({ ...fim, status: 'erro', erro: (e instanceof Error ? e.message : 'Erro').slice(0, 500) }).eq('id', id)
    throw e
  }
}

// ───────────────────────────── Criativos ─────────────────────────────

export type Criativo = { id: string; nome: string; tipo: 'imagem' | 'video'; chave: string; criadoEm: string }

export async function listarCriativos(sb: Supabase, clienteId: string): Promise<Criativo[]> {
  const { data, error } = await sb.from('ad_creatives').select('id, nome, tipo, chave, created_at').eq('client_id', clienteId).is('arquivado_em', null).order('created_at', { ascending: false }).limit(100)
  if (error) return []
  return data.map((c) => ({ id: c.id, nome: c.nome, tipo: c.tipo as Criativo['tipo'], chave: c.chave, criadoEm: c.created_at }))
}

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Envia o criativo para a conta da Meta (uma vez por conta; depois reaproveita). */
async function midiaNaMeta(sb: Supabase, clienteId: string, contaId: string, criativoId: string): Promise<{ imagemHash: string } | { videoId: string; capa: string }> {
  const { data: c, error } = await sb.from('ad_creatives').select('id, tipo, chave, meta, arquivado_em').eq('id', criativoId).eq('client_id', clienteId).maybeSingle()
  if (error) throw error
  if (!c) throw falha(`Criativo ${criativoId} não encontrado na biblioteca deste cliente.`)
  const salvos = (c.meta ?? {}) as Record<string, string>
  let ref = salvos[contaId]
  if (!ref && c.arquivado_em) throw falha(`O criativo ${criativoId} foi arquivado pelo ciclo de renovação. Suba o arquivo de novo.`)
  if (!ref) {
    const url = await urlLeitura(c.chave)
    if (c.tipo === 'imagem') {
      const arquivo = await fetch(url)
      if (!arquivo.ok) throw falha('Não consegui ler o arquivo do criativo.')
      const r = await graph<{ images: Record<string, { hash: string }> }>(`act_${contaId}/adimages`, { metodo: 'POST', params: { bytes: Buffer.from(await arquivo.arrayBuffer()).toString('base64') } })
      ref = Object.values(r.images)[0].hash
    } else {
      ref = (await graph<{ id: string }>(`act_${contaId}/advideos`, { metodo: 'POST', params: { file_url: url, name: c.chave.split('/').pop()! } })).id
    }
    await sb.from('ad_creatives').update({ meta: { ...salvos, [contaId]: ref } as Json }).eq('id', c.id)
  }
  if (c.tipo === 'imagem') return { imagemHash: ref }
  // O vídeo precisa terminar de processar para ter capa.
  for (let i = 0; i < 9; i++) {
    const v = await graph<{ status?: { video_status?: string }; thumbnails?: { data: { uri: string; is_preferred?: boolean }[] } }>(ref, { params: { fields: 'status,thumbnails' } })
    if (v.status?.video_status === 'error') throw falha('A Meta recusou o vídeo (formato ou duração).')
    const capa = v.thumbnails?.data.find((t) => t.is_preferred)?.uri ?? v.thumbnails?.data[0]?.uri
    if (v.status?.video_status === 'ready' && capa) return { videoId: ref, capa }
    await esperar(5000)
  }
  throw falha('A Meta ainda está processando o vídeo. Peça de novo em 1 ou 2 minutos (o envio não se repete).')
}

// ───────────────────────────── Criação na Meta (IA) ─────────────────────────────

async function contexto(cliente: Cliente) {
  if (!cliente.metaContaId) throw falha('O cliente não tem conta de anúncios da Meta no cadastro.')
  if (!cliente.metaPaginaId) throw falha('O cliente não tem a Página do Facebook no cadastro.')
  const pagina = await paginaDoCliente(cliente.metaPaginaId)
  return { contaId: cliente.metaContaId, paginaId: cliente.metaPaginaId, instagramId: pagina.ig?.id ?? null }
}

type NovoAnuncio = TextoAnuncio & { criativoId: string; nome?: string }

async function criarAnuncio(sb: Supabase, cliente: Cliente, ctx: Awaited<ReturnType<typeof contexto>>, o: { modo: Modo; conjuntoId: string; anuncio: NovoAnuncio; link?: string; formularioId?: string }): Promise<string> {
  const midia = await midiaNaMeta(sb, cliente.id, ctx.contaId, o.anuncio.criativoId)
  const spec = montarCriativo({ modo: o.modo, paginaId: ctx.paginaId, instagramId: ctx.instagramId, midia, anuncio: o.anuncio, link: o.link, formularioId: o.formularioId })
  const nome = (o.anuncio.nome || o.anuncio.titulo || o.anuncio.texto).slice(0, 80)
  const criativo = await graph<{ id: string }>(`act_${ctx.contaId}/adcreatives`, { metodo: 'POST', params: { name: nome, object_story_spec: JSON.stringify(spec) } })
  const ad = await graph<{ id: string }>(`act_${ctx.contaId}/ads`, { metodo: 'POST', params: { name: nome, adset_id: o.conjuntoId, creative: JSON.stringify({ creative_id: criativo.id }), status: 'PAUSED' } })
  await registrar(sb, cliente.id, { plataforma: 'meta', nivel: 'anuncio', objetoId: ad.id, acao: 'criar', nome, depois: 'pausado', origem: 'ia' })
  return ad.id
}

export type NovaCampanha = { nome: string; modo: Modo; orcamentoDiario: number; inicio?: string; fim?: string; publico: Publico; anuncios: NovoAnuncio[]; link?: string; formularioId?: string }

/** Campanha + conjunto + anúncios, tudo PAUSADO. Se algo falhar no meio, o que já foi criado continua pausado. */
export async function criarCampanhaMeta(sb: Supabase, quem: Quem, cliente: Cliente, n: NovaCampanha): Promise<{ campanhaId: string; conjuntoId: string; anuncios: string[]; erros: string[] }> {
  if (!podeGerirAnuncios(quem.papel)) throw falha('Só admin e gestor criam campanhas.')
  if (!n.anuncios.length) throw falha('Informe ao menos um anúncio (criativo + texto).')
  return comMensagem(async () => {
    const ctx = await contexto(cliente)
    const cfg = configDoModo(n.modo)
    const act = `act_${ctx.contaId}`
    const camp = await graph<{ id: string }>(`${act}/campaigns`, { metodo: 'POST', params: { name: n.nome, objective: cfg.objetivo, status: 'PAUSED', special_ad_categories: '[]', is_adset_budget_sharing_enabled: 'false' } })
    await registrar(sb, cliente.id, { plataforma: 'meta', nivel: 'campanha', objetoId: camp.id, acao: 'criar', nome: n.nome, depois: 'pausado', origem: 'ia' })
    const conj = await graph<{ id: string }>(`${act}/adsets`, {
      metodo: 'POST',
      params: {
        name: `${n.nome} · Público`,
        campaign_id: camp.id,
        status: 'PAUSED',
        daily_budget: String(centavos(n.orcamentoDiario)),
        billing_event: 'IMPRESSIONS',
        optimization_goal: cfg.otimizacao,
        bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
        destination_type: cfg.destino,
        promoted_object: JSON.stringify({ page_id: ctx.paginaId }),
        targeting: JSON.stringify(montarPublico(n.publico)),
        ...(n.inicio ? { start_time: `${n.inicio}T00:00:00-0300` } : {}),
        ...(n.fim ? { end_time: `${n.fim}T23:59:00-0300` } : {}),
      },
    })
    await registrar(sb, cliente.id, { plataforma: 'meta', nivel: 'conjunto', objetoId: conj.id, acao: 'criar', nome: `${n.nome} · Público`, depois: `pausado · ${reais(n.orcamentoDiario)}/dia`, origem: 'ia' })
    const anuncios: string[] = []
    const erros: string[] = []
    for (const a of n.anuncios) {
      try {
        anuncios.push(await criarAnuncio(sb, cliente, ctx, { modo: n.modo, conjuntoId: conj.id, anuncio: a, link: n.link, formularioId: n.formularioId }))
      } catch (e) {
        erros.push(`${a.criativoId}: ${e instanceof Error ? e.message : 'erro'}`)
      }
    }
    return { campanhaId: camp.id, conjuntoId: conj.id, anuncios, erros }
  })
}

/** Sobe um criativo novo num conjunto que já existe (nasce pausado). */
export async function adicionarAnuncioMeta(sb: Supabase, quem: Quem, cliente: Cliente, o: { conjuntoId: string; anuncio: NovoAnuncio; link?: string; formularioId?: string }): Promise<string> {
  if (!podeGerirAnuncios(quem.papel)) throw falha('Só admin e gestor criam anúncios.')
  return comMensagem(async () => {
    const ctx = await contexto(cliente)
    if (!/^\d{1,25}$/.test(o.conjuntoId)) throw falha('Id do conjunto inválido.')
    const c = await graph<{ account_id?: string; destination_type?: string; campaign?: { objective?: string } }>(o.conjuntoId, { params: { fields: 'account_id,destination_type,campaign{objective}' } })
    if (c.account_id !== ctx.contaId) throw falha('Este conjunto não é da conta de anúncios do cliente.')
    const modo = modoDoDestino(c.destination_type, c.campaign?.objective)
    if (!modo) throw falha(`A plataforma ainda não monta anúncios para este destino (${c.destination_type ?? c.campaign?.objective ?? 'desconhecido'}).`)
    return criarAnuncio(sb, cliente, ctx, { modo, ...o })
  })
}

// ───────────────────────────── Busca de público e formulários ─────────────────────────────

export async function buscarInteresses(q: string): Promise<{ id: string; nome: string; tamanho: string; caminho: string }[]> {
  return comMensagem(async () => {
    const r = await graph<{ data: { id: string; name: string; audience_size_lower_bound?: number; audience_size_upper_bound?: number; path?: string[] }[] }>('search', { params: { type: 'adinterest', q, limit: '25', locale: 'pt_BR' } })
    return r.data.map((i) => ({ id: i.id, nome: i.name, tamanho: i.audience_size_lower_bound ? `${i.audience_size_lower_bound.toLocaleString('pt-BR')}–${(i.audience_size_upper_bound ?? 0).toLocaleString('pt-BR')}` : '', caminho: (i.path ?? []).join(' › ') }))
  })
}

export async function buscarLocais(q: string): Promise<{ chave: string; nome: string; tipo: 'cidade' | 'estado'; estado: string }[]> {
  return comMensagem(async () => {
    const r = await graph<{ data: { key: string; name: string; type: string; region?: string }[] }>('search', { params: { type: 'adgeolocation', q, location_types: '["city","region"]', country_code: 'BR', limit: '15', locale: 'pt_BR' } })
    return r.data.map((l) => ({ chave: l.key, nome: l.name, tipo: l.type === 'city' ? 'cidade' : 'estado', estado: l.region ?? '' }))
  })
}

export async function formulariosDoCliente(cliente: Cliente): Promise<{ id: string; nome: string; status: string }[]> {
  if (!cliente.metaPaginaId) throw falha('O cliente não tem a Página do Facebook no cadastro.')
  return comMensagem(async () => {
    const p = await paginaDoCliente(cliente.metaPaginaId!)
    const r = await graph<{ data: { id: string; name: string; status: string }[] }>(`${cliente.metaPaginaId}/leadgen_forms`, { token: p.token, params: { fields: 'id,name,status', limit: '50' } })
    return r.data.map((f) => ({ id: f.id, nome: f.name, status: f.status }))
  })
}

// ───────────────────────────── Criação no Google Ads (IA) ─────────────────────────────

/** Campanha de Pesquisa completa (orçamento, locais, idioma, grupo, palavras, negativas e anúncio), PAUSADA. */
export async function criarCampanhaGoogle(sb: Supabase, quem: Quem, cliente: Cliente, n: NovaPesquisaGoogle): Promise<{ campanhaId: string }> {
  if (!podeGerirAnuncios(quem.papel)) throw falha('Só admin e gestor criam campanhas.')
  if (!cliente.googleAdsId) throw falha('O cliente não tem conta do Google Ads no cadastro.')
  if (!(await situacaoGoogle()).conectado) throw falha('A conta Google da agência não está conectada (aba Anúncios).')
  const problema = problemaPesquisaGoogle(n)
  if (problema) throw falha(problema)
  return comMensagem(async () => {
    const id = await mutarGoogle(cliente.googleAdsId!, operacoesPesquisaGoogle(cliente.googleAdsId!, n))
    await registrar(sb, cliente.id, { plataforma: 'google', nivel: 'campanha', objetoId: id || 'novo', acao: 'criar', nome: n.nome, depois: `pausada · ${reais(n.orcamentoDiario)}/dia · ${n.palavras.length} palavras`, origem: 'ia' })
    return { campanhaId: id }
  })
}

// ───────────────────────────── Alerta: campanha ativa sem gasto ─────────────────────────────

/** Campanhas ligadas (Meta e Google) que não gastaram nada nos 2 últimos dias completos, de cada cliente. */
export async function campanhasParadas(cliente: Cliente, googleConectado: boolean, hoje: string): Promise<string[]> {
  const ontem = new Date(Date.parse(`${hoje}T12:00:00Z`) - 86_400_000).toISOString().slice(0, 10)
  const anteontem = new Date(Date.parse(`${hoje}T12:00:00Z`) - 2 * 86_400_000).toISOString().slice(0, 10)
  const limite = Date.parse(`${anteontem}T03:00:00Z`)
  const nomes: string[] = []
  if (cliente.metaContaId) {
    const r = await graph<{ data: { name: string; created_time: string; insights?: { data: { spend?: string }[] } }[] }>(`act_${cliente.metaContaId}/campaigns`, {
      params: { fields: `name,created_time,insights.time_range(${JSON.stringify({ since: anteontem, until: ontem })}){spend}`, effective_status: '["ACTIVE"]', limit: '100' },
    }).catch(() => null)
    for (const c of r?.data ?? []) if (Date.parse(c.created_time) < limite && !Number(c.insights?.data?.[0]?.spend ?? 0)) nomes.push(`Meta: ${c.name}`)
    // Conjuntos com orçamento próprio: num conjunto de campanha com orçamento (CBO) gasto zero pode ser só a otimização da Meta.
    const conj = await graph<{ data: { name: string; created_time: string; daily_budget?: string; lifetime_budget?: string; campaign?: { name?: string }; insights?: { data: { spend?: string }[] } }[] }>(`act_${cliente.metaContaId}/adsets`, {
      params: { fields: `name,created_time,daily_budget,lifetime_budget,campaign{name},insights.time_range(${JSON.stringify({ since: anteontem, until: ontem })}){spend}`, effective_status: '["ACTIVE"]', limit: '200' },
    }).catch(() => null)
    for (const j of conj?.data ?? []) {
      const proprio = Number(j.daily_budget ?? 0) > 0 || Number(j.lifetime_budget ?? 0) > 0
      if (proprio && Date.parse(j.created_time) < limite && !Number(j.insights?.data?.[0]?.spend ?? 0) && !nomes.includes(`Meta: ${j.campaign?.name}`)) nomes.push(`Meta (conjunto): ${j.name}`)
    }
  }
  if (cliente.googleAdsId && googleConectado) {
    const { estruturaGoogle } = await import('./google-agencia')
    const g = await estruturaGoogle(cliente.googleAdsId, { de: anteontem, ate: ontem })
    if (!('erro' in g)) for (const c of g) if (c.status === 'ENABLED' && c.custo === 0) nomes.push(`Google: ${c.nome}`)
  }
  return nomes
}

/** Rotina diária: avisa admin e gestor (no sino) das campanhas ligadas sem gasto; não repete o mesmo aviso por 3 dias. */
export async function avisarCampanhasParadas(clientes: Cliente[], hoje: string): Promise<number> {
  const admin = criarClienteAdmin()
  const google = (await situacaoGoogle()).conectado
  const { data: gestores } = await admin.from('profiles').select('id').in('role', ['admin', 'gestor']).eq('active', true)
  if (!gestores?.length) return 0
  let avisos = 0
  for (const c of clientes.filter((x) => !x.interno && x.status !== 'encerrado' && (x.metaContaId || x.googleAdsId))) {
    const nomes = await campanhasParadas(c, google, hoje).catch(() => [])
    if (!nomes.length) continue
    const link = `/anuncios?cliente=${c.id}`
    const { count } = await admin.from('notifications').select('id', { count: 'exact', head: true }).eq('kind', 'alerta').eq('link', link).like('message', '%sem gasto%').gte('created_at', new Date(Date.now() - 3 * 86_400_000).toISOString())
    if (count) continue
    const message = `${c.nome}: ${nomes.length} campanha(s)/conjunto(s) ligado(s) sem gasto há 2 dias (${nomes.slice(0, 3).join('; ')}${nomes.length > 3 ? '…' : ''}). Veja se os anúncios estão em revisão, reprovados, com público pequeno demais ou com problema de pagamento.`.slice(0, 300)
    await admin.from('notifications').insert(gestores.map((g) => ({ user_id: g.id, kind: 'alerta', message, link })))
    avisos++
  }
  return avisos
}
