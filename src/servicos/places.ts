import 'server-only'
import { analisarSaude, comparativo, concorrentesDaGrade, gerarGrade, metricasDaGrade, pioraNoGeogrid, PROFUNDIDADE, raioDoVies, type ColunaComparativo, type Grade, type LinhaComparativo, type MetricasGrade, type PerfilPublico, type Ponto, type PontoGrade } from '@/dominio/gmn'
import { criarClienteAdmin } from '@/infra/supabase/admin'
import type { Supabase } from '@/infra/supabase/servidor'
import type { Json } from '@/infra/supabase/tipos'
import type { Cliente } from './clientes-plataforma'

/**
 * Places API (New) do Google com a chave GOOGLE_PLACES_API_KEY: dados públicos dos perfis (sem a API do Business
 * Profile). Custos: a busca do geogrid pede só os ids (SKU "IDs Only", sem cobrança); detalhes e busca com nota
 * ficam em cache (google_places) para caber na cota gratuita mensal.
 */
const API = 'https://places.googleapis.com/v1'
export const placesConfigurado = () => !!process.env.GOOGLE_PLACES_API_KEY

const falha = (message: string) => Object.assign(new Error(message), { code: 'P0001' })

async function places<T>(caminho: string, campos: string, corpo?: unknown): Promise<T> {
  const chave = process.env.GOOGLE_PLACES_API_KEY
  if (!chave) throw falha('Falta a chave da Places API do Google na Vercel (GOOGLE_PLACES_API_KEY).')
  const r = await fetch(`${API}/${caminho}`, {
    method: corpo ? 'POST' : 'GET',
    headers: { 'X-Goog-Api-Key': chave, 'X-Goog-FieldMask': campos, 'Content-Type': 'application/json' },
    body: corpo ? JSON.stringify(corpo) : undefined,
    cache: 'no-store',
  })
  const j = (await r.json().catch(() => ({}))) as T & { error?: { message?: string; status?: string } }
  if (!r.ok || j.error) {
    console.error('Places API', caminho, r.status, j.error)
    const m = j.error?.message ?? ''
    if (/not been used|disabled|SERVICE_DISABLED/i.test(m) || j.error?.status === 'PERMISSION_DENIED') throw falha('A Places API (New) não está ativada no projeto do Google Cloud ou a chave não tem permissão para ela.')
    if (/API key not valid|API_KEY_INVALID/i.test(m)) throw falha('A chave da Places API é inválida (confira GOOGLE_PLACES_API_KEY na Vercel).')
    if (r.status === 429) throw falha('Limite de consultas da Places API atingido. Tente de novo em alguns minutos.')
    throw falha(`O Google recusou a consulta${m ? `: ${m}` : '.'}`)
  }
  return j
}

const pt = { languageCode: 'pt-BR', regionCode: 'BR' }

/** Ids dos lugares na ordem do Google para a busca feita "de dentro" do círculo (até 3 páginas = 60). Sem cobrança. */
export async function idsNaBusca(texto: string, centro: Ponto, raioM: number, paraQuando?: string): Promise<string[]> {
  const ids: string[] = []
  let pagina: string | undefined
  for (let i = 0; i < 3; i++) {
    const r = await places<{ places?: { id: string }[]; nextPageToken?: string }>('places:searchText', 'places.id,nextPageToken', {
      textQuery: texto, ...pt, pageSize: 20, locationBias: { circle: { center: { latitude: centro.lat, longitude: centro.lng }, radius: raioM } }, ...(pagina ? { pageToken: pagina } : {}),
    })
    ids.push(...(r.places ?? []).map((p) => p.id))
    // Achou o cliente (ou acabou a lista): não precisa da página seguinte.
    if (!r.nextPageToken || (paraQuando && ids.includes(paraQuando))) break
    pagina = r.nextPageToken
  }
  return ids.slice(0, PROFUNDIDADE)
}

export type LugarResumo = { id: string; nome: string; endereco: string; nota: number | null; avaliacoes: number; categoria: string | null; site: string | null; telefone: string | null; mapa: string | null; status: string; lat: number | null; lng: number | null }

type Bruto = {
  id: string; displayName?: { text?: string }; formattedAddress?: string; rating?: number; userRatingCount?: number; primaryType?: string; primaryTypeDisplayName?: { text?: string }; types?: string[]
  websiteUri?: string; nationalPhoneNumber?: string; googleMapsUri?: string; businessStatus?: string; location?: { latitude: number; longitude: number }
  regularOpeningHours?: { weekdayDescriptions?: string[] }; photos?: { name: string }[]; editorialSummary?: { text?: string }
  reviews?: { rating?: number; text?: { text?: string }; publishTime?: string; relativePublishTimeDescription?: string; authorAttribution?: { displayName?: string } }[]
}

