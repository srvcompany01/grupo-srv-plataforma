'use server'

import { revalidatePath } from 'next/cache'
import { chaveDeCapaValida, ehDownloadUnsplash, ehImagemUnsplash, validarCapa } from '@/dominio/clientes-galeria'
import { gerarChaveCliente, urlUpload } from '@/infra/r2'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { tentar, type Resultado } from '@/servicos/acao'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function exigirGestao() {
  const eu = await exigirEquipe()
  return eu.papel === 'admin' || eu.papel === 'gestor'
}

function atualizado(id: string) {
  revalidatePath('/clientes')
  revalidatePath(`/clientes/${id}`)
}

async function gravarCapa(id: string, capa: { cover_url: string | null; cover_credit: string | null }, ok: string): Promise<Resultado> {
  if (!UUID.test(id)) return { erro: 'Cliente inválido.' }
  const sb = await criarClienteServidor()
  const r = await tentar(async () => {
    const { error, count } = await sb.from('clients').update(capa, { count: 'exact' }).eq('id', id)
    if (error) throw error
    if (!count) throw { code: '42501' }
  }, ok)
  atualizado(id)
  return r
}

export async function iniciarUploadCapaAcao(clienteId: string, mime: string, tamanho: number): Promise<{ url: string; chave: string } | { erro: string }> {
  if (!(await exigirGestao())) return { erro: 'Sem permissão.' }
  if (!UUID.test(clienteId)) return { erro: 'Cliente inválido.' }
  const erro = validarCapa({ mime, tamanho })
  if (erro) return { erro }
  try {
    const chave = gerarChaveCliente(clienteId, mime)
    return { url: await urlUpload(chave, mime, tamanho), chave }
  } catch (e) {
    console.error(e)
    return { erro: 'Não foi possível preparar o envio da imagem.' }
  }
}

export async function salvarCapaEnviadaAcao(clienteId: string, chave: string): Promise<Resultado> {
  if (!(await exigirGestao())) return { erro: 'Sem permissão.' }
  if (!chaveDeCapaValida(chave, clienteId)) return { erro: 'Imagem inválida.' }
  return gravarCapa(clienteId, { cover_url: chave, cover_credit: null }, 'Capa atualizada.')
}

export async function escolherCapaUnsplashAcao(clienteId: string, foto: { url: string; credito: string; download: string }): Promise<Resultado> {
  if (!(await exigirGestao())) return { erro: 'Sem permissão.' }
  if (!ehImagemUnsplash(foto.url) || !ehDownloadUnsplash(foto.download)) return { erro: 'Imagem inválida.' }
  const r = await gravarCapa(clienteId, { cover_url: foto.url, cover_credit: foto.credito.slice(0, 120) }, 'Capa atualizada.')
  // Exigência da API do Unsplash: registrar o uso da foto.
  const chave = process.env.UNSPLASH_ACCESS_KEY
  if (!r?.erro && chave) await fetch(foto.download, { headers: { Authorization: `Client-ID ${chave}` } }).catch(() => undefined)
  return r
}

export async function removerCapaAcao(clienteId: string): Promise<Resultado> {
  if (!(await exigirGestao())) return { erro: 'Sem permissão.' }
  return gravarCapa(clienteId, { cover_url: null, cover_credit: null }, 'Capa removida.')
}

/** `valores`: campo → texto; vazio apaga o valor daquele campo para o cliente. */
export async function salvarCamposClienteAcao(clienteId: string, valores: Record<string, string>): Promise<Resultado> {
  if (!(await exigirGestao())) return { erro: 'Sem permissão.' }
  if (!UUID.test(clienteId)) return { erro: 'Cliente inválido.' }
  const entradas = Object.entries(valores).filter(([campo]) => UUID.test(campo)).map(([campo, v]) => [campo, v.trim().slice(0, 500)] as const)
  const preenchidos = entradas.filter(([, v]) => v).map(([field_id, value]) => ({ client_id: clienteId, field_id, value }))
  const vazios = entradas.filter(([, v]) => !v).map(([campo]) => campo)
  const sb = await criarClienteServidor()
  const r = await tentar(async () => {
    if (preenchidos.length) {
      const { error } = await sb.from('client_field_values').upsert(preenchidos)
      if (error) throw error
    }
    if (vazios.length) {
      const { error } = await sb.from('client_field_values').delete().eq('client_id', clienteId).in('field_id', vazios)
      if (error) throw error
    }
  }, 'Informações salvas.')
  atualizado(clienteId)
  return r
}
