import { exigirAdmin } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { temaAtual } from '@/servicos/tema'
import { EditorTema } from './EditorTema'

export default async function Personalizacao() {
  await exigirAdmin()
  return <EditorTema atual={await temaAtual(await criarClienteServidor())} />
}
