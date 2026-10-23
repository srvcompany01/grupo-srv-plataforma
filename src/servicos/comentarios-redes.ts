import 'server-only'
import { ALERTA, classificarComentario, textoDoAlerta, type TomComentario } from '@/dominio/comentarios'
import { configIA } from '@/ia/modelo'
import { criarClienteAdmin } from '@/infra/supabase/admin'
import type { Supabase } from '@/infra/supabase/servidor'
import { ErroMeta, graph } from './publicacao-meta'

/**
 * Comentários do Instagram e do Facebook dos clientes, pela API da Meta (token do usuário do sistema; no Facebook, o
 * token da Página). A leitura roda na rotina (a cada 15 minutos) e no botão "Atualizar": guarda os novos, classifica o
 * tom e avisa admin e gestor no sino quando é negativo ou agressivo. Responder e ocultar saem daqui também.
 */

type Linha = {
  plataforma: 'instagram' | 'facebook'; id: string; client_id: string; origem: 'organico' | 'anuncio'; post_id: string; post_link: string; post_texto: string; anuncio_nome: string
  parent_id: string | null; autor: string; da_marca: boolean; texto: string; criado_em: string; curtidas: number
}
type ComentarioIG = { id: string; text?: string; username?: string; timestamp: string; like_count?: number; replies?: { data?: ComentarioIG[] } }
type ComentarioFB = { id: string; message?: string; from?: { id: string; name: string }; created_time: string; like_count?: number; comments?: { data?: ComentarioFB[] } }

const CAMPOS_IG = 'id,text,username,timestamp,like_count,replies{id,text,username,timestamp,like_count}'
const CAMPOS_FB = 'id,message,from,created_time,like_count,comments.limit(25){id,message,from,created_time,like_count}'
const corta = (s: string | undefined, n: number) => (s ?? '').replace(/\s+/g, ' ').trim().slice(0, n)

async function paginaDoCliente(paginaId: string): Promise<{ token: string; ig: { id: string; usuario: string } | null }> {
  const p = await graph<{ access_token?: string; instagram_business_account?: { id: string; username: string } }>(paginaId, { params: { fields: 'access_token,instagram_business_account{id,username}' } })
  if (!p.access_token) throw new ErroMeta('Sem acesso à Página do cliente.')
  return { token: p.access_token, ig: p.instagram_business_account ? { id: p.instagram_business_account.id, usuario: p.instagram_business_account.username } : null }
}

function doIG(c: ComentarioIG, base: Omit<Linha, 'id' | 'parent_id' | 'autor' | 'da_marca' | 'texto' | 'criado_em' | 'curtidas' | 'plataforma'>, usuarioMarca: string, pai: string | null): Linha[] {
  const eu: Linha = { ...base, plataforma: 'instagram', id: c.id, parent_id: pai, autor: c.username ?? '', da_marca: !!usuarioMarca && c.username === usuarioMarca, texto: corta(c.text, 8000), criado_em: c.timestamp, curtidas: c.like_count ?? 0 }
  return [eu, ...(c.replies?.data ?? []).flatMap((r) => doIG(r, base, usuarioMarca, c.id))]
}
function doFB(c: ComentarioFB, base: Omit<Linha, 'id' | 'parent_id' | 'autor' | 'da_marca' | 'texto' | 'criado_em' | 'curtidas' | 'plataforma'>, paginaId: string, pai: string | null): Linha[] {
  const eu: Linha = { ...base, plataforma: 'facebook', id: c.id, parent_id: pai, autor: c.from?.name ?? '', da_marca: c.from?.id === paginaId, texto: corta(c.message, 8000), criado_em: c.created_time, curtidas: c.like_count ?? 0 }
  return [eu, ...(c.comments?.data ?? []).flatMap((r) => doFB(r, base, paginaId, c.id))]
}

