import { expect, it, vi } from 'vitest'
import type { Supabase } from '@/infra/supabase/servidor'

vi.mock('server-only', () => ({}))

const admin: { cliente?: unknown } = {}
vi.mock('@/infra/supabase/admin', () => ({ criarClienteAdmin: () => admin.cliente }))

function montar(post: unknown) {
  const inseridos: unknown[] = []
  const tabela = (nome: string) => {
    const q: Record<string, unknown> = {}
    const cadeia = () => q
    for (const m of ['select', 'eq', 'neq', 'is', 'order']) q[m] = cadeia
    q.maybeSingle = async () => ({ data: nome === 'content_posts' ? post : null, error: null })
    q.single = async () => ({ data: nome === 'content_versions' ? { id: 'v1' } : { created_by: null, task_assignees: [] }, error: null })
    q.insert = async (v: unknown) => { inseridos.push([nome, v]); return { data: null, error: null } }
    // A versão tem uma imagem e um vídeo.
    q.then = (ok: (r: unknown) => unknown) => ok({ data: nome === 'content_media' ? [{ kind: 'imagem', arquivado_em: null }, { kind: 'video', arquivado_em: null }] : null, error: null })
    return q
  }
  admin.cliente = { from: tabela }
  return inseridos
}

it('o cliente não comenta numa versão já respondida nem num post de outro cliente', async () => {
  const { comentarComoCliente } = await import('@/servicos/prova-visual-portal')
  const entrada = { texto: 'Trocar a cor', nome: 'Maria', midia: 0, x: 10, y: 20, segundo: null }
  montar({ task_id: 't', approval: 'aprovado', current_version: 1 })
  await expect(comentarComoCliente('c1', 't', entrada)).rejects.toThrow(/só para leitura/)
  montar(null) // o post não é deste cliente: a consulta filtrada não acha nada
  await expect(comentarComoCliente('outro', 't', entrada)).rejects.toThrow(/não encontrado/)
})

it('valida o comentário antes de tocar no banco e grava na versão atual com o nome limpo', async () => {
  const { comentarComoCliente } = await import('@/servicos/prova-visual-portal')
  const inseridos = montar({ task_id: 't', approval: 'aguardando', current_version: 2 })
  await expect(comentarComoCliente('c1', 't', { texto: ' ', nome: 'Maria', midia: null, x: null, y: null, segundo: null })).rejects.toThrow(/Escreva/)
  await comentarComoCliente('c1', 't', { texto: ' Logo cortado ', nome: ' Maria ', midia: 1, x: 12.5, y: 80, segundo: null })
  expect(inseridos[0]).toEqual(['content_review_comments', expect.objectContaining({ task_id: 't', version_id: 'v1', author_kind: 'cliente', author_name: 'Maria', body: 'Logo cortado', media_index: 1, x_pct: 12.5, y_pct: 80, parent_id: null })])
})

it('a agência só tem resposta e resolução (não existe criar marcação)', async () => {
  const servico = await import('@/servicos/prova-visual')
  expect(Object.keys(servico).sort()).toEqual(['CAMPOS_PROVA', 'MAXIMO_DE_LEITURA', 'PAGINA_DE_LEITURA', 'abertosPorTarefa', 'comentariosDoPost', 'lerComentarios', 'paraComentario', 'resolverComentario', 'responderComentario'])
  const sb = { from: () => ({ insert: async () => ({ data: null, error: null }) }) } as unknown as Supabase
  await expect(servico.responderComentario(sb, { id: 'a', versaoId: 'b', tarefaId: 'c' }, '  ')).rejects.toThrow(/Escreva/)
})

