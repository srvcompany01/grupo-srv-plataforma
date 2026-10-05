'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getDb } from '@/db/conexao'
import { exigirAdmin } from '@/infra/admin'
import { COOKIE_SESSAO } from '@/infra/sessao'
import { mensagemErro, type Resultado } from '@/lib/erros'
import { buscarCliente, criarCliente, definirAtivo, regenerarToken } from '@/servicos/clientes'
import { criarPost, detalhePost, enviarParaAprovacao, salvarEdicao } from '@/servicos/posts'
import { dataValida, formatoValido, validarCampos } from '@/dominio/campos'
import { validarArquivo } from '@/dominio/midias'
import type { MidiaEntrada, TipoMidia } from '@/dominio/tipos'
import { gerarChave, urlUpload } from '@/infra/r2'

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

export async function acaoNovoPost(clienteId: string, _: Resultado | null, form: FormData): Promise<Resultado> {
  await exigirAdmin()
  let id: string
  try {
    const formato = form.get('formato')
    const dataPrevista = String(form.get('dataPrevista') ?? '')
    if (!formatoValido(formato) || !dataValida(dataPrevista)) {
      return { erro: 'Escolha o formato e uma data válida.' }
    }
    await buscarCliente(await getDb(), clienteId)
    id = await criarPost(await getDb(), clienteId, formato, dataPrevista)
  } catch (e) {
    return { erro: mensagemErro(e) }
  }
  redirect(`/admin/posts/${id}/editar`)
}

export async function acaoPedirUpload(
  postId: string,
  arquivo: { nome: string; tipoMime: string; tamanhoBytes: number },
): Promise<{ chave: string; url: string; tipo: TipoMidia } | { erro: string }> {
  await exigirAdmin()
  try {
    const tipo = validarArquivo(arquivo)
    await detalhePost(await getDb(), postId)
    const chave = gerarChave(postId, arquivo.tipoMime)
    return { chave, tipo, url: await urlUpload(chave, arquivo.tipoMime, arquivo.tamanhoBytes) }
  } catch (e) {
    return { erro: mensagemErro(e) }
  }
}

export async function acaoSalvar(
  postId: string,
  campos: Record<string, unknown>,
  lista: MidiaEntrada[],
  enviar: boolean,
): Promise<Resultado> {
  await exigirAdmin()
  try {
    const db = await getDb()
    await salvarEdicao(db, postId, validarCampos(campos), lista)
    if (enviar) await enviarParaAprovacao(db, postId)
  } catch (e) {
    return { erro: mensagemErro(e) }
  }
  revalidatePath('/admin', 'layout')
  redirect(`/admin/posts/${postId}`)
}