/** Comentários recentes de um cliente: últimos 15 posts do Instagram e do Facebook e os anúncios ativos do Meta. */
async function comentariosDoCliente(c: { id: string; meta_page_id: string; meta_ad_account_id: string | null }): Promise<Linha[]> {
  const pagina = await paginaDoCliente(c.meta_page_id)
  const linhas: Linha[] = []
  if (pagina.ig) {
    // Posts e comentários numa consulta só (cada consulta à Meta leva quase 1 segundo).
    const midias = await graph<{ data: { id: string; caption?: string; permalink?: string; comments?: { data?: ComentarioIG[] } }[] }>(`${pagina.ig.id}/media`, {
      params: { fields: `id,caption,permalink,comments.limit(50){${CAMPOS_IG}}`, limit: '15' },
    })
    for (const m of midias.data) {
      const base = { client_id: c.id, origem: 'organico' as const, post_id: m.id, post_link: m.permalink ?? '', post_texto: corta(m.caption, 300), anuncio_nome: '' }
      for (const x of m.comments?.data ?? []) linhas.push(...doIG(x, base, pagina.ig.usuario, null))
    }
  }
  const posts = await graph<{ data: { id: string; message?: string; permalink_url?: string; comments?: { data?: ComentarioFB[] } }[] }>(`${c.meta_page_id}/posts`, {
    token: pagina.token, params: { fields: `id,message,permalink_url,comments.limit(50){${CAMPOS_FB}}`, limit: '15' },
  })
  for (const p of posts.data) {
    const base = { client_id: c.id, origem: 'organico' as const, post_id: p.id, post_link: p.permalink_url ?? '', post_texto: corta(p.message, 300), anuncio_nome: '' }
    for (const x of p.comments?.data ?? []) linhas.push(...doFB(x, base, c.meta_page_id, null))
  }
  if (c.meta_ad_account_id) {
    const ads = await graph<{ data: { name?: string; creative?: { effective_object_story_id?: string; effective_instagram_media_id?: string; body?: string } }[] }>(`act_${c.meta_ad_account_id}/ads`, {
      params: { fields: 'name,creative{effective_object_story_id,effective_instagram_media_id,body}', effective_status: '["ACTIVE"]', limit: '40' },
    })
    // Comentários de cada anúncio em paralelo (um anúncio pode repetir o mesmo post: busca uma vez só).
    const vistos = new Set<string>()
    const tarefas: Promise<void>[] = []
    for (const a of ads.data) {
      const base = { client_id: c.id, origem: 'anuncio' as const, post_texto: corta(a.creative?.body, 300), anuncio_nome: corta(a.name, 200) }
      const igm = a.creative?.effective_instagram_media_id
      if (igm && !vistos.has(igm)) {
        vistos.add(igm)
        tarefas.push(graph<{ data: ComentarioIG[] }>(`${igm}/comments`, { params: { fields: CAMPOS_IG, limit: '50' } }).then((r) => {
          for (const x of r.data) linhas.push(...doIG(x, { ...base, post_id: igm, post_link: '' }, pagina.ig?.usuario ?? '', null))
        }, () => {}))
      }
      const story = a.creative?.effective_object_story_id
      if (story && !vistos.has(story) && story.startsWith(`${c.meta_page_id}_`)) {
        vistos.add(story)
        tarefas.push(graph<{ data: ComentarioFB[] }>(`${story}/comments`, { token: pagina.token, params: { fields: CAMPOS_FB, limit: '50' } }).then((r) => {
          for (const x of r.data) linhas.push(...doFB(x, { ...base, post_id: story, post_link: `https://www.facebook.com/${story}` }, c.meta_page_id, null))
        }, () => {}))
      }
    }
    await Promise.all(tarefas)
  }
  return linhas
}

