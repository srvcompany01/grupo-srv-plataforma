import 'server-only'
import { ROTULO_FORMATO, type Formato } from '@/dominio/conteudo'
import { somarDias } from '@/dominio/agenda'
import { dataDeHoje } from '@/dominio/filtros'
import { classificarPost, lerAnalise, promptAnalise, referenciaDe, type Analise, type MetricasPost, type Nota, type Referencia } from '@/dominio/insights-post'
import { apagarDoGemini, configGemini, enviarAoGemini, gerarJsonGemini } from '@/ia/gemini'
import { urlLeitura } from '@/infra/r2'
import type { Supabase } from '@/infra/supabase/servidor'
import type { Json } from '@/infra/supabase/tipos'
import { instagramDoCliente } from './insights-instagram'
import { graph } from './publicacao-meta'
import { dados } from './resultado'

/**
 * Métricas dos posts publicados pela plataforma (Instagram), quase em tempo real (cache de 5 minutos), e a análise
 * de cada um: nota pela comparação com o próprio perfil e o porquê pela IA (Gemini assiste o vídeo).
 */
const CACHE = 300
const LIMITE_VIDEO = 200 * 1024 * 1024

type Insight = { name: string; values?: { value: number }[]; total_value?: { value: number } }
type Bruto = { like_count?: number; comments_count?: number; insights?: { data: Insight[] } }

const METRICAS_DO_FORMATO = (f: Formato) => (f === 'stories' ? 'reach,views,shares,total_interactions' : f === 'reels' ? 'reach,views,saved,shares,total_interactions,ig_reels_avg_watch_time' : 'reach,views,saved,shares,total_interactions')

function lerMetricas(b: Bruto): MetricasPost {
  const n = Object.fromEntries((b.insights?.data ?? []).map((x) => [x.name, x.values?.[0]?.value ?? x.total_value?.value ?? 0]))
  const curtidas = b.like_count ?? 0
  const comentarios = b.comments_count ?? 0
  return {
    visualizacoes: n.views ?? 0, alcance: n.reach ?? 0, curtidas, comentarios, salvamentos: n.saved ?? 0, compartilhamentos: n.shares ?? 0,
    interacoes: n.total_interactions ?? curtidas + comentarios, tempoMedioSeg: n.ig_reels_avg_watch_time ? n.ig_reels_avg_watch_time / 1000 : null,
  }
}

/** Métricas de vários posts (por id do Instagram), em lotes por formato. Post que a Meta recusar fica de fora. */
export async function metricasDosPosts(itens: { igId: string; formato: Formato }[]): Promise<Map<string, MetricasPost>> {
  const r = new Map<string, MetricasPost>()
  const grupos = new Map<string, string[]>()
  for (const i of itens) grupos.set(METRICAS_DO_FORMATO(i.formato), [...(grupos.get(METRICAS_DO_FORMATO(i.formato)) ?? []), i.igId])
  await Promise.all([...grupos].flatMap(([metricas, ids]) => {
    const lotes: string[][] = []
    for (let i = 0; i < ids.length; i += 25) lotes.push(ids.slice(i, i + 25))
    return lotes.map(async (lote) => {
      const campos = `like_count,comments_count,insights.metric(${metricas})`
      try {
        const res = await graph<Record<string, Bruto>>('', { params: { ids: lote.join(','), fields: campos }, cacheSeg: CACHE })
        for (const [id, b] of Object.entries(res)) r.set(id, lerMetricas(b))
      } catch {
        // Um post do lote recusou (Stories vencido, post apagado): busca um a um.
        await Promise.all(lote.map(async (id) => {
          try {
            r.set(id, lerMetricas(await graph<Bruto>(id, { params: { fields: campos }, cacheSeg: CACHE })))
          } catch {
            // fica sem métricas
          }
        }))
      }
    })
  }))
  return r
}

type PostDoBanco = {
  task_id: string
  format: string
  ig_media_id: string | null
  ig_permalink: string | null
  published_at: string | null
  current_version: number
  tasks: { title: string; clients: { id: string; name: string; meta_page_id: string | null } | null } | null
  content_versions: { number: number; caption: string; content_media: { kind: string; r2_key: string; position: number; size_bytes: number; arquivado_em: string | null }[] }[]
}

