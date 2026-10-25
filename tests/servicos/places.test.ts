import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const resposta = (corpo: unknown, status = 200) => new Response(JSON.stringify(corpo), { status, headers: { 'Content-Type': 'application/json' } })
const ids = (de: number, ate: number) => Array.from({ length: ate - de }, (_, i) => ({ id: `place_${String(de + i).padStart(6, '0')}` }))

describe('Places API', () => {
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs() })

  it('geogrid pede só os ids (sem cobrança), pagina até achar o cliente e para', async () => {
    vi.stubEnv('GOOGLE_PLACES_API_KEY', 'chave-teste')
    const chamadas: { campos: string | null; corpo: Record<string, unknown> }[] = []
    vi.stubGlobal('fetch', vi.fn(async (_url: string, init: RequestInit) => {
      const corpo = JSON.parse(String(init.body))
      chamadas.push({ campos: new Headers(init.headers).get('X-Goog-FieldMask'), corpo })
      return corpo.pageToken ? resposta({ places: ids(20, 40), nextPageToken: 't2' }) : resposta({ places: ids(0, 20), nextPageToken: 't1' })
    }))
    const { idsNaBusca } = await import('@/servicos/places')
    const r = await idsNaBusca('joalheria', { lat: -1.45, lng: -48.49 }, 500, 'place_000025')
    expect(r.indexOf('place_000025')).toBe(25)
    expect(chamadas).toHaveLength(2) // achou na 2ª página: não pede a 3ª
    expect(chamadas.every((c) => c.campos === 'places.id,nextPageToken')).toBe(true)
    expect(chamadas[0].corpo).toMatchObject({ textQuery: 'joalheria', languageCode: 'pt-BR', locationBias: { circle: { center: { latitude: -1.45, longitude: -48.49 }, radius: 500 } } })
  })

  it('erros do Google viram mensagem clara; sem chave avisa', async () => {
    const { buscarLugares } = await import('@/servicos/places')
    await expect(buscarLugares('x y z')).rejects.toThrow(/GOOGLE_PLACES_API_KEY/)
    vi.stubEnv('GOOGLE_PLACES_API_KEY', 'chave-teste')
    vi.stubGlobal('fetch', vi.fn(async () => resposta({ error: { message: 'Places API (New) has not been used in project 123 before or it is disabled.', status: 'PERMISSION_DENIED' } }, 403)))
    await expect(buscarLugares('x y z')).rejects.toThrow(/não está ativada/)
  })
})

describe('R2-3: primeira foto do perfil', () => {
  it('ligar o lugar ao cliente grava a foto do dia (o histórico começa na hora)', async () => {
    vi.resetModules()
    vi.stubEnv('GOOGLE_PLACES_API_KEY', 'chave-teste')
    vi.stubGlobal('fetch', vi.fn(async () => resposta({ id: 'ChIJ_teste_123', displayName: { text: 'Aurum' }, rating: 4.9, userRatingCount: 613 })))
    const inseridos: unknown[] = []
    const consulta = (dados: unknown) => {
      const q: Record<string, unknown> = {}
      for (const m of ['select', 'eq', 'order', 'limit', 'lt', 'gte', 'in', 'not', 'neq']) q[m] = () => q
      q.maybeSingle = async () => ({ data: dados, error: null })
      q.insert = async (linha: unknown) => { inseridos.push(linha); return { error: null } }
      q.upsert = async () => ({ error: null })
      q.update = () => ({ eq: async () => ({ error: null, count: 1 }) })
      return q
    }
    vi.doMock('@/infra/supabase/admin', () => ({ criarClienteAdmin: () => ({ from: () => consulta(null) }) }))
    const { definirLugarDoCliente } = await import('@/servicos/places')
    const sb = { from: () => consulta(null) } as never
    await definirLugarDoCliente(sb, 'cliente-1', 'ChIJ_teste_123')
    expect(inseridos).toContainEqual(expect.objectContaining({ client_id: 'cliente-1', nota: 4.9, avaliacoes: 613 }))
  })
})