/** A IA da plataforma (se configurada) revê o tom dos comentários novos; em caso de falha, ficam as regras. */
async function refinarComIA(itens: { chave: string; texto: string }[]): Promise<Map<string, { tom: TomComentario; motivo: string }>> {
  const r = new Map<string, { tom: TomComentario; motivo: string }>()
  const config = configIA()
  if (!config || !itens.length) return r
  const lista = itens.slice(0, 60).map((i, n) => `${n + 1}. ${i.texto.slice(0, 400)}`).join('\n')
  try {
    const resp = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.chave}` },
      body: JSON.stringify({
        model: config.modelos[0], temperature: 0, response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: 'Classifique o tom de comentários de redes sociais de empresas brasileiras. Responda só JSON {"r":[{"n":1,"tom":"positivo|neutro|negativo|agressivo","motivo":"até 12 palavras"}]}. agressivo = ofensa, palavrão, ameaça, acusação de golpe/fraude, ataque pessoal. negativo = reclamação, insatisfação, crítica ao produto, preço ou atendimento. neutro = dúvida, marcação de amigo, comentário sem juízo. Ironia conta pelo sentido real.' },
          { role: 'user', content: lista },
        ],
      }),
      signal: AbortSignal.timeout(15_000),
    })
    if (!resp.ok) return r
    const texto = ((await resp.json()) as { choices?: { message?: { content?: string } }[] }).choices?.[0]?.message?.content ?? ''
    const j = JSON.parse(texto.slice(texto.indexOf('{'), texto.lastIndexOf('}') + 1)) as { r?: { n: number; tom: string; motivo?: string }[] }
    for (const x of j.r ?? []) {
      const item = itens[x.n - 1]
      if (item && ['positivo', 'neutro', 'negativo', 'agressivo'].includes(x.tom)) r.set(item.chave, { tom: x.tom as TomComentario, motivo: String(x.motivo ?? '').slice(0, 200) })
    }
  } catch {
    // Sem IA agora: valem as regras.
  }
  return r
}

/**
 * Busca os comentários na Meta e guarda os novos, com o tom. Avisa admin e gestor dos negativos e agressivos.
 * `clienteIds` vazio = todos os clientes ativos com Página no cadastro.
 */
export async function sincronizarComentarios(clienteIds?: string[]): Promise<{ novos: number; alertas: number; erros: string[] }> {
  const admin = criarClienteAdmin()
  let q = admin.from('clients').select('id, name, meta_page_id, meta_ad_account_id').not('meta_page_id', 'is', null).neq('status', 'encerrado').eq('is_internal', false)
  if (clienteIds?.length) q = q.in('id', clienteIds)
  const { data: clientes, error } = await q
  if (error) throw error
  const erros: string[] = []
  let novos = 0
  let alertas = 0
  // Busca na Meta de todos os clientes ao mesmo tempo; depois grava um por um.
  const lidos = await Promise.all(clientes.map((c) => comentariosDoCliente({ id: c.id, meta_page_id: c.meta_page_id!, meta_ad_account_id: c.meta_ad_account_id }).then((linhas) => ({ linhas, erro: null }), (e: unknown) => ({ linhas: [] as Linha[], erro: e instanceof Error ? e.message : 'falha na Meta' }))))
  for (const [i, c] of clientes.entries()) {
    const { linhas, erro } = lidos[i]
    if (erro) {
      erros.push(`${c.name}: ${erro}`)
      continue
    }
    if (!linhas.length) continue
    // Um anúncio pode ser também post orgânico (impulsionado): fica como anúncio.
    const unicos = new Map<string, Linha>()
    for (const l of linhas) {
      const k = `${l.plataforma}:${l.id}`
      if (!unicos.has(k) || l.origem === 'anuncio') unicos.set(k, l)
    }
    const todos = [...unicos.values()]
    const existentes = new Set<string>()
    for (const plataforma of ['instagram', 'facebook'] as const) {
      const ids = todos.filter((l) => l.plataforma === plataforma).map((l) => l.id)
      for (let i = 0; i < ids.length; i += 200) {
        const { data } = await admin.from('social_comments').select('id').eq('plataforma', plataforma).in('id', ids.slice(i, i + 200))
        for (const x of data ?? []) existentes.add(`${plataforma}:${x.id}`)
      }
    }
    const novas = todos.filter((l) => !existentes.has(`${l.plataforma}:${l.id}`))
    const ia = await refinarComIA(novas.filter((l) => !l.da_marca && l.texto).map((l) => ({ chave: `${l.plataforma}:${l.id}`, texto: l.texto })))
    const comTom = novas.map((l) => {
      const tom = l.da_marca ? { tom: 'neutro' as const, motivo: '' } : (ia.get(`${l.plataforma}:${l.id}`) ?? classificarComentario(l.texto))
      // Comentário antigo (mais de 7 dias) entra já lido e resolvido: o alerta é para o que acabou de chegar.
      const antigo = Date.parse(l.criado_em) < Date.now() - 7 * 86_400_000
      return { ...l, ...tom, lido_em: antigo || l.da_marca ? new Date().toISOString() : null, resolvido_em: antigo ? new Date().toISOString() : null }
    })
    for (let i = 0; i < comTom.length; i += 200) {
      const { error: e } = await admin.from('social_comments').insert(comTom.slice(i, i + 200))
      if (e) erros.push(`${c.name}: ${e.message}`)
    }
    novos += comTom.length
    // Respostas da marca marcam o comentário de cima como respondido.
    for (const plataforma of ['instagram', 'facebook'] as const) {
      const pais = [...new Set(todos.filter((l) => l.plataforma === plataforma && l.da_marca && l.parent_id).map((l) => l.parent_id!))]
      if (pais.length) await admin.from('social_comments').update({ respondido_em: new Date().toISOString() }).eq('plataforma', plataforma).in('id', pais).is('respondido_em', null)
    }
    const graves = comTom.filter((l) => !l.da_marca && !l.resolvido_em && ALERTA(l.tom))
    if (graves.length) {
      const { data: gestores } = await admin.from('profiles').select('id').in('role', ['admin', 'gestor']).eq('active', true)
      const avisos = graves.flatMap((g) => (gestores ?? []).map((p) => ({
        user_id: p.id, kind: 'alerta', message: textoDoAlerta({ tom: g.tom, cliente: c.name, plataforma: g.plataforma, origem: g.origem, autor: g.autor, texto: g.texto }),
        link: `/insights?aba=${g.origem === 'anuncio' ? 'anuncios' : 'organico'}&cliente=${c.id}&filtro=alerta`,
      })))
      if (avisos.length) await admin.from('notifications').insert(avisos)
      alertas += graves.length
    }
  }
  return { novos, alertas, erros }
}

// ---------- Tela ----------

export type Comentario = {
  plataforma: 'instagram' | 'facebook'; id: string; clienteId: string; clienteNome: string; origem: 'organico' | 'anuncio'; postId: string; postLink: string; postTexto: string; anuncioNome: string
  autor: string; texto: string; criadoEm: string; curtidas: number; tom: TomComentario; motivo: string; respondidoEm: string | null; oculto: boolean; resolvidoEm: string | null
  respostas: { autor: string; texto: string; criadoEm: string; daMarca: boolean }[]
}
export type FiltroComentarios = 'todos' | 'sem_resposta' | 'alerta' | 'respondidos' | 'ocultos'

/** Comentários (sem as respostas, que vêm dentro de cada um) de uma origem, com filtro. */
export async function listarComentarios(sb: Supabase, f: { origem: 'organico' | 'anuncio'; clienteId?: string | null; filtro: FiltroComentarios }): Promise<Comentario[] | null> {
  let q = sb.from('social_comments').select('plataforma, id, client_id, origem, post_id, post_link, post_texto, anuncio_nome, autor, da_marca, texto, criado_em, curtidas, tom, motivo, respondido_em, oculto, resolvido_em, clients(name)')
    .eq('origem', f.origem).is('parent_id', null).eq('da_marca', false).order('criado_em', { ascending: false }).limit(150)
  if (f.clienteId) q = q.eq('client_id', f.clienteId)
  if (f.filtro === 'sem_resposta') q = q.is('respondido_em', null).eq('oculto', false)
  if (f.filtro === 'alerta') q = q.in('tom', ['negativo', 'agressivo']).is('resolvido_em', null)
  if (f.filtro === 'respondidos') q = q.not('respondido_em', 'is', null)
  if (f.filtro === 'ocultos') q = q.eq('oculto', true)
  const { data, error } = await q
  if (error) return null // sem a migração
  const linhas = data as unknown as { plataforma: 'instagram' | 'facebook'; id: string; client_id: string; origem: 'organico' | 'anuncio'; post_id: string; post_link: string; post_texto: string; anuncio_nome: string; autor: string; texto: string; criado_em: string; curtidas: number; tom: TomComentario; motivo: string; respondido_em: string | null; oculto: boolean; resolvido_em: string | null; clients: { name: string } | null }[]
  const ids = linhas.map((l) => l.id)
  const { data: respostas } = ids.length ? await sb.from('social_comments').select('parent_id, autor, texto, criado_em, da_marca').in('parent_id', ids).order('criado_em') : { data: [] }
  return linhas.map((l) => ({
    plataforma: l.plataforma, id: l.id, clienteId: l.client_id, clienteNome: l.clients?.name ?? '', origem: l.origem, postId: l.post_id, postLink: l.post_link, postTexto: l.post_texto, anuncioNome: l.anuncio_nome,
    autor: l.autor, texto: l.texto, criadoEm: l.criado_em, curtidas: l.curtidas, tom: l.tom, motivo: l.motivo, respondidoEm: l.respondido_em, oculto: l.oculto, resolvidoEm: l.resolvido_em,
    respostas: (respostas ?? []).filter((r) => r.parent_id === l.id).map((r) => ({ autor: r.autor, texto: r.texto, criadoEm: r.criado_em, daMarca: r.da_marca })),
  }))
}

/** Números do topo: sem resposta e alertas abertos, por origem. */
export async function resumoComentarios(sb: Supabase, clienteId?: string | null): Promise<Record<'organico' | 'anuncio', { semResposta: number; alertas: number }> | null> {
  const contar = async (origem: string, extra: (q: ReturnType<typeof base>) => ReturnType<typeof base>) => {
    const r = await extra(base(origem))
    return r.error ? null : (r.count ?? 0)
  }
  const base = (origem: string) => {
    let q = sb.from('social_comments').select('id', { count: 'exact', head: true }).eq('origem', origem).is('parent_id', null).eq('da_marca', false)
    if (clienteId) q = q.eq('client_id', clienteId)
    return q
  }
  const r: Record<string, { semResposta: number; alertas: number }> = {}
  for (const o of ['organico', 'anuncio']) {
    const semResposta = await contar(o, (q) => q.is('respondido_em', null).eq('oculto', false))
    const alertas = await contar(o, (q) => q.in('tom', ['negativo', 'agressivo']).is('resolvido_em', null))
    if (semResposta === null || alertas === null) return null
    r[o] = { semResposta, alertas }
  }
  return r as Record<'organico' | 'anuncio', { semResposta: number; alertas: number }>
}

/** Responde na rede (como a Página/perfil do cliente) e marca como respondido. */
export async function responderComentario(sb: Supabase, euId: string, plataforma: 'instagram' | 'facebook', id: string, texto: string): Promise<void> {
  const { data: c, error } = await sb.from('social_comments').select('client_id, clients(meta_page_id)').eq('plataforma', plataforma).eq('id', id).single()
  if (error) throw error
  const paginaId = (c as unknown as { clients: { meta_page_id: string | null } | null }).clients?.meta_page_id
  if (!paginaId) throw new ErroMeta('O cliente não tem a Página no cadastro.')
  if (plataforma === 'instagram') await graph(`${id}/replies`, { metodo: 'POST', params: { message: texto } })
  else await graph(`${id}/comments`, { metodo: 'POST', token: (await paginaDoCliente(paginaId)).token, params: { message: texto } })
  const { error: e } = await sb.from('social_comments').update({ respondido_em: new Date().toISOString(), respondido_por: euId, resolvido_em: new Date().toISOString(), lido_em: new Date().toISOString() }).eq('plataforma', plataforma).eq('id', id)
  if (e) throw e
}

/** Oculta (ou mostra de novo) o comentário na rede. */
export async function ocultarComentario(sb: Supabase, plataforma: 'instagram' | 'facebook', id: string, ocultar: boolean): Promise<void> {
  const { data: c, error } = await sb.from('social_comments').select('clients(meta_page_id)').eq('plataforma', plataforma).eq('id', id).single()
  if (error) throw error
  const paginaId = (c as unknown as { clients: { meta_page_id: string | null } | null }).clients?.meta_page_id
  if (!paginaId) throw new ErroMeta('O cliente não tem a Página no cadastro.')
  if (plataforma === 'instagram') await graph(id, { metodo: 'POST', params: { hide: String(ocultar) } })
  else await graph(id, { metodo: 'POST', token: (await paginaDoCliente(paginaId)).token, params: { is_hidden: String(ocultar) } })
  const { error: e } = await sb.from('social_comments').update({ oculto: ocultar, ...(ocultar ? { resolvido_em: new Date().toISOString() } : {}) }).eq('plataforma', plataforma).eq('id', id)
  if (e) throw e
}

/** Tira o alerta do comentário (decisão tomada) sem responder nem ocultar. */
export async function resolverComentario(sb: Supabase, plataforma: 'instagram' | 'facebook', id: string): Promise<void> {
  const { error } = await sb.from('social_comments').update({ resolvido_em: new Date().toISOString(), lido_em: new Date().toISOString() }).eq('plataforma', plataforma).eq('id', id)
  if (error) throw error
}
