'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { tentar, type Resultado } from '@/servicos/acao'
import * as estrutura from '@/servicos/estrutura'

async function executar(fn: (sb: Awaited<ReturnType<typeof criarClienteServidor>>) => Promise<unknown>, ok?: string) {
  await exigirEquipe()
  const sb = await criarClienteServidor()
  const r = await tentar(() => fn(sb), ok)
  revalidatePath('/', 'layout')
  return r
}

export async function criarPastaAcao(espacoId: string, nome: string): Promise<Resultado> {
  if (!nome.trim()) return { erro: 'Informe o nome da pasta.' }
  return executar((sb) => estrutura.criarPasta(sb, espacoId, nome.trim()), 'Pasta criada.')
}

/** Campos: nome, clienteId, pastaId (opcional), mes (YYYY-MM, opcional). Abre a lista criada. */
export async function criarListaAcao(espacoId: string, _: Resultado, form: FormData): Promise<Resultado> {
  const nome = String(form.get('nome') ?? '').trim()
  const clienteId = String(form.get('clienteId') ?? '')
  const pastaId = String(form.get('pastaId') ?? '') || null
  const mes = String(form.get('mes') ?? '')
  if (!nome) return { erro: 'Informe o nome da lista.' }
  if (!clienteId) return { erro: 'Escolha o cliente da lista.' }
  if (mes && !/^\d{4}-(0[1-9]|1[0-2])$/.test(mes)) return { erro: 'Mês inválido.' }
  let id = ''
  const r = await executar(async (sb) => {
    id = await estrutura.criarLista(sb, { espacoId, pastaId, clienteId, nome, mes: mes ? `${mes}-01` : null })
  })
  if (r?.erro) return r
  redirect(`/listas/${id}`)
}

export async function renomearAcao(tabela: 'folders' | 'lists', id: string, nome: string): Promise<Resultado> {
  if (!nome.trim()) return { erro: 'Informe o nome.' }
  return executar((sb) => estrutura.renomear(sb, tabela, id, nome.trim()))
}

export async function arquivarAcao(tabela: 'folders' | 'lists', id: string): Promise<Resultado> {
  return executar((sb) => estrutura.arquivar(sb, tabela, id), tabela === 'lists' ? 'Lista arquivada.' : 'Pasta arquivada.')
}
