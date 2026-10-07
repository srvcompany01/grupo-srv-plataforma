import { notFound } from 'next/navigation'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { PaginaLista } from '../listas/PaginaLista'

export default async function Area({ searchParams }: PageProps<'/trafego-performance'>) {
  await exigirEquipe()
  const { data } = await (await criarClienteServidor()).from('lists').select('id').eq('slug', 'trafego-performance').is('archived_at', null).maybeSingle()
  if (!data) notFound()
  return <PaginaLista id={data.id} caminho="/trafego-performance" sp={await searchParams} />
}