async function buscarPost(sb: Supabase, taskId: string): Promise<PostDoBanco> {
  const p = dados(await sb.from('content_posts').select('task_id, format, ig_media_id, ig_permalink, published_at, current_version, tasks!inner(title, clients(id, name, meta_page_id)), content_versions(number, caption, content_media(kind, r2_key, position, size_bytes, arquivado_em))').eq('task_id', taskId).maybeSingle()) as unknown as PostDoBanco | null
  if (!p) throw Object.assign(new Error('Post não encontrado.'), { code: 'P0001' })
  return p
}

/** Mediana dos posts recentes (90 dias) do perfil do cliente, do mesmo tipo quando há pelo menos 3. */
async function referenciaDoPerfil(paginaId: string, igId: string, formato: Formato): Promise<Referencia> {
  const hoje = dataDeHoje(new Date())
  const ig = await instagramDoCliente(paginaId, { de: somarDias(hoje, -90), ate: somarDias(hoje, -1) }, true)
  if ('erro' in ig) return referenciaDe([])
  const outros = ig.posts.filter((p) => p.id !== igId && p.visualizacoes + p.alcance > 0)
  const mesmos = outros.filter((p) => (formato === 'reels' ? p.formato === 'Reels' : p.formato !== 'Reels'))
  return referenciaDe((mesmos.length >= 3 ? mesmos : outros).map((p) => ({ visualizacoes: p.visualizacoes, alcance: p.alcance, curtidas: p.curtidas, comentarios: p.comentarios, salvamentos: p.salvamentos, compartilhamentos: p.compartilhamentos, interacoes: p.interacoes })))
}

export type AnaliseSalva = Analise & { nota: Nota; assistiuVideo: boolean; em: string; metricas: MetricasPost }

export type InsightDoPost = {
  id: string
  titulo: string
  cliente: { id: string; nome: string } | null
  formato: Formato
  link: string | null
  publicadoEm: string | null
  metricas: MetricasPost | null
  referencia: Referencia | null
  nota: Nota | null
  motivos: string[]
  analise: AnaliseSalva | null
  erro: string | null
}

function analiseSalva(r: { nota: string; tipo: string; resumo: string; deu_certo: Json; nao_deu_certo: Json; replicar: Json; evitar: Json; assistiu_video: boolean; analisado_em: string; metricas: Json } | null): AnaliseSalva | null {
  if (!r) return null
  const l = (v: Json) => (Array.isArray(v) ? (v as string[]) : [])
  return { nota: r.nota as Nota, tipo: r.tipo, resumo: r.resumo, deuCerto: l(r.deu_certo), naoDeuCerto: l(r.nao_deu_certo), replicar: l(r.replicar), evitar: l(r.evitar), assistiuVideo: r.assistiu_video, em: r.analisado_em, metricas: r.metricas as unknown as MetricasPost }
}

/** Métricas ao vivo, comparação com o perfil e a última análise da IA. */
export async function insightDoPost(sb: Supabase, taskId: string): Promise<InsightDoPost> {
  const p = await buscarPost(sb, taskId)
  const formato = p.format as Formato
  const salva = await sb.from('post_insights').select('*').eq('task_id', taskId).maybeSingle()
  const base: InsightDoPost = {
    id: p.task_id, titulo: p.tasks?.title ?? '', cliente: p.tasks?.clients ? { id: p.tasks.clients.id, nome: p.tasks.clients.name } : null, formato, link: p.ig_permalink, publicadoEm: p.published_at,
    metricas: null, referencia: null, nota: null, motivos: [], analise: analiseSalva(salva.data), erro: null,
  }
  if (!p.ig_media_id) return { ...base, erro: 'Este post ainda não saiu no Instagram pela plataforma.' }
  const paginaId = p.tasks?.clients?.meta_page_id
  const [m, ref] = await Promise.all([metricasDosPosts([{ igId: p.ig_media_id, formato }]), paginaId ? referenciaDoPerfil(paginaId, p.ig_media_id, formato) : Promise.resolve(referenciaDe([]))])
  const metricas = m.get(p.ig_media_id) ?? null
  if (!metricas) return { ...base, erro: formato === 'stories' ? 'O Instagram só guarda as métricas dos Stories por 24 horas.' : 'O Instagram não devolveu as métricas deste post.' }
  const c = classificarPost(metricas, ref)
  return { ...base, metricas, referencia: ref, nota: c.nota, motivos: c.motivos }
}

