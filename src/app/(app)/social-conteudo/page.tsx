import { notFound } from 'next/navigation'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { PaginaArea } from '../espacos/PaginaArea'

export default async function Area({ searchParams }: PageProps<'/social-conteudo'>) {
  const { data } = await (await criarClienteServidor()).from('spaces').select('id').eq('slug', 'social-conteudo').is('archived_at', null).maybeSingle()
  if (!data) notFound()
  return <PaginaArea id={data.id} caminho="/social-conteudo" sp={await searchParams} />
}
