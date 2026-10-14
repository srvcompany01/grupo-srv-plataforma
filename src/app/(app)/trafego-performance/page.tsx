import { notFound, redirect } from 'next/navigation'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'

// Atalho do endereço antigo: a lista agora vive em Operação e abre em /listas/<id>.
export default async function Atalho() {
  await exigirEquipe()
  const { data } = await (await criarClienteServidor()).from('lists').select('id').eq('slug', 'trafego-performance').is('archived_at', null).maybeSingle()
  if (!data) notFound()
  redirect(`/listas/${data.id}`)
}
