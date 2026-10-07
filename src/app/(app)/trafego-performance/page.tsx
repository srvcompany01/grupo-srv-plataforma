import { notFound } from 'next/navigation'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { PaginaArea } from '../espacos/PaginaArea'

export default async function Area({ searchParams }: PageProps<'/trafego-performance'>) {
  const { data } = await (await criarClienteServidor()).from('spaces').select('id').eq('slug', 'trafego-performance').is('archived_at', null).maybeSingle()
  if (!data) notFound()
  return <PaginaArea id={data.id} caminho="/trafego-performance" sp={await searchParams} />
}