const resumo = (b: Bruto): LugarResumo => ({
  id: b.id, nome: b.displayName?.text ?? '', endereco: b.formattedAddress ?? '', nota: b.rating ?? null, avaliacoes: b.userRatingCount ?? 0, categoria: b.primaryTypeDisplayName?.text ?? null,
  site: b.websiteUri ?? null, telefone: b.nationalPhoneNumber ?? null, mapa: b.googleMapsUri ?? null, status: b.businessStatus ?? '', lat: b.location?.latitude ?? null, lng: b.location?.longitude ?? null,
})

const CAMPOS_BUSCA = 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.primaryTypeDisplayName,places.websiteUri,places.nationalPhoneNumber,places.googleMapsUri,places.businessStatus,places.location'

/** Busca com nota e contato (para achar o lugar do cliente e para prospecção). Uma página de até 20. */
export async function buscarLugares(texto: string, perto?: { centro: Ponto; raioM: number }): Promise<LugarResumo[]> {
  const r = await places<{ places?: Bruto[] }>('places:searchText', CAMPOS_BUSCA, { textQuery: texto, ...pt, pageSize: 20, ...(perto ? { locationBias: { circle: { center: { latitude: perto.centro.lat, longitude: perto.centro.lng }, radius: perto.raioM } } } : {}) })
  return (r.places ?? []).map(resumo)
}

const CAMPOS_DETALHE = 'id,displayName,formattedAddress,location,rating,userRatingCount,primaryType,primaryTypeDisplayName,types,nationalPhoneNumber,websiteUri,googleMapsUri,businessStatus,regularOpeningHours,photos,editorialSummary,reviews'

export type Detalhes = LugarResumo & { perfil: PerfilPublico; fotos: string[]; horario: string[]; avaliacoesRecentes: { autor: string; nota: number | null; texto: string; quando: string; em: string | null }[]; atualizadoEm: string }

function detalhesDe(b: Bruto, atualizadoEm: string): Detalhes {
  const reviews = b.reviews ?? []
  const ultima = reviews.map((r) => r.publishTime).filter((x): x is string => !!x).sort().pop() ?? null
  return {
    ...resumo(b),
    fotos: (b.photos ?? []).map((f) => f.name),
    horario: b.regularOpeningHours?.weekdayDescriptions ?? [],
    avaliacoesRecentes: reviews.map((r) => ({ autor: r.authorAttribution?.displayName ?? '', nota: r.rating ?? null, texto: r.text?.text ?? '', quando: r.relativePublishTimeDescription ?? '', em: r.publishTime ?? null })),
    perfil: {
      status: b.businessStatus ?? '', nota: b.rating ?? null, avaliacoes: b.userRatingCount ?? 0, fotos: (b.photos ?? []).length, temHorario: !!b.regularOpeningHours?.weekdayDescriptions?.length,
      site: b.websiteUri ?? null, telefone: b.nationalPhoneNumber ?? null, categoriaPrincipal: b.primaryTypeDisplayName?.text ?? null, tipoPrincipal: b.primaryType ?? null, categorias: b.types ?? [], resumo: b.editorialSummary?.text ?? null, ultimaAvaliacaoEm: ultima,
    },
    atualizadoEm,
  }
}

/** Detalhes do lugar, do cache quando é recente (padrão 24 h). */
export async function detalhesDoLugar(sb: Supabase, id: string, maxIdadeHoras = 24): Promise<Detalhes> {
  if (!/^[A-Za-z0-9_-]{10,300}$/.test(id)) throw falha('Id de lugar do Google inválido.')
  const { data: guardado } = await sb.from('google_places').select('dados, atualizado_em').eq('id', id).maybeSingle()
  if (guardado && Date.now() - Date.parse(guardado.atualizado_em) < maxIdadeHoras * 3_600_000 && (guardado.dados as { id?: string }).id) return detalhesDe(guardado.dados as unknown as Bruto, guardado.atualizado_em)
  const b = await places<Bruto>(`places/${encodeURIComponent(id)}?languageCode=pt-BR&regionCode=BR`, CAMPOS_DETALHE)
  const agora = new Date().toISOString()
  await sb.from('google_places').upsert({ id: b.id, nome: b.displayName?.text ?? '', endereco: b.formattedAddress ?? '', nota: b.rating ?? null, avaliacoes: b.userRatingCount ?? null, lat: b.location?.latitude ?? null, lng: b.location?.longitude ?? null, dados: b as unknown as Json, atualizado_em: agora })
  return detalhesDe(b, agora)
}

