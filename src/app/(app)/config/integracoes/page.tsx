import { exigirAdmin } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { listarTokens } from '@/servicos/api-tokens'
import { GerenciarTokens } from './GerenciarTokens'

export default async function Integracoes() {
  await exigirAdmin()
  const tokens = await listarTokens(await criarClienteServidor())
  return <GerenciarTokens tokens={tokens} urlMcp={`${process.env.NEXT_PUBLIC_URL_BASE ?? 'https://app.gruposrv.com.br'}/api/mcp`} />
}
