import 'server-only'
import type { Aprovacao, Formato } from '@/dominio/conteudo'
import { formatoDaMidiaPublicada, formatoPublicado, fotoParaGoogle, planoInstagram, prontoParaPublicar, validarPublicacao, type Alvo, type MidiaPublicavel, type ModoPublicacao, type PlanoInstagram, type StatusPublicacao } from '@/dominio/publicacao'
import { urlLeitura } from '@/infra/r2'
import { ErroGoogle, publicarNoNegocio } from './google-agencia'
import { criarClienteAdmin } from '@/infra/supabase/admin'
import type { Database } from '@/infra/supabase/tipos'

/**
 * Publicação dos posts de conteúdo no Instagram e no Facebook pela API da Meta, com o token do usuário do sistema
 * (META_ACCESS_TOKEN: pages_manage_posts, instagram_content_publish). Roda no servidor, pela rotina /api/cron/publicar
 * ou no "Publicar agora"; usa a chave mestra porque não há pessoa logada na rotina.
 */
const GRAPH = `https://graph.facebook.com/${process.env.META_API_VERSION || 'v23.0'}`

export class ErroMeta extends Error {}

export async function graph<T = Record<string, unknown>>(caminho: string, opcoes: { token?: string; params?: Record<string, string>; metodo?: 'GET' | 'POST'; cacheSeg?: number } = {}): Promise<T> {
  const token = opcoes.token ?? process.env.META_ACCESS_TOKEN
  if (!token) throw new ErroMeta('A integração com o Meta não está configurada (META_ACCESS_TOKEN).')
  const params = new URLSearchParams({ ...opcoes.params, access_token: token })
  const r = opcoes.metodo === 'POST'
    ? await fetch(`${GRAPH}/${caminho}`, { method: 'POST', body: params, cache: 'no-store' })
    : await fetch(`${GRAPH}/${caminho}?${params}`, opcoes.cacheSeg ? { next: { revalidate: opcoes.cacheSeg } } : { cache: 'no-store' })
  const corpo = (await r.json()) as T & { error?: { code?: number; message?: string; error_user_msg?: string } }
  if (corpo.error) {
    const e = corpo.error
    const motivo = e.error_user_msg || e.message || 'erro desconhecido'
    if (e.code === 190) throw new ErroMeta('O token do Meta expirou ou foi revogado.')
    if ((e.code === 10 || e.code === 200) && /pages_read_engagement|Page Public|pages_show_list|instagram/i.test(motivo)) throw new ErroMeta('O usuário do sistema do Meta não tem acesso a esta Página. No Gerenciador de Negócios: Configurações do negócio → Usuários do sistema → seu usuário → Atribuir ativos → Páginas (e Contas do Instagram) → escolha a Página do cliente com controle total.')
    if (e.code === 10 || e.code === 200) throw new ErroMeta(`Sem permissão na conta do cliente: ${motivo}`)
    throw new ErroMeta(motivo)
  }
  return corpo
}

/** Página e Instagram ligados (para mostrar na tela). Cache de 1 hora. */
export async function contaDaPagina(paginaId: string): Promise<{ pagina: string; instagram: { id: string; usuario: string } | null } | { erro: string }> {
  try {
    const p = await graph<{ name: string; instagram_business_account?: { id: string; username: string } }>(paginaId, { params: { fields: 'name,instagram_business_account{id,username}' }, cacheSeg: 3600 })
    return { pagina: p.name, instagram: p.instagram_business_account ? { id: p.instagram_business_account.id, usuario: p.instagram_business_account.username } : null }
  } catch (e) {
    return { erro: e instanceof Error ? e.message : 'Não foi possível consultar a Página.' }
  }
}

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Espera o container do Instagram ficar pronto (vídeos levam um tempo). */
async function esperarContainer(id: string, limiteMs: number): Promise<'FINISHED' | 'IN_PROGRESS'> {
  const fim = Date.now() + limiteMs
  for (;;) {
    const c = await graph<{ status_code?: string; status?: string }>(id, { params: { fields: 'status_code,status' } })
    if (c.status_code === 'FINISHED' || c.status_code === 'PUBLISHED') return 'FINISHED'
    if (c.status_code === 'ERROR' || c.status_code === 'EXPIRED') throw new ErroMeta(`O Instagram recusou a mídia (${c.status ?? c.status_code}). Confira formato, proporção e duração.`)
    if (Date.now() > fim) return 'IN_PROGRESS'
    await esperar(5000)
  }
}

