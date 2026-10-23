import 'server-only'
import { instante, publico, regraGoogle, somarDias, dataLocal, type Compromisso, type Ocorrencia } from '@/dominio/agenda'
import { criarClienteAdmin } from '@/infra/supabase/admin'
import { CAMPOS_COMPROMISSO, paraCompromisso } from './agenda'
import { dados } from './resultado'

/**
 * Vínculo com o Google Agenda. Cada pessoa conecta a própria conta (OAuth) e guardamos o refresh token
 * (tabela fechada, só a chave mestra lê). Os compromissos que a pessoa vê na plataforma vão para o Google dela
 * (e são atualizados/apagados lá); os eventos do Google dela aparecem na agenda, só para leitura.
 */

const API = 'https://www.googleapis.com/calendar/v3/calendars/primary/events'
const ESCOPOS = 'openid email https://www.googleapis.com/auth/calendar.events'
const FUSO = 'America/Belem'

// trim: um espaço ou quebra de linha colado junto na Vercel faz o Google responder "OAuth client was not found".
export const idCliente = () => process.env.GOOGLE_CLIENT_ID?.trim() ?? ''
export const segredoCliente = () => process.env.GOOGLE_CLIENT_SECRET?.trim() ?? ''
export const googleConfigurado = () => !!(idCliente() && segredoCliente())
export const urlDeRetorno = (origem: string) => `${origem}/api/google/retorno`

