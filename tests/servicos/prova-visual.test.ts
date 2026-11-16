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
  expect(Object.keys(servico).sort()).toEqual(['CAMPOS_PROVA', 'abertosPorTarefa', 'comentariosDoPost', 'paraComentario', 'resolverComentario', 'responderComentario'])
  const sb = { from: () => ({ insert: async () => ({ data: null, error: null }) }) } as unknown as Supabase
  await expect(servico.responderComentario(sb, { id: 'a', versaoId: 'b', tarefaId: 'c' }, '  ')).rejects.toThrow(/Escreva/)
})