/** Nome, nota e avaliações de vários lugares (concorrentes do geogrid), com cache de 30 dias. */
export async function resumoDosLugares(sb: Supabase, ids: string[]): Promise<Map<string, LugarResumo>> {
  const r = new Map<string, LugarResumo>()
  await Promise.all(ids.map(async (id) => {
    try {
      r.set(id, await detalhesDoLugar(sb, id, 24 * 30))
    } catch {
      // concorrente que o Google não devolveu: fica sem nome
    }
  }))
  return r
}

// ───────────────────────────── Cliente ─────────────────────────────

/** Primeira foto do dia (nota e avaliações) se a rotina ainda não tirou: o histórico começa no dia em que liga. */
async function garantirFotoDeHoje(clienteId: string, d: Pick<Detalhes, 'nota' | 'avaliacoes'>): Promise<void> {
  const hoje = new Date(Date.now() - 3 * 3_600_000).toISOString().slice(0, 10)
  const admin = criarClienteAdmin()
  const { data } = await admin.from('gmn_snapshots').select('dia').eq('client_id', clienteId).eq('dia', hoje).maybeSingle()
  if (!data) await admin.from('gmn_snapshots').insert({ client_id: clienteId, dia: hoje, nota: d.nota, avaliacoes: d.avaliacoes })
}

export async function definirLugarDoCliente(sb: Supabase, clienteId: string, placeId: string | null): Promise<void> {
  const d = placeId ? await detalhesDoLugar(sb, placeId, 0) : null
  const { error, count } = await sb.from('clients').update({ google_place_id: placeId }, { count: 'exact' }).eq('id', clienteId)
  if (error) throw error
  if (!count) throw { code: '42501' }
  if (d) await garantirFotoDeHoje(clienteId, d).catch((e) => console.error('foto do GMN', e))
}

export async function lugarDoCliente(sb: Supabase, clienteId: string): Promise<string | null> {
  const { data } = await sb.from('clients').select('google_place_id').eq('id', clienteId).maybeSingle()
  return data?.google_place_id ?? null
}

/** Perfil público do cliente com a análise de saúde (comparando com os concorrentes da última varredura). */
export async function saudeDoCliente(sb: Supabase, placeId: string, hoje: string, clienteId: string) {
  const d = await detalhesDoLugar(sb, placeId)
  await garantirFotoDeHoje(clienteId, d).catch((e) => console.error('foto do GMN', e))
  const ultima = (await varreduras(sb, clienteId, 1))[0]
  let concorrentes: { nota: number | null; avaliacoes: number | null } | null = null
  if (ultima) {
    const resumo = await resumoDosLugares(sb, concorrentesDaGrade(ultima.pontos, placeId, 5).map((c) => c.id))
    const lista = [...resumo.values()]
    const mediana = (xs: number[]) => (xs.length ? [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)] : null)
    concorrentes = { nota: mediana(lista.map((l) => l.nota).filter((x): x is number => x !== null)), avaliacoes: mediana(lista.map((l) => l.avaliacoes)) }
  }
  const evolucao = await evolucaoDoPerfil(sb, clienteId)
  return { detalhes: d, evolucao, ...analisarSaude(d.perfil, hoje, concorrentes, evolucao) }
}

// ───────────────────────────── Geogrid ─────────────────────────────

export type Varredura = { id: string; palavra: string; grade: Grade; raioKm: number; centro: Ponto; pontos: PontoGrade[]; metricas: MetricasGrade; em: string }

