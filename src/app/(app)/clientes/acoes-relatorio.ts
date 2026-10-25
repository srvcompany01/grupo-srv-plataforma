'use server'

import { revalidatePath } from 'next/cache'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { mensagemErro } from '@/dominio/erros-banco'
import { buscarCliente } from '@/servicos/clientes-plataforma'
import { gerarRelatorio } from '@/servicos/relatorio-compartilhado'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const DATA = /^\d{4}-\d{2}-\d{2}$/

/** Gera o relatório do período para mandar ao cliente: link público, texto e link do WhatsApp. */
export async function gerarRelatorioAcao(clienteId: string, de: string, ate: string, mostrarInvestimento: boolean): Promise<{ url: string; texto: string; whatsapp: string } | { erro: string }> {
  await exigirEquipe()
  if (!UUID.test(clienteId) || !DATA.test(de) || !DATA.test(ate) || ate < de) return { erro: 'Período inválido.' }
  if (Date.parse(ate) - Date.parse(de) > 400 * 86_400_000) return { erro: 'Período de até 400 dias.' }
  const sb = await criarClienteServidor()
  const c = await buscarCliente(sb, clienteId)
  if (!c) return { erro: 'Cliente não encontrado.' }
  try {
    const r = await gerarRelatorio(sb, c, { de, ate }, { mostrarInvestimento })
    revalidatePath(`/clientes/${clienteId}`)
    return { url: r.url, texto: r.texto, whatsapp: r.whatsapp }
  } catch (e) {
    console.error(e)
    return { erro: mensagemErro(e) }
  }
}