export function urlDeConsentimento(origem: string, estado: string): string {
  const q = new URLSearchParams({
    client_id: idCliente(), redirect_uri: urlDeRetorno(origem), response_type: 'code', scope: ESCOPOS,
    access_type: 'offline', prompt: 'consent', include_granted_scopes: 'true', state: estado,
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${q}`
}

async function token(corpo: Record<string, string>): Promise<{ access_token: string; refresh_token?: string; id_token?: string }> {
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    body: new URLSearchParams({ client_id: idCliente(), client_secret: segredoCliente(), ...corpo }),
  })
  if (!r.ok) throw new Error(`Google token ${r.status}: ${await r.text()}`)
  return r.json()
}

const acesso = async (refresh: string) => (await token({ grant_type: 'refresh_token', refresh_token: refresh })).access_token

async function google(acessoToken: string, caminho: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${API}${caminho}`, { ...init, headers: { Authorization: `Bearer ${acessoToken}`, 'Content-Type': 'application/json' } })
}

/** Troca o código do OAuth pelo refresh token, guarda o vínculo e já manda os compromissos da pessoa para o Google. */
export async function concluirConexao(userId: string, codigo: string, origem: string): Promise<void> {
  const t = await token({ grant_type: 'authorization_code', code: codigo, redirect_uri: urlDeRetorno(origem) })
  if (!t.refresh_token) throw new Error('O Google não devolveu o refresh token.')
  // O id_token vem direto do endpoint do Google (TLS), então basta ler o e-mail.
  const email = t.id_token ? (JSON.parse(Buffer.from(t.id_token.split('.')[1], 'base64url').toString()).email ?? '') : ''
  const admin = criarClienteAdmin()
  dados(await admin.from('google_calendar_links').upsert({ user_id: userId, email, refresh_token: t.refresh_token }))
  dados(await admin.from('agenda_google_events').delete().eq('user_id', userId)) // conexão nova: recria tudo
  await sincronizarTudoDe(userId)
}

export async function statusGoogle(userId: string): Promise<{ email: string } | null> {
  const { data, error } = await criarClienteAdmin().from('google_calendar_links').select('email').eq('user_id', userId).maybeSingle()
  if (error) throw error
  return data ? { email: data.email } : null
}

/** Tira do Google da pessoa os eventos que a plataforma criou, revoga o acesso e apaga o vínculo. */
export async function desconectarGoogle(userId: string): Promise<void> {
  const admin = criarClienteAdmin()
  const { data: link, error } = await admin.from('google_calendar_links').select('refresh_token').eq('user_id', userId).maybeSingle()
  if (error) throw error
  if (!link) return
  const mapas = dados(await admin.from('agenda_google_events').select('google_event_id').eq('user_id', userId))
  try {
    const a = await acesso(link.refresh_token)
    await Promise.allSettled(mapas.map((m) => google(a, `/${m.google_event_id}`, { method: 'DELETE' })))
  } catch (e) {
    console.error(e) // token já revogado pela pessoa: só apaga o vínculo
  }
  await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(link.refresh_token)}`, { method: 'POST' }).catch(() => null)
  dados(await admin.from('google_calendar_links').delete().eq('user_id', userId))
  dados(await admin.from('agenda_google_events').delete().eq('user_id', userId))
}

function corpoDoEvento(c: Compromisso, extras: string[]) {
  const quando = (iso: string) => (c.diaInteiro ? { date: dataLocal(iso) } : { dateTime: iso, timeZone: FUSO })
  return {
    summary: c.titulo,
    description: [c.descricao, ...extras, 'Compromisso da agenda do Grupo SRV (edite pela plataforma).'].filter(Boolean).join('\n\n'),
    start: quando(c.inicio),
    end: c.diaInteiro ? { date: dataLocal(c.fim) } : quando(c.fim),
    recurrence: regraGoogle(c) ?? [],
    extendedProperties: { private: { srv: c.id } },
  }
}


/**
 * Deixa o Google de cada pessoa igual à plataforma para este compromisso: cria/atualiza para quem vê e apaga de quem
 * deixou de ver (ou de todos, se o compromisso não existe mais). Falha no Google não impede salvar na plataforma.
 */
export async function sincronizarCompromisso(id: string): Promise<void> {
  if (!googleConfigurado()) return
  const admin = criarClienteAdmin()
  const [linha, mapas] = await Promise.all([
    admin.from('agenda_events').select(CAMPOS_COMPROMISSO).eq('id', id).maybeSingle().then(dados),
    admin.from('agenda_google_events').select('user_id, google_event_id').eq('event_id', id).then(dados),
  ])
  const c = linha ? paraCompromisso(linha) : null
  const equipe = c?.visibilidade === 'equipe' ? dados(await admin.from('profiles').select('id').neq('role', 'cliente').eq('active', true)).map((p) => p.id) : []
  const quem = new Set(c ? publico(c, equipe) : [])
  const envolvidos = [...new Set([...quem, ...mapas.map((m) => m.user_id)])]
  if (!envolvidos.length) return
  const links = dados(await admin.from('google_calendar_links').select('user_id, refresh_token').in('user_id', envolvidos))
  if (!links.length) return
  const [cliente, tags, categoria] = await Promise.all([
    c?.clienteId ? admin.from('clients').select('name').eq('id', c.clienteId).then(dados) : [],
    c?.tags.length ? admin.from('agenda_tags').select('name').in('id', c.tags).then(dados) : [],
    c?.categoriaId ? admin.from('agenda_categories').select('name').eq('id', c.categoriaId).then(dados) : [],
  ])
  const extras = [
    categoria.length ? `Categoria: ${categoria[0].name}` : '',
    cliente.length ? `Cliente: ${cliente[0].name}` : '',
    tags.length ? `Tags: ${tags.map((t) => t.name).join(', ')}` : '',
  ]
  const resultados = await Promise.allSettled(links.map(async (l) => {
    const a = await acesso(l.refresh_token)
    const mapa = mapas.find((m) => m.user_id === l.user_id)
    if (!c || !quem.has(l.user_id)) {
      if (mapa) await google(a, `/${mapa.google_event_id}`, { method: 'DELETE' })
      if (mapa && c) dados(await admin.from('agenda_google_events').delete().eq('event_id', id).eq('user_id', l.user_id))
      return
    }
    const corpo = JSON.stringify(corpoDoEvento(c, extras))
    if (mapa) {
      const r = await google(a, `/${mapa.google_event_id}`, { method: 'PUT', body: corpo })
      if (r.ok) return
      if (r.status !== 404 && r.status !== 410) throw new Error(`Google ${r.status}: ${await r.text()}`)
      // a pessoa apagou no Google: cria de novo
    }
    const r = await google(a, '', { method: 'POST', body: corpo })
    if (!r.ok) throw new Error(`Google ${r.status}: ${await r.text()}`)
    const { id: googleId } = (await r.json()) as { id: string }
    dados(await admin.from('agenda_google_events').upsert({ event_id: id, user_id: l.user_id, google_event_id: googleId }))
  }))
  resultados.forEach((r) => r.status === 'rejected' && console.error('Google Agenda:', r.reason))
}

/**
 * Antes de excluir: guarda os eventos já criados no Google (a exclusão apaga o mapa em cascata) e devolve
 * a função que os remove depois que a exclusão deu certo.
 */
export async function prepararExclusaoNoGoogle(id: string): Promise<() => Promise<void>> {
  if (!googleConfigurado()) return async () => {}
  const admin = criarClienteAdmin()
  const mapas = dados(await admin.from('agenda_google_events').select('user_id, google_event_id').eq('event_id', id))
  return async () => {
    if (!mapas.length) return
    const links = dados(await admin.from('google_calendar_links').select('user_id, refresh_token').in('user_id', mapas.map((m) => m.user_id)))
    await Promise.allSettled(links.map(async (l) => {
      const a = await acesso(l.refresh_token)
      await google(a, `/${mapas.find((m) => m.user_id === l.user_id)!.google_event_id}`, { method: 'DELETE' })
    }))
  }
}

/** Ao conectar: manda para o Google todos os compromissos que a pessoa vê e que ainda vão acontecer. */
async function sincronizarTudoDe(userId: string): Promise<void> {
  const admin = criarClienteAdmin()
  const agora = new Date().toISOString()
  const [proprios, meus] = await Promise.all([
    admin.from('agenda_events').select('id').or(`created_by.eq.${userId},visibility.eq.equipe`).or(`repeat.neq.nunca,ends_at.gt.${agora}`).then(dados),
    admin.from('agenda_event_people').select('event_id').eq('user_id', userId).then(dados),
  ])
  const ids = [...new Set([...proprios.map((e) => e.id), ...meus.map((p) => p.event_id)])]
  // ponytail: um compromisso por vez; para equipes grandes, sincronizar só a pessoa que conectou.
  for (const id of ids) await sincronizarCompromisso(id)
}

type EventoGoogle = { id: string; summary?: string; htmlLink: string; start: { date?: string; dateTime?: string }; end: { date?: string; dateTime?: string }; extendedProperties?: { private?: { srv?: string } } }

/** Eventos do Google da pessoa entre os dias `de` e `ate` (sem os que vieram da plataforma). Falha = lista vazia. */
export async function eventosDoGoogle(userId: string, de: string, ate: string): Promise<Ocorrencia[]> {
  if (!googleConfigurado()) return []
  try {
    const { data: link, error } = await criarClienteAdmin().from('google_calendar_links').select('refresh_token').eq('user_id', userId).maybeSingle()
    if (error) throw error
    if (!link) return []
    const q = new URLSearchParams({ timeMin: instante(de).toISOString(), timeMax: instante(somarDias(ate, 1)).toISOString(), singleEvents: 'true', orderBy: 'startTime', maxResults: '250' })
    const r = await google(await acesso(link.refresh_token), `?${q}`)
    if (!r.ok) throw new Error(`Google ${r.status}: ${await r.text()}`)
    const { items } = (await r.json()) as { items: EventoGoogle[] }
    return items
      .filter((e) => !e.extendedProperties?.private?.srv)
      .map((e) => {
        const diaInteiro = !!e.start.date
        return {
          id: `google:${e.id}`,
          titulo: e.summary || '(sem título)',
          inicio: diaInteiro ? instante(e.start.date!).toISOString() : new Date(e.start.dateTime!).toISOString(),
          fim: diaInteiro ? instante(e.end.date!).toISOString() : new Date(e.end.dateTime!).toISOString(),
          diaInteiro,
          google: { link: e.htmlLink },
        }
      })
  } catch (e) {
    console.error(e)
    return []
  }
}
