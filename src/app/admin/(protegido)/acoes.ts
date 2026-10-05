'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getDb } from '@/db/conexao'
import { exigirAdmin } from '@/infra/admin'
import { COOKIE_SESSAO } from '@/infra/sessao'
import { mensagemErro, type Resultado } from '@/lib/erros'
import { criarCliente, definirAtivo, regenerarToken } from '@/servicos/clientes'

// Toda action começa com exigirAdmin(): o layout protege a renderização, não as actions.

export async function sair() {
  ;(await cookies()).delete(COOKIE_SESSAO)
  redirect('/admin/login')
}

export async function acaoCriarCliente(_: Resultado | null, form: FormData): Promise<Resultado> {
  await exigirAdmin()
  try {
    await criarCliente(await getDb(), String(form.get('nome') ?? ''))
  } catch (e) {
    return { erro: mensagemErro(e) }
  }
  revalidatePath('/admin')
  return { ok: true }
}

export async function acaoRegenerarToken(clienteId: string) {
  await exigirAdmin()
  await regenerarToken(await getDb(), clienteId)
  revalidatePath('/admin')
}

export async function acaoDefinirAtivo(clienteId: string, ativo: boolean) {
  await exigirAdmin()
  await definirAtivo(await getDb(), clienteId, ativo)
  revalidatePath('/admin')
}
