import 'server-only'
import { formatoDoPost, type PostIG, type ResumoInstagram } from '@/dominio/insights'
import type { PeriodoAnuncios } from '@/dominio/periodo-anuncios'
import { ErroMeta, contaDaPagina, graph } from './publicacao-meta'

/**
 * Insights do Instagram profissional do cliente (ligado à Página do Facebook do cadastro), com o token do usuário do
 * sistema do Meta (instagram_manage_insights). A API só aceita janelas de até 30 dias: períodos maiores são somados
 * por janela (o alcance somado conta a mesma pessoa mais de uma vez entre janelas). Cache de 1 hora.
 */
const CACHE = 3600
const DIA = 86_400

/** Janelas de até 30 dias, em segundos Unix, do início de `de` ao fim de `ate` (meia-noite de Belém = 03:00 UTC). */
export function janelas(de: string, ate: string): { since: number; until: number }[] {
  const inicio = Date.parse(`${de}T03:00:00Z`) / 1000
  const fim = Date.parse(`${ate}T03:00:00Z`) / 1000 + DIA
  const r: { since: number; until: number }[] = []
  for (let s = inicio; s < fim; s += 30 * DIA) r.push({ since: s, until: Math.min(s + 30 * DIA, fim) })
  return r
}

type Valor = { name: string; total_value?: { value?: number; breakdowns?: { results?: { dimension_values: string[]; value: number }[] }[] }; values?: { value: number; end_time: string }[] }

const METRICAS = ['reach', 'views', 'accounts_engaged', 'total_interactions', 'likes', 'comments', 'saves', 'shares', 'profile_links_taps']

async function totais(igId: string, j: { since: number; until: number }): Promise<Record<string, number>> {
  const consultar = async (metricas: string[]) => {
    const r = await graph<{ data: Valor[] }>(`${igId}/insights`, { params: { metric: metricas.join(','), metric_type: 'total_value', period: 'day', since: String(j.since), until: String(j.until) }, cacheSeg: CACHE })
    return r.data.map((m): [string, number] => [m.name, m.total_value?.value ?? 0])
  }
  try {
    return Object.fromEntries(await consultar(METRICAS))
  } catch (e) {
    // Uma métrica recusada derruba a consulta inteira: tenta uma a uma e fica com as que vierem.
    const partes = await Promise.allSettled(METRICAS.map((m) => consultar([m])))
    const ok = partes.flatMap((p) => (p.status === 'fulfilled' ? p.value : []))
    if (!ok.length) throw e
    return Object.fromEntries(ok)
  }
}

/** Seguiram − deixaram de seguir na janela (0 se a Meta não entregar). */
async function saldoSeguidores(igId: string, j: { since: number; until: number }): Promise<number> {
  try {
    const r = await graph<{ data: Valor[] }>(`${igId}/insights`, { params: { metric: 'follows_and_unfollows', metric_type: 'total_value', period: 'day', breakdown: 'follow_type', since: String(j.since), until: String(j.until) }, cacheSeg: CACHE })
    const res = r.data[0]?.total_value?.breakdowns?.[0]?.results ?? []
    const v = (t: string) => res.find((x) => x.dimension_values[0] === t)?.value ?? 0
    return v('FOLLOWER') - v('NON_FOLLOWER')
  } catch {
    return 0
  }
}

async function alcanceDiario(igId: string, j: { since: number; until: number }): Promise<{ dia: string; valor: number }[]> {
  const r = await graph<{ data: Valor[] }>(`${igId}/insights`, { params: { metric: 'reach', period: 'day', since: String(j.since), until: String(j.until) }, cacheSeg: CACHE })
  // end_time = fim do dia (fuso da Meta): o dia medido é o anterior.
  return (r.data[0]?.values ?? []).map((v) => ({ dia: new Date(Date.parse(v.end_time) - DIA * 1000).toISOString().slice(0, 10), valor: v.value }))
}

type MidiaBruta = { id: string; caption?: string; media_type?: string; media_product_type?: string; permalink?: string; thumbnail_url?: string; media_url?: string; timestamp: string; like_count?: number; comments_count?: number }

/** Posts do feed no período (até 120), mais novos primeiro. */
async function postsDoPeriodo(igId: string, de: string, ate: string): Promise<MidiaBruta[]> {
  const inicio = Date.parse(`${de}T03:00:00Z`)
  const fim = Date.parse(`${ate}T03:00:00Z`) + DIA * 1000
  const posts: MidiaBruta[] = []
  let depois: string | undefined
  for (let pagina = 0; pagina < 6; pagina++) {
    const r = await graph<{ data: MidiaBruta[]; paging?: { cursors?: { after?: string }; next?: string } }>(`${igId}/media`, {
      params: { fields: 'id,caption,media_type,media_product_type,permalink,thumbnail_url,media_url,timestamp,like_count,comments_count', limit: '50', ...(depois ? { after: depois } : {}) },
      cacheSeg: CACHE,
    })
    for (const m of r.data) if (Date.parse(m.timestamp) >= inicio && Date.parse(m.timestamp) < fim) posts.push(m)
    const ultimo = r.data[r.data.length - 1]
    if (!r.paging?.next || !ultimo || Date.parse(ultimo.timestamp) < inicio || posts.length >= 120) break
    depois = r.paging.cursors?.after
  }
  return posts.slice(0, 120)
}

