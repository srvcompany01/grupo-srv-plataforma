'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { tentar, type Resultado } from '@/servicos/acao'
import { dataDeHoje } from '@/dominio/filtros'
import { ehPlataformaHashtags } from '@/dominio/hashtags'
import { salvarHashtagsDoCliente } from '@/servicos/hashtags-cliente'
import { perfisDoNegocio } from '@/servicos/google-agencia'
import { buscarCliente, contaRepetida, definirPerfilGoogle, lerFormCliente, marcarTrabalhado, novoLinkDoCliente, ordenarGaleria } from '@/servicos/clientes-plataforma'

// Cliente do usuário: a RLS só permite admin e gestores.

export async function criarCliente(_: Resultado, form: FormData): Promise<Resultado> {
  await exigirEquipe()
  const campos = lerFormCliente(form)
  if ('erro' in campos) return { erro: campos.erro }
  if (!campos.name) return { erro: 'Informe o nome do cliente.' }
  const sb = await criarClienteServidor()
  const repetida = await contaRepetida(sb, campos, null)
  if (repetida) return { erro: repetida }
  let id = ''
  const r = await tentar(async () => {
    const { data, error } = await sb.from('clients').insert(campos).select('id').single()
    if (error) throw error
    id = data.id
  })
  if (r?.erro) return r
  revalidatePath('/clientes')
  redirect(`/clientes/${id}`)
}

export async function editarCliente(id: string, _: Resultado, form: FormData): Promise<Resultado> {
  await exigirEquipe()
  const campos = lerFormCliente(form)
  if ('erro' in campos) return { erro: campos.erro }
  if (!campos.name) return { erro: 'Informe o nome do cliente.' }
  const sb = await criarClienteServidor()
  const repetida = await contaRepetida(sb, campos, id)
  if (repetida) return { erro: repetida }
  const r = await tentar(async () => {
    const { error, count } = await sb.from('clients').update(campos, { count: 'exact' }).eq('id', id)
    if (error) throw error
    if (!count) throw { code: '42501' }
  }, 'Cliente atualizado.')
  revalidatePath('/clientes')
  revalidatePath(`/clientes/${id}`)
  return r
}

/** Exclusão definitiva (só admin, pela RLS). Recusada pelo banco se o cliente ainda tem listas, tarefas, documentos ou usuários. */
export async function excluirCliente(id: string): Promise<Resultado> {
  await exigirEquipe()
  const sb = await criarClienteServidor()
  const r = await tentar(async () => {
    const { data, error } = await sb.from('clients').delete().eq('id', id).select('id')
    if (error) throw error
    if (!data.length) throw { code: '42501' }
  }, 'Cliente excluído.')
  revalidatePath('/clientes')
  return r
}

/** Nova ordem da galeria (ids de todos os clientes mostrados, na ordem do arrasto). */
export async function ordenarGaleriaAcao(ids: string[]): Promise<Resultado> {
  await exigirEquipe()
  const unicos = [...new Set(ids)]
  if (unicos.length === 0 || unicos.length > 500 || unicos.some((id) => !/^[0-9a-f-]{36}$/i.test(id))) return { erro: 'Ordem inválida.' }
  const sb = await criarClienteServidor()
  const r = await tentar(() => ordenarGaleria(sb, unicos), 'Ordem salva.')
  revalidatePath('/clientes')
  return r
}

/** "Já trabalhei neste cliente hoje": liga ou desliga a marca do dia (a data é a do servidor, no fuso de Belém; zera sozinha à meia-noite). */
export async function marcarTrabalhadoHojeAcao(clienteId: string, marcado: boolean): Promise<Resultado> {
  const eu = await exigirEquipe()
  if (!/^[0-9a-f-]{36}$/i.test(clienteId)) return { erro: 'Cliente inválido.' }
  const sb = await criarClienteServidor()
  const r = await tentar(() => marcarTrabalhado(sb, eu.id, clienteId, dataDeHoje(new Date()), marcado), marcado ? 'Marcado: você trabalhou neste cliente hoje.' : 'Marca de hoje removida.')
  revalidatePath('/clientes')
  return r
}

/** Novo link do cliente: o anterior para de funcionar na hora. */
export async function novoLinkAcao(clienteId: string): Promise<Resultado> {
  const eu = await exigirEquipe()
  if (eu.papel !== 'admin' && eu.papel !== 'gestor') return { erro: 'Só admin e gestor geram o link.' }
  if (!/^[0-9a-f-]{36}$/i.test(clienteId)) return { erro: 'Cliente inválido.' }
  const sb = await criarClienteServidor()
  const cliente = await buscarCliente(sb, clienteId)
  if (!cliente) return { erro: 'Cliente não encontrado.' }
  const r = await tentar(() => novoLinkDoCliente(sb, clienteId, cliente.nome), 'Link novo gerado. O anterior não funciona mais.')
  revalidatePath(`/clientes/${clienteId}`)
  return r
}

/** Perfis do Google Meu Negócio que a conta da agência gerencia (para ligar ao cliente). */
export async function perfisGoogleAcao(): Promise<{ id: string; nome: string }[] | { erro: string }> {
  const eu = await exigirEquipe()
  if (eu.papel !== 'admin' && eu.papel !== 'gestor') return { erro: 'Só admin e gestor ligam o perfil.' }
  return perfisDoNegocio()
}

/** Liga (ou tira, com null) o perfil do Meu Negócio ao cliente. O perfil precisa estar entre os da agência. */
export async function vincularPerfilGoogleAcao(clienteId: string, perfilId: string | null): Promise<Resultado> {
  const eu = await exigirEquipe()
  if (eu.papel !== 'admin' && eu.papel !== 'gestor') return { erro: 'Só admin e gestor ligam o perfil.' }
  if (!/^[0-9a-f-]{36}$/i.test(clienteId)) return { erro: 'Cliente inválido.' }
  let perfil: { id: string; nome: string } | null = null
  if (perfilId !== null) {
    const perfis = await perfisDoNegocio()
    if ('erro' in perfis) return perfis
    perfil = perfis.find((p) => p.id === perfilId) ?? null
    if (!perfil) return { erro: 'Perfil não encontrado na conta Google da agência.' }
  }
  const sb = await criarClienteServidor()
  const r = await tentar(() => definirPerfilGoogle(sb, clienteId, perfil), perfil ? 'Perfil do Google ligado.' : 'Perfil do Google desligado.')
  revalidatePath(`/clientes/${clienteId}`)
  return r
}

/** Hashtags fixas do cliente numa plataforma: entram sozinhas na legenda quando o post é publicado. */
export async function salvarHashtagsClienteAcao(clienteId: string, plataforma: string, texto: string): Promise<Resultado> {
  await exigirEquipe()
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clienteId) || !ehPlataformaHashtags(plataforma)) return { erro: 'Pedido inválido.' }
  const r = await tentar(async () => void (await salvarHashtagsDoCliente(await criarClienteServidor(), clienteId, plataforma, texto)), 'Hashtags salvas.')
  revalidatePath(`/clientes/${clienteId}`)
  return r
}