/** Banco de mentira com encadeamento livre: cada tabela devolve o que o teste configurou e registra os insert/update. */
function bancoLivre(config: Record<string, { unico?: unknown; contagem?: number; lista?: unknown[] }>) {
  const gravacoes: [string, string, unknown][] = []
  const tabela = (nome: string) => {
    const c = config[nome] ?? {}
    const q: Record<string, unknown> = {}
    for (const m of ['select', 'eq', 'neq', 'is', 'like', 'gte', 'order', 'limit']) q[m] = () => q
    q.maybeSingle = async () => ({ data: c.unico ?? null, error: null })
    q.single = async () => ({ data: c.unico ?? null, error: null })
    q.insert = async (v: unknown) => { gravacoes.push([nome, 'insert', v]); return { data: null, error: null } }
    q.update = (v: unknown) => { gravacoes.push([nome, 'update', v]); return { eq: async () => ({ data: null, error: null }) } }
    q.then = (ok: (r: unknown) => unknown) => ok({ data: c.lista ?? null, error: null, count: c.contagem ?? 0 })
    return q
  }
  admin.cliente = { from: tabela }
  return gravacoes
}

it('aviso agrupado: o primeiro comentário cria o aviso; os seguintes na mesma meia hora só atualizam o mesmo', async () => {
  const { comentarComoCliente } = await import('@/servicos/prova-visual-portal')
  const entrada = { texto: 'Logo cortado', nome: 'Maria', midia: 0, x: 10, y: 20, segundo: null }
  const base = { content_posts: { unico: { task_id: 't', approval: 'aguardando', current_version: 1 } }, content_versions: { unico: { id: 'v1' } }, tasks: { unico: { created_by: 'u1', task_assignees: [] } }, content_media: { lista: [{ kind: 'imagem', arquivado_em: null }] } }
  const primeiro = bancoLivre({ ...base, comments: { unico: null } })
  await comentarComoCliente('c1', 't', entrada)
  expect(primeiro.filter(([t]) => t === 'comments')).toEqual([['comments', 'insert', expect.objectContaining({ body: expect.stringContaining('comentou na prova visual') })]])
  const segundo = bancoLivre({ ...base, comments: { unico: { id: 'aviso1', created_at: '2026-11-24T10:00:00Z' } }, content_review_comments: { contagem: 3 } })
  await comentarComoCliente('c1', 't', entrada)
  const avisos = segundo.filter(([t]) => t === 'comments')
  expect(avisos).toEqual([['comments', 'update', { body: expect.stringContaining('fez 3 comentários') }]]) // um aviso só, atualizado
})

it('resposta do cliente a um comentário não gera aviso novo', async () => {
  const { comentarComoCliente } = await import('@/servicos/prova-visual-portal')
  const g = bancoLivre({ content_posts: { unico: { task_id: 't', approval: 'aguardando', current_version: 1 } }, content_versions: { unico: { id: 'v1' } }, content_review_comments: { unico: { id: 'pai' } } })
  await comentarComoCliente('c1', 't', { texto: 'ok', nome: 'Maria', midia: null, x: null, y: null, segundo: null, paiId: '00000000-0000-4000-8000-000000000009' })
  expect(g.filter(([t]) => t === 'comments')).toEqual([])
})

it('B1: numa versão com uma imagem, mídia 49 e instante 100 são recusados antes de gravar', async () => {
  const { comentarComoCliente } = await import('@/servicos/prova-visual-portal')
  const base = { content_posts: { unico: { task_id: 't', approval: 'aguardando', current_version: 1 } }, content_versions: { unico: { id: 'v1' } } }
  const g = bancoLivre({ ...base, content_media: { lista: [{ kind: 'imagem', arquivado_em: null }] } })
  await expect(comentarComoCliente('c1', 't', { texto: 'x', nome: 'Maria', midia: 49, x: 10, y: 10, segundo: null })).rejects.toThrow(/não existe/)
  await expect(comentarComoCliente('c1', 't', { texto: 'x', nome: 'Maria', midia: 0, x: null, y: null, segundo: 100 })).rejects.toThrow(/só vale para vídeo/)
  expect(g.filter(([t]) => t === 'content_review_comments')).toEqual([])
  await comentarComoCliente('c1', 't', { texto: 'x', nome: 'Maria', midia: 0, x: 10, y: 10, segundo: null })
  expect(g.filter(([t]) => t === 'content_review_comments')).toHaveLength(1)
})