/** Roda a palavra-chave em cada ponto da grade (busca só com ids, sem cobrança) e guarda a varredura. */
export async function rodarGeogrid(sb: Supabase, cliente: Pick<Cliente, 'id'>, placeId: string, palavra: string, grade: Grade, raioKm: number): Promise<Varredura> {
  const lugar = await detalhesDoLugar(sb, placeId)
  if (lugar.lat === null || lugar.lng === null) throw falha('O Google não devolveu a localização do perfil do cliente.')
  const centro = { lat: lugar.lat, lng: lugar.lng }
  const grid = gerarGrade(centro, grade, raioKm)
  const vies = raioDoVies(grade, raioKm)
  const pontos: PontoGrade[] = new Array(grid.length)
  // ponytail: 6 consultas em paralelo; até 9x9 x 3 páginas cabe nos 300 s da função.
  let proximo = 0
  await Promise.all(Array.from({ length: 6 }, async () => {
    while (proximo < grid.length) {
      const i = proximo++
      const ids = await idsNaBusca(palavra.trim(), grid[i], vies, placeId)
      const pos = ids.indexOf(placeId)
      pontos[i] = { ...grid[i], posicao: pos >= 0 ? pos + 1 : null, top: ids.slice(0, 3) }
    }
  }))
  const metricas = metricasDaGrade(pontos.map((p) => p.posicao))
  const { data: r, error } = await sb.from('gmn_scans').insert({ client_id: cliente.id, palavra: palavra.trim(), grade, raio_km: raioKm, centro_lat: centro.lat, centro_lng: centro.lng, pontos: pontos as unknown as Json, metricas: metricas as unknown as Json }).select('id, created_at').single()
  if (error) throw error
  return { id: r.id, palavra: palavra.trim(), grade, raioKm, centro, pontos, metricas, em: r.created_at }
}

export async function varreduras(sb: Supabase, clienteId: string, limite = 20): Promise<Varredura[]> {
  const { data, error } = await sb.from('gmn_scans').select('id, palavra, grade, raio_km, centro_lat, centro_lng, pontos, metricas, created_at').eq('client_id', clienteId).order('created_at', { ascending: false }).limit(limite)
  if (error) return []
  return data.map((v) => ({ id: v.id, palavra: v.palavra, grade: v.grade as Grade, raioKm: Number(v.raio_km), centro: { lat: v.centro_lat, lng: v.centro_lng }, pontos: v.pontos as unknown as PontoGrade[], metricas: v.metricas as unknown as MetricasGrade, em: v.created_at }))
}

// ───────────────────────────── Foto diária (rotina) ─────────────────────────────

/** Guarda nota e avaliações de cada cliente com lugar ligado; avisa no sino quando chega avaliação nova ou a nota cai. */
export async function fotografarPerfis(hoje: string): Promise<number> {
  const admin = criarClienteAdmin()
  const { data: clientes } = await admin.from('clients').select('id, name, google_place_id').not('google_place_id', 'is', null).neq('status', 'encerrado')
  const { data: gestores } = await admin.from('profiles').select('id').in('role', ['admin', 'gestor']).eq('active', true)
  let feitos = 0
  for (const c of clientes ?? []) {
    try {
      const d = await detalhesDoLugar(admin as unknown as Supabase, c.google_place_id!, 12)
      const { data: antes } = await admin.from('gmn_snapshots').select('nota, avaliacoes').eq('client_id', c.id).lt('dia', hoje).order('dia', { ascending: false }).limit(1).maybeSingle()
      await admin.from('gmn_snapshots').upsert({ client_id: c.id, dia: hoje, nota: d.nota, avaliacoes: d.avaliacoes })
      feitos++
      if (!antes || !gestores?.length) continue
      const novas = d.avaliacoes - (antes.avaliacoes ?? 0)
      const caiu = antes.nota !== null && d.nota !== null && d.nota < Number(antes.nota)
      if (novas > 0 || caiu) {
        const message = `${c.name}: ${novas > 0 ? `${novas} avaliação(ões) nova(s) no Google` : ''}${novas > 0 && caiu ? ' e ' : ''}${caiu ? `nota caiu de ${Number(antes.nota).toLocaleString('pt-BR')} para ${d.nota!.toLocaleString('pt-BR')}` : ''}.`
        await admin.from('notifications').insert(gestores.map((g) => ({ user_id: g.id, kind: 'alerta', message: message.slice(0, 300), link: `/gmn?cliente=${c.id}` })))
      }
    } catch (e) {
      console.error('foto do GMN', c.id, e)
    }
  }
  return feitos
}

export async function evolucaoDoPerfil(sb: Supabase, clienteId: string, dias = 90): Promise<{ dia: string; nota: number | null; avaliacoes: number | null }[]> {
  const desde = new Date(Date.now() - dias * 86_400_000).toISOString().slice(0, 10)
  const { data } = await sb.from('gmn_snapshots').select('dia, nota, avaliacoes').eq('client_id', clienteId).gte('dia', desde).order('dia')
  return (data ?? []).map((s) => ({ dia: s.dia, nota: s.nota === null ? null : Number(s.nota), avaliacoes: s.avaliacoes }))
}

