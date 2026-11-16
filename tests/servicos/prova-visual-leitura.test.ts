import { describe, expect, it } from 'vitest'
import { cursorValido, filtroDeCursor } from '@/dominio/limite'
import type { Supabase } from '@/infra/supabase/servidor'
import { lerVersao, paginaDaVersao, revisaoDaTarefa, MAXIMO_DA_VERSAO } from '@/servicos/prova-visual'

type Linha = { id: string; task_id: string; version_id: string; parent_id: string | null; author_kind: string; author_name: string; body: string; media_index: number | null; x_pct: number | null; y_pct: number | null; video_second: number | null; resolved_at: string | null; resolved_by: string | null; created_at: string }

const linha = (i: number, versao: string, extra: Partial<Linha> = {}): Linha => ({
  id: `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`, task_id: 't', version_id: versao, parent_id: null, author_kind: 'cliente', author_name: 'Maria', body: `c${i}`,
  media_index: 0, x_pct: 1, y_pct: 1, video_second: null, resolved_at: null, resolved_by: null, created_at: new Date(Date.UTC(2026, 10, 1) + i * 1000).toISOString().replace('Z', '000+00:00'), ...extra,
})

/** Adaptador em memória: aceita o que o serviço usa (eq, order, limit, or de cursor) e ordena como o banco. Conta as consultas. */
function adaptador(linhas: Linha[], resumo: { version_id: string; version_number: number; total: number; abertos: number; resolvidos: number }[] = []) {
  const consultas: string[] = []
  const cliente = {
    rpc: async (nome: string) => ({ data: nome === 'resumo_prova_visual' ? resumo : [], error: null }),
    from: () => {
      let rows = [...linhas]
      let max = Infinity
      const q: Record<string, unknown> = {}
      q.select = () => q
      q.eq = (col: keyof Linha, v: unknown) => { rows = rows.filter((r) => r[col] === v); return q }
      q.order = () => { rows.sort((a, b) => (a.created_at < b.created_at ? -1 : a.created_at > b.created_at ? 1 : a.id < b.id ? -1 : 1)); return q }
      q.limit = (n: number) => { max = n; return q }
      q.or = (filtro: string) => {
        const m = /^created_at\.gt\.(.+?),and\(created_at\.eq\.(.+?),id\.gt\.(.+)\)$/.exec(filtro)
        if (!m) throw new Error(`filtro inesperado: ${filtro}`)
        consultas.push(filtro)
        rows = rows.filter((r) => r.created_at > m[1] || (r.created_at === m[2] && r.id > m[3]))
        return q
      }
      q.then = (ok: (r: unknown) => unknown) => ok({ data: rows.slice(0, max), error: null })
      return q
    },
  } as unknown as Supabase
  return { cliente, consultas }
}

describe('R2: a versão atual não some atrás do histórico', () => {
  const ANTIGA = 'v1'
  const ATUAL = 'v2'

  it('2000 comentários de versões antigas + 1 da atual: a leitura da versão atual traz o da atual (a reprodução do Vigilante)', async () => {
    const antigos = Array.from({ length: 2000 }, (_, i) => linha(i, ANTIGA))
    const recente = linha(5000, ATUAL, { body: 'o da versão atual' })
    const { cliente } = adaptador([...antigos, recente])
    const { comentarios, truncado } = await lerVersao(cliente, 't', ATUAL)
    expect(comentarios.map((c) => c.texto)).toEqual(['o da versão atual'])
    expect(truncado).toBe(false)
  })

  it('a revisão da tarefa usa o resumo agregado: totais certos e a versão atual inteira, mesmo com histórico maior que o teto', async () => {
    const antigos = Array.from({ length: 2100 }, (_, i) => linha(i, ANTIGA))
    const atuais = Array.from({ length: 5 }, (_, i) => linha(9000 + i, ATUAL, { body: `atual ${i}` }))
    const resumo = [
      { version_id: ATUAL, version_number: 2, total: 5, abertos: 4, resolvidos: 1 },
      { version_id: ANTIGA, version_number: 1, total: 2100, abertos: 2100, resolvidos: 0 },
    ]
    const { cliente } = adaptador([...antigos, ...atuais], resumo)
    const r = await revisaoDaTarefa(cliente, 't')
    expect(r.resumo.map((x) => [x.numero, x.total, x.abertos])).toEqual([[2, 5, 4], [1, 2100, 2100]]) // contagem do banco, não da página
    expect(r.atual.map((c) => c.texto)).toEqual(['atual 0', 'atual 1', 'atual 2', 'atual 3', 'atual 4'])
    expect(r.truncado).toBe(false)
  })

  it('o histórico se pagina sob demanda: cursor devolvido, páginas sem repetir nem pular, e o fim vem com proximo nulo', async () => {
    const todos = Array.from({ length: 450 }, (_, i) => linha(i, ANTIGA))
    const { cliente, consultas } = adaptador(todos)
    const vistos: string[] = []
    let cursor = null as { criadoEm: string; id: string } | null
    let paginas = 0
    do {
      const p = await paginaDaVersao(cliente, 't', ANTIGA, cursor, 200)
      vistos.push(...p.comentarios.map((c) => c.id))
      cursor = p.proximo
      paginas++
    } while (cursor)
    expect(paginas).toBe(3) // 200 + 200 + 50
    expect(vistos).toEqual(todos.map((l) => l.id)) // ordem total, sem repetição nem salto
    expect(consultas).toHaveLength(2) // a primeira página não usa cursor
  })

  it('passou do teto da versão: devolve o que coube e avisa que truncou (nunca em silêncio)', async () => {
    const muitos = Array.from({ length: 450 }, (_, i) => linha(i, ATUAL))
    const { cliente } = adaptador(muitos)
    const r = await lerVersao(cliente, 't', ATUAL, 300)
    expect(r.comentarios).toHaveLength(300)
    expect(r.truncado).toBe(true)
    expect(MAXIMO_DA_VERSAO).toBeGreaterThan(2100) // 100 pontos x (1 + 20 respostas do cliente) cabem
  })
})

describe('cursor vindo do navegador entra num filtro: só formato certo', () => {
  it('aceita timestamp e uuid; recusa qualquer outra coisa, inclusive tentativa de injetar filtro', () => {
    const bom = { criadoEm: '2026-11-24T10:00:00.123456+00:00', id: '00000000-0000-4000-8000-000000000001' }
    expect(cursorValido(bom)).toBe(true)
    expect(cursorValido({ ...bom, criadoEm: '2026-11-24T10:00:00Z' })).toBe(true)
    for (const ruim of [null, 'x', {}, { ...bom, id: 'abc' }, { ...bom, criadoEm: '2026-11-24),or(id.gt.0' }, { ...bom, criadoEm: 7 }, { criadoEm: bom.criadoEm }]) expect(cursorValido(ruim)).toBe(false)
    expect(() => filtroDeCursor({ criadoEm: 'x,id.gt.0', id: bom.id })).toThrow(/Cursor inválido/)
    expect(filtroDeCursor(bom)).toContain(`id.gt.${bom.id}`)
  })
})