async function comNumeros(m: MidiaBruta): Promise<PostIG> {
  let n: Record<string, number> = {}
  try {
    const r = await graph<{ data: Valor[] }>(`${m.id}/insights`, { params: { metric: 'reach,views,saved,shares,total_interactions' }, cacheSeg: CACHE })
    n = Object.fromEntries(r.data.map((x) => [x.name, x.values?.[0]?.value ?? x.total_value?.value ?? 0]))
  } catch {
    // Post antigo ou de um tipo sem esse insight: fica com curtidas e comentários.
  }
  const curtidas = m.like_count ?? 0
  const comentarios = m.comments_count ?? 0
  return {
    id: m.id,
    legenda: (m.caption ?? '').trim(),
    formato: formatoDoPost(m.media_type, m.media_product_type),
    link: m.permalink ?? '',
    imagem: m.thumbnail_url ?? (m.media_type === 'VIDEO' ? null : m.media_url ?? null),
    em: m.timestamp,
    curtidas,
    comentarios,
    alcance: n.reach ?? 0,
    visualizacoes: n.views ?? 0,
    salvamentos: n.saved ?? 0,
    compartilhamentos: n.shares ?? 0,
    interacoes: n.total_interactions ?? curtidas + comentarios,
  }
}

const soma = (xs: Record<string, number>[], k: string) => xs.reduce((s, x) => s + (x[k] ?? 0), 0)

/**
 * Resumo do Instagram do cliente no período. `detalhado`: também o alcance por dia e os números de cada post
 * (uma consulta por post); sem ele, só os totais e a contagem de posts (para o panorama de todos os clientes).
 */
export async function instagramDoCliente(paginaId: string, periodo: Pick<PeriodoAnuncios, 'de' | 'ate'>, detalhado: boolean): Promise<ResumoInstagram | { erro: string }> {
  try {
    const conta = await contaDaPagina(paginaId)
    if ('erro' in conta) {
      console.error('Instagram insights: página', paginaId, conta.erro)
      return conta
    }
    if (!conta.instagram) {
      console.error('Instagram insights: página sem Instagram', paginaId, conta.pagina)
      return { erro: `A Página "${conta.pagina}" não tem um Instagram profissional ligado (ou ele não foi liberado para o usuário do sistema do Meta).` }
    }
    const igId = conta.instagram.id
    const js = janelas(periodo.de, periodo.ate)
    const [perfil, tot, saldos, diario, brutos] = await Promise.all([
      graph<{ username: string; followers_count?: number }>(igId, { params: { fields: 'username,followers_count' }, cacheSeg: CACHE }),
      Promise.all(js.map((j) => totais(igId, j))),
      Promise.all(js.map((j) => saldoSeguidores(igId, j))),
      detalhado ? Promise.all(js.map((j) => alcanceDiario(igId, j))) : Promise.resolve([]),
      postsDoPeriodo(igId, periodo.de, periodo.ate),
    ])
    const posts = detalhado
      ? await Promise.all(brutos.slice(0, 40).map(comNumeros))
      : brutos.map(semNumeros)
    return {
      usuario: perfil.username,
      seguidores: perfil.followers_count ?? 0,
      alcance: soma(tot, 'reach'),
      visualizacoes: soma(tot, 'views'),
      interacoes: soma(tot, 'total_interactions'),
      contasEngajadas: soma(tot, 'accounts_engaged'),
      curtidas: soma(tot, 'likes'),
      comentarios: soma(tot, 'comments'),
      salvamentos: soma(tot, 'saves'),
      compartilhamentos: soma(tot, 'shares'),
      cliquesPerfil: soma(tot, 'profile_links_taps'),
      novosSeguidores: saldos.reduce((s, x) => s + x, 0),
      alcancePorDia: diario.flat().filter((d) => d.dia >= periodo.de && d.dia <= periodo.ate),
      posts,
    }
  } catch (e) {
    console.error('Instagram insights', paginaId, e instanceof Error ? e.message : e)
    if (e instanceof ErroMeta) return { erro: /permission|permiss/i.test(e.message) ? `O token do Meta não tem permissão de insights deste Instagram (instagram_manage_insights): ${e.message}` : e.message }
    return { erro: 'Não foi possível falar com o Meta agora. Tente de novo.' }
  }
}

function semNumeros(m: MidiaBruta): PostIG {
  const curtidas = m.like_count ?? 0
  const comentarios = m.comments_count ?? 0
  return { id: m.id, legenda: (m.caption ?? '').trim(), formato: formatoDoPost(m.media_type, m.media_product_type), link: m.permalink ?? '', imagem: null, em: m.timestamp, curtidas, comentarios, alcance: 0, visualizacoes: 0, salvamentos: 0, compartilhamentos: 0, interacoes: curtidas + comentarios }
}