const parametrosDaMidia = (m: MidiaPublicavel & { url: string }): Record<string, string> => (m.tipo === 'video' ? { media_type: 'VIDEO', video_url: m.url } : { image_url: m.url })

/**
 * Cria e publica no Instagram. Se o vídeo ainda está processando, devolve o container para continuar na próxima
 * rodada (sem recriar). Stories: cada mídia vira um story.
 */
async function publicarInstagram(igId: string, plano: PlanoInstagram, midias: (MidiaPublicavel & { url: string })[], legenda: string, containerSalvo: string | null, collabs: string[]): Promise<{ id: string; permalink: string | null; formato: Formato } | { pendente: string }> {
  const publicar = async (container: string) => {
    const { id } = await graph<{ id: string }>(`${igId}/media_publish`, { metodo: 'POST', params: { creation_id: container } })
    const detalhes = await graph<{ permalink?: string; media_type?: string; media_product_type?: string }>(id, { params: { fields: 'permalink,media_type,media_product_type' } }).catch(() => ({ permalink: undefined, media_type: undefined, media_product_type: undefined }))
    return { id, permalink: detalhes.permalink ?? null, formato: formatoDaMidiaPublicada(detalhes.media_type, detalhes.media_product_type, formatoPublicado(plano)) }
  }
  if (plano.tipo === 'STORIES') {
    let primeiro: { id: string; permalink: string | null; formato: Formato } | null = null
    for (const m of midias) {
      const { id } = await graph<{ id: string }>(`${igId}/media`, { metodo: 'POST', params: { media_type: 'STORIES', ...(m.tipo === 'video' ? { video_url: m.url } : { image_url: m.url }) } })
      if ((await esperarContainer(id, 120_000)) !== 'FINISHED') throw new ErroMeta('O vídeo do story demorou demais para processar. Tente de novo.')
      primeiro ??= await publicar(id)
    }
    return primeiro!
  }
  // Collab: os convidados recebem o convite no app do Instagram (feed, Reels e carrossel; Stories não aceitam).
  const collab: Record<string, string> = collabs.length ? { collaborators: JSON.stringify(collabs) } : {}
  let container = containerSalvo
  if (!container) {
    if (plano.tipo === 'IMAGE') {
      container = (await graph<{ id: string }>(`${igId}/media`, { metodo: 'POST', params: { image_url: midias[0].url, caption: legenda, ...collab } })).id
    } else if (plano.tipo === 'REELS') {
      container = (await graph<{ id: string }>(`${igId}/media`, { metodo: 'POST', params: { media_type: 'REELS', video_url: midias[0].url, caption: legenda, share_to_feed: 'true', ...collab } })).id
    } else {
      const filhos: string[] = []
      for (const m of midias) {
        const { id } = await graph<{ id: string }>(`${igId}/media`, { metodo: 'POST', params: { ...parametrosDaMidia(m), is_carousel_item: 'true' } })
        if ((await esperarContainer(id, 120_000)) !== 'FINISHED') throw new ErroMeta('Um vídeo do carrossel demorou demais para processar. Tente de novo.')
        filhos.push(id)
      }
      container = (await graph<{ id: string }>(`${igId}/media`, { metodo: 'POST', params: { media_type: 'CAROUSEL', children: filhos.join(','), caption: legenda, ...collab } })).id
    }
  }
  if ((await esperarContainer(container, 90_000)) !== 'FINISHED') return { pendente: container }
  return publicar(container)
}

const linkCompleto = (u: string | undefined) => (u ? (u.startsWith('http') ? u : `https://www.facebook.com${u}`) : null)