/** Detalhes para a IA: sem o bloco interno da análise e só a quantidade de fotos. */
export const detalhesParaIA = (d: Detalhes) => ({ id: d.id, nome: d.nome, endereco: d.endereco, nota: d.nota, avaliacoes: d.avaliacoes, categoria: d.categoria, site: d.site, telefone: d.telefone, mapa: d.mapa, status: d.status, fotos: d.fotos.length, horario: d.horario, avaliacoesRecentes: d.avaliacoesRecentes, atualizadoEm: d.atualizadoEm })

// ───────────────────────────── Geogrid agendado (toda segunda) ─────────────────────────────

export type Monitor = { palavra: string; grade: Grade; raioKm: number }

export async function monitoresDoCliente(sb: Supabase, clienteId: string): Promise<Monitor[]> {
  const { data, error } = await sb.from('gmn_monitors').select('palavra, grade, raio_km').eq('client_id', clienteId).order('created_at')
  if (error) return []
  return data.map((m) => ({ palavra: m.palavra, grade: m.grade as Grade, raioKm: Number(m.raio_km) }))
}

/** Liga (ou atualiza grade e raio) ou desliga o acompanhamento semanal de uma palavra. */
export async function definirMonitor(sb: Supabase, clienteId: string, m: Monitor, ligado: boolean): Promise<void> {
  const { error } = ligado
    ? await sb.from('gmn_monitors').upsert({ client_id: clienteId, palavra: m.palavra.trim(), grade: m.grade, raio_km: m.raioKm })
    : await sb.from('gmn_monitors').delete().eq('client_id', clienteId).eq('palavra', m.palavra.trim())
  if (error) throw error
}

/** Rotina semanal: roda cada palavra acompanhada e avisa no sino quando a posição piorou em relação à anterior. */
export async function rodarMonitores(): Promise<{ varreduras: number; avisos: number; erros: number }> {
  const admin = criarClienteAdmin()
  const sb = admin as unknown as Supabase
  const { data: mons } = await admin.from('gmn_monitors').select('client_id, palavra, grade, raio_km, clients!inner(name, google_place_id, status)')
  const { data: gestores } = await admin.from('profiles').select('id').in('role', ['admin', 'gestor']).eq('active', true)
  const r = { varreduras: 0, avisos: 0, erros: 0 }
  for (const m of (mons ?? []) as unknown as { client_id: string; palavra: string; grade: number; raio_km: number; clients: { name: string; google_place_id: string | null; status: string } }[]) {
    if (!m.clients.google_place_id || m.clients.status === 'encerrado') continue
    try {
      const anterior = (await varreduras(sb, m.client_id, 30)).find((v) => v.palavra === m.palavra)
      const atual = await rodarGeogrid(sb, { id: m.client_id }, m.clients.google_place_id, m.palavra, m.grade as Grade, Number(m.raio_km))
      r.varreduras++
      const piora = anterior ? pioraNoGeogrid(atual.metricas, anterior.metricas) : null
      if (piora && gestores?.length) {
        await admin.from('notifications').insert(gestores.map((g) => ({ user_id: g.id, kind: 'alerta', message: `${m.clients.name}: no Google, "${m.palavra}" piorou: ${piora}.`.slice(0, 300), link: `/gmn?cliente=${m.client_id}&aba=geogrid&varredura=${atual.id}` })))
        r.avisos++
      }
    } catch (e) {
      console.error('geogrid agendado', m.client_id, m.palavra, e)
      r.erros++
    }
  }
  return r
}

/** Cliente contra os 3 concorrentes mais frequentes no top 3 do último geogrid (null sem varredura). */
export async function comparativoDoCliente(sb: Supabase, cliente: { id: string; nome: string }, placeId: string, perfil: PerfilPublico, saude: number, hoje: string): Promise<{ palavra: string; colunas: string[]; linhas: LinhaComparativo[] } | null> {
  const ultima = (await varreduras(sb, cliente.id, 1))[0]
  if (!ultima) return null
  const ids = concorrentesDaGrade(ultima.pontos, placeId, 3).map((c) => c.id)
  const outros = (await Promise.all(ids.map((id) => detalhesDoLugar(sb, id, 24 * 30).catch(() => null)))).filter((x): x is Detalhes => !!x)
  const colunas: ColunaComparativo[] = [{ nome: cliente.nome, perfil, saude }, ...outros.map((o) => ({ nome: o.nome, perfil: o.perfil, saude: analisarSaude(o.perfil, hoje).nota }))]
  return { palavra: ultima.palavra, colunas: colunas.map((c) => c.nome), linhas: comparativo(colunas) }
}