/** Arquivo do post para a IA assistir: o do R2 ou, se já foi arquivado, o do próprio Instagram. */
async function midiaParaIA(p: PostDoBanco): Promise<{ bytes: ArrayBuffer; mime: string } | null> {
  const versao = p.content_versions.find((v) => v.number === p.current_version)
  const m = [...(versao?.content_media ?? [])].sort((a, b) => a.position - b.position)[0]
  let url: string | null = null
  let mime = m?.kind === 'video' ? 'video/mp4' : 'image/jpeg'
  if (m && !m.arquivado_em && m.size_bytes <= LIMITE_VIDEO) url = await urlLeitura(m.r2_key)
  else if (p.ig_media_id) {
    const ig = await graph<{ media_url?: string; media_type?: string }>(p.ig_media_id, { params: { fields: 'media_url,media_type' } }).catch(() => null)
    url = ig?.media_url ?? null
    if (ig?.media_type === 'VIDEO') mime = 'video/mp4'
  }
  if (!url) return null
  const r = await fetch(url)
  if (!r.ok || Number(r.headers.get('content-length') ?? 0) > LIMITE_VIDEO) return null
  const tipo = r.headers.get('content-type')
  if (tipo && /^(video|image)\//.test(tipo)) mime = tipo.split(';')[0]
  if (mime === 'video/quicktime') mime = 'video/mov'
  return { bytes: await r.arrayBuffer(), mime }
}

/** Gera (ou refaz) a análise do post com a IA e guarda. */
export async function analisarPost(sb: Supabase, taskId: string): Promise<AnaliseSalva> {
  const cfg = configGemini('ANALISE_POST_MODELO')
  if (!cfg) throw Object.assign(new Error('A análise precisa da chave do Gemini (GEMINI_API_KEY).'), { code: 'P0001' })
  const [p, ins] = await Promise.all([buscarPost(sb, taskId), insightDoPost(sb, taskId)])
  if (!ins.metricas || !ins.nota || !ins.referencia) throw Object.assign(new Error(ins.erro ?? 'Sem métricas para analisar.'), { code: 'P0001' })
  const midia = await midiaParaIA(p).catch(() => null)
  const arquivo = midia ? await enviarAoGemini(cfg.chave, midia.bytes, midia.mime, 'post').catch(() => null) : null
  let a: Analise
  try {
    const legenda = p.content_versions.find((v) => v.number === p.current_version)?.caption ?? ''
    a = await gerarJsonGemini(cfg, arquivo ? { uri: arquivo.uri, mime: midia!.mime } : null, promptAnalise({ cliente: ins.cliente?.nome ?? 'o cliente', formato: ROTULO_FORMATO[ins.formato], legenda, metricas: ins.metricas, ref: ins.referencia, nota: ins.nota, motivos: ins.motivos, temMidia: !!arquivo }), lerAnalise)
  } finally {
    if (arquivo) await apagarDoGemini(cfg.chave, arquivo.nome)
  }
  const linha = { task_id: taskId, nota: ins.nota, tipo: a.tipo, resumo: a.resumo, deu_certo: a.deuCerto, nao_deu_certo: a.naoDeuCerto, replicar: a.replicar, evitar: a.evitar, metricas: ins.metricas as unknown as Json, referencia: ins.referencia as unknown as Json, assistiu_video: !!arquivo, analisado_em: new Date().toISOString() }
  dados(await sb.from('post_insights').upsert(linha).select('task_id'))
  return { ...a, nota: ins.nota, assistiuVideo: !!arquivo, em: linha.analisado_em, metricas: ins.metricas }
}

/** Nota das análises já feitas (para os selos na lista e no Kanban). */
export async function notasDosPosts(sb: Supabase, ids: string[]): Promise<Map<string, Nota>> {
  if (!ids.length) return new Map()
  const { data, error } = await sb.from('post_insights').select('task_id, nota').in('task_id', ids)
  if (error) return new Map()
  return new Map(data.map((r) => [r.task_id, r.nota as Nota]))
}