/** Publica na Página do Facebook (com o token da Página). */
async function publicarFacebook(paginaId: string, midias: (MidiaPublicavel & { url: string })[], legenda: string): Promise<{ id: string; permalink: string | null }> {
  const { access_token: token } = await graph<{ access_token?: string }>(paginaId, { params: { fields: 'access_token' } })
  if (!token) throw new ErroMeta('O usuário do sistema não tem acesso de publicação a esta Página.')
  let postId: string
  if (midias[0].tipo === 'video') {
    postId = (await graph<{ id: string }>(`${paginaId}/videos`, { token, metodo: 'POST', params: { file_url: midias[0].url, description: legenda } })).id
  } else if (midias.length === 1) {
    const r = await graph<{ id: string; post_id?: string }>(`${paginaId}/photos`, { token, metodo: 'POST', params: { url: midias[0].url, message: legenda } })
    postId = r.post_id ?? r.id
  } else {
    const fotos: string[] = []
    for (const m of midias) fotos.push((await graph<{ id: string }>(`${paginaId}/photos`, { token, metodo: 'POST', params: { url: m.url, published: 'false' } })).id)
    postId = (await graph<{ id: string }>(`${paginaId}/feed`, { token, metodo: 'POST', params: { message: legenda, attached_media: JSON.stringify(fotos.map((media_fbid) => ({ media_fbid }))) } })).id
  }
  const { permalink_url } = await graph<{ permalink_url?: string }>(postId, { token, params: { fields: 'permalink_url' } }).catch(() => ({ permalink_url: undefined }))
  return { id: postId, permalink: linkCompleto(permalink_url) }
}

type PostCompleto = {
  task_id: string; format: string; approval: string; current_version: number
  publish_at: string | null; publish_targets: string[]; publish_mode: string; publish_status: string
  ig_container_id: string | null; ig_media_id: string | null; fb_post_id: string | null; collaborators: string[] | null
  content_versions: { number: number; caption: string; content_media: { kind: string; r2_key: string; original_name: string; position: number; arquivado_em: string | null }[] }[]
  gbp_post_name: string | null
  tasks: { clients: { meta_page_id: string | null; google_location: string | null } | null } | null
}

/**
 * Publica um post (se estiver pronto): trava, publica em cada rede que falta, grava o resultado.
 * `forcar` = "Publicar agora" (ignora o horário, mas não a aprovação do modo aprovação).
 */
