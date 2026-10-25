'use server'

import { revalidatePath } from 'next/cache'
import { GRADES, type Grade } from '@/dominio/gmn'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { mensagemErro } from '@/dominio/erros-banco'
import { tentar, type Resultado } from '@/servicos/acao'
import { buscarCliente } from '@/servicos/clientes-plataforma'
import * as places from '@/servicos/places'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const erro = (e: unknown) => ({ erro: e instanceof Error && !('code' in e) ? e.message : mensagemErro(e) })

/** Procura o negócio no Google (para ligar o lugar ao cliente). */
export async function buscarLugaresAcao(texto: string): Promise<places.LugarResumo[] | { erro: string }> {
  await exigirEquipe()
  if (texto.trim().length < 3) return { erro: 'Digite o nome do negócio (e a cidade).' }
  try {
    return await places.buscarLugares(texto.trim().slice(0, 120))
  } catch (e) {
    return erro(e)
  }
}

export async function definirLugarAcao(clienteId: string, placeId: string | null): Promise<Resultado> {
  await exigirEquipe()
  if (!UUID.test(clienteId)) return { erro: 'Cliente inválido.' }
  const r = await tentar(async () => places.definirLugarDoCliente(await criarClienteServidor(), clienteId, placeId), placeId ? 'Perfil do Google ligado.' : 'Perfil do Google desligado.')
  revalidatePath('/gmn')
  return r
}

/** Roda o geogrid (busca só com ids: sem cobrança) e devolve o id da varredura. */
export async function rodarGeogridAcao(clienteId: string, palavra: string, grade: number, raioKm: number): Promise<{ id: string } | { erro: string }> {
  await exigirEquipe()
  if (!UUID.test(clienteId)) return { erro: 'Cliente inválido.' }
  if (palavra.trim().length < 2) return { erro: 'Informe a palavra-chave (ex.: joalheria em belém).' }
  if (!GRADES.includes(grade as Grade) || !(raioKm > 0 && raioKm <= 50)) return { erro: 'Grade ou raio inválido.' }
  const sb = await criarClienteServidor()
  const c = await buscarCliente(sb, clienteId)
  if (!c?.googlePlaceId) return { erro: 'Ligue o perfil do Google do cliente primeiro.' }
  try {
    const v = await places.rodarGeogrid(sb, c, c.googlePlaceId, palavra.slice(0, 80), grade as Grade, raioKm)
    revalidatePath('/gmn')
    return { id: v.id }
  } catch (e) {
    return erro(e)
  }
}
