import 'server-only'
import { consultaCampanhas, intervaloNegocio, lerCampanha, lerMetricasNegocio, type Campanha, type CampanhaBruta, type MetricasNegocio, type SerieBruta } from '@/dominio/google'
import { criarClienteAdmin } from '@/infra/supabase/admin'
import { dados } from './resultado'
import { idCliente, segredoCliente, urlDeRetorno } from './google-agenda'

/**
 * Conta Google da AGÊNCIA (uma só): acessa a MCC do Google Ads e os perfis do Meu Negócio dos clientes.
 * O admin conecta pelo mesmo app OAuth do Google Agenda (mesmo endereço de retorno). O refresh token fica na
 * tabela fechada google_agency_link. Google Ads precisa do número da MCC (GOOGLE_ADS_LOGIN_CUSTOMER_ID); o nível de
 * acesso (Básico) é do projeto do Google Cloud. O developer token foi descontinuado em 09/2026: se existir, ainda vai
 * (o Google ignora) até as versões novas recusarem; aí basta apagar GOOGLE_ADS_DEVELOPER_TOKEN.
 */

const ESCOPOS = 'openid email https://www.googleapis.com/auth/adwords https://www.googleapis.com/auth/business.manage'
// Versões do Google Ads valem ~1 ano: atualize quando o Google avisar o fim desta.
const ADS = 'https://googleads.googleapis.com/v26'

export class ErroGoogle extends Error {}