export async function publicarPost(taskId: string, opcoes: { forcar?: boolean } = {}): Promise<{ status: StatusPublicacao; erro?: string }> {
  const admin = criarClienteAdmin()
  const agora = new Date()
  // Trava: só uma execução por post (a trava expira em 10 minutos se algo cair no meio).
  const { data: travado } = await admin
    .from('content_posts')
    .update({ publish_lock_at: agora.toISOString(), publish_status: 'publicando' })
    .eq('task_id', taskId)
    .in('publish_status', ['agendado', 'publicando'])
    .or(`publish_lock_at.is.null,publish_lock_at.lt.${new Date(agora.getTime() - 10 * 60_000).toISOString()}`)
    .select('task_id')
  if (!travado?.length) return { status: 'publicando', erro: 'Este post já está sendo publicado ou não está agendado.' }

  const salvar = (campos: Database['public']['Tables']['content_posts']['Update']) => admin.from('content_posts').update(campos).eq('task_id', taskId)
  try {
    const { data, error } = await admin
      .from('content_posts')
      .select('task_id, format, approval, current_version, publish_at, publish_targets, publish_mode, publish_status, ig_container_id, ig_media_id, fb_post_id, gbp_post_name, collaborators, content_versions(number, caption, content_media(kind, r2_key, original_name, position, arquivado_em)), tasks(clients(meta_page_id, google_location))')
      .eq('task_id', taskId)
      .single()
    if (error) throw error
    const p = data as unknown as PostCompleto
    const pronto = prontoParaPublicar({ status: 'agendado', em: opcoes.forcar ? agora.toISOString() : p.publish_at, modo: p.publish_mode as ModoPublicacao, aprovacao: p.approval as Aprovacao }, agora)
    if (!pronto) {
      await salvar({ publish_status: 'agendado', publish_lock_at: null })
      return { status: 'agendado' }
    }
    const versao = p.content_versions.find((v) => v.number === p.current_version)
    if (versao?.content_media.some((m) => m.arquivado_em)) throw new ErroMeta('As mídias deste post já foram arquivadas pelo ciclo de renovação (prazo vencido). Suba as mídias de novo numa versão nova.')
    const midias: MidiaPublicavel[] = [...(versao?.content_media ?? [])].sort((a, b) => a.position - b.position).map((m) => ({ tipo: m.kind as 'imagem' | 'video', nome: m.original_name, chave: m.r2_key }))
    const alvos = p.publish_targets as Alvo[]
    const collabs = p.collaborators ?? []
    const invalido = validarPublicacao(p.format as Formato, alvos, midias, collabs)
    if (invalido) throw new ErroMeta(invalido)
    const paginaId = p.tasks?.clients?.meta_page_id
    if (!paginaId && alvos.some((a) => a !== 'google')) throw new ErroMeta('O cliente não tem a Página do Facebook no cadastro (campo "Biblioteca de anúncios do Meta").')
    const comUrl = await Promise.all(midias.map(async (m) => ({ ...m, url: await urlLeitura(m.chave) })))
    const legenda = versao?.caption ?? ''

    if (alvos.includes('instagram') && !p.ig_media_id) {
      const conta = await graph<{ instagram_business_account?: { id: string } }>(paginaId!, { params: { fields: 'instagram_business_account' } })
      const igId = conta.instagram_business_account?.id
      if (!igId) throw new ErroMeta('A Página do cliente não tem um Instagram profissional ligado (ou ele não foi atribuído ao usuário do sistema).')
      const plano = planoInstagram(p.format as Formato, midias)
      const r = await publicarInstagram(igId, plano, comUrl, legenda, p.ig_container_id, collabs)
      if ('pendente' in r) {
        await salvar({ ig_container_id: r.pendente, publish_lock_at: null })
        return { status: 'publicando' }
      }
      await salvar({ ig_media_id: r.id, ig_permalink: r.permalink, ig_container_id: null, format: r.formato })
    }
    if (alvos.includes('facebook') && !p.fb_post_id) {
      const r = await publicarFacebook(paginaId!, comUrl, legenda)
      await salvar({ fb_post_id: r.id, fb_permalink: r.permalink })
    }
    if (alvos.includes('google') && !p.gbp_post_name) {
      const perfil = p.tasks?.clients?.google_location
      if (!perfil) throw new ErroMeta('O cliente não tem o perfil do Google Meu Negócio ligado.')
      const r = await publicarNoNegocio(perfil, legenda, fotoParaGoogle(comUrl)!.url)
      await salvar({ gbp_post_name: r.id, gbp_link: r.link })
    }
    await salvar({ publish_status: 'publicado', published_at: new Date().toISOString(), publish_error: null, publish_lock_at: null })
    return { status: 'publicado' }
  } catch (e) {
    console.error('Publicação Meta', taskId, e)
    const erro = e instanceof ErroMeta ? e.message : e instanceof ErroGoogle ? `Google Meu Negócio: ${e.message}` : 'Erro inesperado ao publicar.'
    await salvar({ publish_status: 'falhou', publish_error: erro, publish_lock_at: null, ig_container_id: null })
    return { status: 'falhou', erro }
  }
}

/** Rotina: publica os posts vencidos (até `limite` por rodada, os mais antigos primeiro). */
export async function publicarVencidos(limite = 5): Promise<{ id: string; status: StatusPublicacao; erro?: string }[]> {
  const admin = criarClienteAdmin()
  const { data, error } = await admin
    .from('content_posts')
    .select('task_id, approval, publish_mode, publish_status, publish_at')
    .in('publish_status', ['agendado', 'publicando'])
    .lte('publish_at', new Date().toISOString())
    .order('publish_at')
    .limit(50)
  if (error) throw error
  const agora = new Date()
  const prontos = data.filter((p) => prontoParaPublicar({ status: p.publish_status as StatusPublicacao, em: p.publish_at, modo: p.publish_mode as ModoPublicacao, aprovacao: p.approval as Aprovacao }, agora)).slice(0, limite)
  const resultados = []
  for (const p of prontos) resultados.push({ id: p.task_id, ...(await publicarPost(p.task_id)) })
  return resultados
}
