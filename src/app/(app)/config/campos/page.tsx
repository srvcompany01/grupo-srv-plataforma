import { exigirAdmin } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { dadosGestaoCampos } from '@/servicos/campos-gestao'
import { GerenciarCamposPersonalizados } from './GerenciarCamposPersonalizados'

export default async function CamposPersonalizados() {
  await exigirAdmin()
  const dados = await dadosGestaoCampos(await criarClienteServidor())
  return <GerenciarCamposPersonalizados {...dados} />
}
