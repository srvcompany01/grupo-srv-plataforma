import { expect, it } from 'vitest'
import type { Supabase } from '@/infra/supabase/servidor'
import { atualizarTarefa } from '@/servicos/tarefas'

it('atualizar sem nenhum campo (só tag de cliente ou responsáveis) não faz UPDATE vazio nem falha por permissão', async () => {
  const sb = { from: () => { throw new Error('não deveria consultar o banco') } } as unknown as Supabase
  await expect(atualizarTarefa(sb, 'tarefa', {})).resolves.toBeUndefined()
  await expect(atualizarTarefa(sb, 'tarefa', { titulo: undefined, prazo: undefined })).resolves.toBeUndefined()
})

it('com algum campo, grava normalmente', async () => {
  const chamadas: unknown[] = []
  const sb = { from: () => ({ update: (c: unknown) => { chamadas.push(c); return { eq: async () => ({ error: null, count: 1 }) } } }) } as unknown as Supabase
  await atualizarTarefa(sb, 'tarefa', { prioridade: 'alta' })
  expect(chamadas).toHaveLength(1)
})
