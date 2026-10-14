import { exigirAdmin } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { listarCamposCliente } from '@/servicos/clientes-galeria'
import { GerenciarCamposCliente } from './GerenciarCamposCliente'

export default async function CamposClientes() {
  await exigirAdmin()
  const campos = await listarCamposCliente(await criarClienteServidor())
  return <GerenciarCamposCliente campos={campos} />
}
