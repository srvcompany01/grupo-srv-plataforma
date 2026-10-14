'use server'

import { revalidatePath } from 'next/cache'
import { FORMATOS, type Formato } from '@/dominio/conteudo'
import { TIPOS_ACEITOS, TAMANHO_MAXIMO } from '@/dominio/midias'
import type { TipoMidia } from '@/dominio/tipos'
import { gerarChaveConteudo, urlUpload } from '@/infra/r2'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { tentar, type Resultado } from '@/servicos/acao'
import * as conteudo from '@/servicos/conteudo'

// Ações do pipeline de conteúdo. Tudo pelo cliente do usuário: a RLS e as regras do banco decidem.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const DATA = /^\d{4}-\d{2}-\d{2}$/

async function executar(fn: (sb: Awaited<ReturnType<typeof criarClienteServidor>>) => Promise<unknown>, ok?: string) {
  await exigirEquipe()
  const sb = await criarClienteServidor()
  const r = await tentar(() => fn(sb), ok)
  revalidatePath('/', 'layout')
  return r
}

export async function criarPostAcao(e: { listaId: string; clienteId: string; titulo: string; formato: string; dataPrevista: string }): Promise<Resultado & { id?: string }> {
  if (!UUID.test(e.listaId) || !UUID.test(e.clienteId)) return { erro: 'Escolha o cliente.' }
  if (!e.titulo.trim()) return { erro: 'Informe o título do post.' }
  if (!(FORMATOS as readonly string[]).includes(e.formato)) return { erro: 'Escolha o formato.' }
  if (!DATA.test(e.dataPrevista)) return { erro: 'Informe a data prevista.' }
  let id: string | undefined
  const r = await executar(async (sb) => {
    id = await conteudo.criarPost(sb, { listaId: e.listaId, clienteId: e.clienteId, titulo: e.titulo.trim(), formato: e.formato as Formato, dataPrevista: e.dataPrevista })
  }, 'Post criado.')
  return { ...(r ?? {}), id: r?.erro ? undefined : id }
}

export async function salvarConteudoAcao(tarefaId: string, t: { ideia: string; objetivo: string; legenda: string }): Promise<Resultado & { versao?: number }> {
  if (!UUID.test(tarefaId)) return { erro: 'Post inválido.' }
  let versao: number | undefined
  const r = await executar(async (sb) => {
    versao = await conteudo.salvarTexto(sb, tarefaId, t)
  }, 'Conteúdo salvo.')
  return { ...(r ?? {}), versao: r?.erro ? undefined : versao }
}

/** Passo 1 do upload: valida tipo e tamanho e devolve a URL assinada do R2 e a chave a registrar depois. */
export async function prepararEnvioMidiaAcao(tarefaId: string, a: { nome: string; mime: string; tamanho: number }): Promise<{ chave: string; url: string } | { erro: string }> {
  await exigirEquipe()
  if (!UUID.test(tarefaId)) return { erro: 'Post inválido.' }
  if (!TIPOS_ACEITOS[a.mime]) return { erro: 'Formato não aceito. Use JPG, PNG, WEBP, MP4 ou MOV.' }
  if (!Number.isInteger(a.tamanho) || a.tamanho < 1) return { erro: 'Arquivo vazio.' }
  if (a.tamanho > TAMANHO_MAXIMO) return { erro: 'Arquivo acima de 1 GB.' }
  try {
    const sb = await criarClienteServidor()
    if (!(await conteudo.buscarConteudo(sb, tarefaId))) return { erro: 'Você não tem permissão para isso.' }
    const chave = gerarChaveConteudo(tarefaId, a.mime)
    return { chave, url: await urlUpload(chave, a.mime, a.tamanho) }
  } catch (e) {
    console.error(e)
    return { erro: 'Não foi possível preparar o envio. Tente de novo.' }
  }
}

/** Passo 2 do upload: depois de o arquivo estar no R2, grava a mídia na versão atual do post. */
export async function registrarMidiaAcao(tarefaId: string, m: { chave: string; tipo: TipoMidia; nome: string; tamanho: number }): Promise<Resultado> {
  if (!UUID.test(tarefaId)) return { erro: 'Post inválido.' }
  return executar((sb) => conteudo.registrarMidia(sb, tarefaId, m), 'Mídia adicionada.')
}

export async function removerMidiaAcao(midiaId: string): Promise<Resultado> {
  if (!UUID.test(midiaId)) return { erro: 'Mídia inválida.' }
  return executar((sb) => conteudo.removerMidia(sb, midiaId), 'Mídia removida.')
}