export function urlConsentimentoAgencia(origem: string, estado: string): string {
  const q = new URLSearchParams({
    client_id: idCliente(), redirect_uri: urlDeRetorno(origem), response_type: 'code', scope: ESCOPOS,
    access_type: 'offline', prompt: 'consent', state: estado,
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${q}`
}

async function token(corpo: Record<string, string>): Promise<{ access_token: string; expires_in?: number; refresh_token?: string; id_token?: string }> {
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    body: new URLSearchParams({ client_id: idCliente(), client_secret: segredoCliente(), ...corpo }),
  })
  if (!r.ok) {
    console.error('Google token', r.status, await r.text())
    throw new ErroGoogle('A conexão com o Google da agência expirou ou foi revogada. Conecte de novo em Anúncios.')
  }
  return r.json()
}

export async function concluirConexaoAgencia(userId: string, codigo: string, origem: string): Promise<void> {
  const t = await token({ grant_type: 'authorization_code', code: codigo, redirect_uri: urlDeRetorno(origem) })
  if (!t.refresh_token) throw new Error('O Google não devolveu o refresh token.')
  const email = t.id_token ? (JSON.parse(Buffer.from(t.id_token.split('.')[1], 'base64url').toString()).email ?? '') : ''
  dados(await criarClienteAdmin().from('google_agency_link').upsert({ id: true, email, refresh_token: t.refresh_token, connected_by: userId, connected_at: new Date().toISOString() }))
  cache = null
}

export type SituacaoGoogle = { conectado: false } | { conectado: true; email: string; adsPronto: boolean }

/** Se a conta da agência está conectada e se o Google Ads tem developer token e MCC. */
export async function situacaoGoogle(): Promise<SituacaoGoogle> {
  const { data, error } = await criarClienteAdmin().from('google_agency_link').select('email').maybeSingle()
  if (error || !data) return { conectado: false }
  return { conectado: true, email: data.email, adsPronto: !!process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID }
}

export async function desconectarAgencia(): Promise<void> {
  const admin = criarClienteAdmin()
  const { data } = await admin.from('google_agency_link').select('refresh_token').maybeSingle()
  if (data) await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(data.refresh_token)}`, { method: 'POST' }).catch(() => null)
  dados(await admin.from('google_agency_link').delete().eq('id', true))
  cache = null
}

// Token de acesso guardado na memória da instância até perto de vencer (vale 1 hora).
let cache: { token: string; ate: number } | null = null
async function acesso(): Promise<string> {
  if (cache && cache.ate > Date.now()) return cache.token
  const { data } = await criarClienteAdmin().from('google_agency_link').select('refresh_token').maybeSingle()
  if (!data) throw new ErroGoogle('A conta Google da agência não está conectada (Anúncios → Conectar Google).')
  const t = await token({ grant_type: 'refresh_token', refresh_token: data.refresh_token })
  cache = { token: t.access_token, ate: Date.now() + ((t.expires_in ?? 3600) - 120) * 1000 }
  return t.access_token
}

type Opcoes = { metodo?: 'GET' | 'POST'; corpo?: unknown; cabecalhos?: Record<string, string>; cacheSeg?: number }
async function google<T>(url: string, o: Opcoes = {}): Promise<T> {
  const r = await fetch(url, {
    method: o.metodo ?? 'GET',
    headers: { Authorization: `Bearer ${await acesso()}`, 'Content-Type': 'application/json', ...o.cabecalhos },
    body: o.corpo === undefined ? undefined : JSON.stringify(o.corpo),
    ...(o.cacheSeg ? { next: { revalidate: o.cacheSeg } } : { cache: 'no-store' as const }),
  })
  const texto = await r.text()
  const corpo = texto ? JSON.parse(texto) : {}
  if (!r.ok) {
    console.error('Google API', url, r.status, texto.slice(0, 2000))
    throw new ErroGoogle(mensagemDoGoogle(r.status, corpo))
  }
  return corpo as T
}

function mensagemDoGoogle(status: number, corpo: { error?: { message?: string; status?: string; details?: { errors?: { errorCode?: Record<string, string>; message?: string }[] }[] } }): string {
  const e = corpo.error
  const codigoAds = e?.details?.[0]?.errors?.[0]?.errorCode
  if (codigoAds?.authorizationError === 'DEVELOPER_TOKEN_NOT_APPROVED' || /access level|basic access|test account/i.test(e?.message ?? '')) return 'O projeto do Google Cloud ainda não tem o acesso Básico ao Google Ads API (peça na página Google Ads API do Cloud Console, depois da verificação da marca).'
  if (codigoAds?.authorizationError === 'USER_PERMISSION_DENIED') return 'A conta Google da agência não tem acesso a esta conta do Google Ads (ela está ligada à MCC?).'
  if (status === 403 && /has not been used|is disabled/i.test(e?.message ?? '')) return 'Esta API do Google não está ativada no projeto do Google Cloud (ative-a e tente de novo).'
  if (status === 429) return 'Limite de consultas do Google atingido. Tente de novo em alguns minutos (no Meu Negócio, a cota começa em 0 até o Google aprovar o acesso).'
  if (status === 401) return 'A conexão com o Google da agência expirou. Conecte de novo em Anúncios.'
  if (status === 403) return `O Google recusou o acesso${e?.message ? `: ${e.message}` : '.'}`
  return `O Google recusou a consulta${e?.message ? `: ${e.message}` : '.'}`
}

const cabecalhosAds = () => {
  const dev = process.env.GOOGLE_ADS_DEVELOPER_TOKEN
  const mcc = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID?.replace(/\D/g, '')
  if (!mcc) throw new ErroGoogle('Falta o número da MCC do Google Ads na Vercel (GOOGLE_ADS_LOGIN_CUSTOMER_ID).')
  return { 'login-customer-id': mcc, ...(dev ? { 'developer-token': dev } : {}) }
}

const comErro = async <T>(fn: () => Promise<T>): Promise<T | { erro: string }> => {
  try {
    return await fn()
  } catch (e) {
    if (e instanceof ErroGoogle) return { erro: e.message }
    console.error(e)
    return { erro: 'Não foi possível falar com o Google agora. Tente de novo.' }
  }
}

/** Campanhas ativas da conta com os números do período (cache de 30 min). */
export function campanhasGoogle(contaId: string, dias: 7 | 30): Promise<{ campanhas: Campanha[]; moeda: string } | { erro: string }> {
  return comErro(async () => {
    const r = await google<{ results?: (CampanhaBruta & { customer?: { currencyCode?: string } })[] }>(`${ADS}/customers/${contaId}/googleAds:search`, {
      metodo: 'POST', cabecalhos: cabecalhosAds(), corpo: { query: consultaCampanhas(dias).replace('SELECT ', 'SELECT customer.currency_code, ') }, cacheSeg: 1800,
    })
    const linhas = r.results ?? []
    return { campanhas: linhas.map(lerCampanha), moeda: linhas[0]?.customer?.currencyCode ?? 'BRL' }
  })
}

/** Contas de clientes debaixo da MCC (para escolher no cadastro do cliente). */
export function contasDaMcc(): Promise<{ id: string; nome: string }[] | { erro: string }> {
  return comErro(async () => {
    const cab = cabecalhosAds()
    const r = await google<{ results?: { customerClient?: { id?: string; descriptiveName?: string; manager?: boolean } }[] }>(`${ADS}/customers/${cab['login-customer-id']}/googleAds:search`, {
      metodo: 'POST', cabecalhos: cab, corpo: { query: 'SELECT customer_client.id, customer_client.descriptive_name, customer_client.manager FROM customer_client WHERE customer_client.status = \'ENABLED\'' }, cacheSeg: 600,
    })
    return (r.results ?? []).filter((x) => x.customerClient?.id && !x.customerClient.manager).map((x) => ({ id: String(x.customerClient!.id), nome: x.customerClient!.descriptiveName || String(x.customerClient!.id) })).sort((a, b) => a.nome.localeCompare(b.nome))
  })
}

/** Perfis do Meu Negócio que a conta da agência gerencia: accounts/…/locations/… + nome. */
export function perfisDoNegocio(): Promise<{ id: string; nome: string }[] | { erro: string }> {
  return comErro(async () => {
    const contas = await google<{ accounts?: { name: string }[] }>('https://mybusinessaccountmanagement.googleapis.com/v1/accounts?pageSize=20', { cacheSeg: 600 })
    const perfis: { id: string; nome: string }[] = []
    for (const conta of contas.accounts ?? []) {
      let pagina: string | undefined
      do {
        const q = new URLSearchParams({ readMask: 'name,title,storefrontAddress', pageSize: '100', ...(pagina ? { pageToken: pagina } : {}) })
        const r = await google<{ locations?: { name: string; title?: string; storefrontAddress?: { locality?: string } }[]; nextPageToken?: string }>(`https://mybusinessbusinessinformation.googleapis.com/v1/${conta.name}/locations?${q}`, { cacheSeg: 600 })
        for (const l of r.locations ?? []) perfis.push({ id: `${conta.name}/${l.name}`, nome: [l.title, l.storefrontAddress?.locality].filter(Boolean).join(' · ') || l.name })
        pagina = r.nextPageToken
      } while (pagina)
    }
    return [...new Map(perfis.map((p) => [p.id.split('/locations/')[1], p])).values()].sort((a, b) => a.nome.localeCompare(b.nome))
  })
}

/** Números do perfil entre duas datas (AAAA-MM-DD). Cache de 1 hora. */
export function metricasDoNegocio(perfil: string, de: string, ate: string): Promise<MetricasNegocio | { erro: string }> {
  return comErro(async () => {
    const local = perfil.slice(perfil.indexOf('locations/'))
    const q = new URLSearchParams(intervaloNegocio(de, ate))
    return lerMetricasNegocio(await google<SerieBruta>(`https://businessprofileperformance.googleapis.com/v1/${local}:fetchMultiDailyMetricsTimeSeries?${q}`, { cacheSeg: 3600 }))
  })
}

/** Publica um post "Novidade" no perfil (texto + 1 foto). Erros saem como ErroGoogle. */
export async function publicarNoNegocio(perfil: string, texto: string, fotoUrl: string): Promise<{ id: string; link: string | null }> {
  const r = await google<{ name: string; searchUrl?: string }>(`https://mybusiness.googleapis.com/v4/${perfil}/localPosts`, {
    metodo: 'POST',
    corpo: { languageCode: 'pt-BR', topicType: 'STANDARD', summary: texto, media: [{ mediaFormat: 'PHOTO', sourceUrl: fotoUrl }] },
  })
  return { id: r.name, link: r.searchUrl ?? null }
}
