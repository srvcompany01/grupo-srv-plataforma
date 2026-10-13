import { exigirAdmin } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { dadosFormularios } from '@/servicos/formularios'
import { GerenciarFormularios } from './GerenciarFormularios'

export default async function Formularios() {
  await exigirAdmin()
  return <GerenciarFormularios {...(await dadosFormularios(await criarClienteServidor()))} />
}
