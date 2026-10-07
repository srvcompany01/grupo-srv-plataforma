import { notFound } from 'next/navigation'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { PaginaLista } from '../listas/PaginaLista'

export default async function Area({ searchParams }: PageProps<'/social-conteudo'>) {
  await exigirEquipe()
  const { data } = await (await criarClienteServidor()).from('lists').select('id').eq('slug', 'social-conteudo').is('archived_at', null).maybeSingle()
  if (!data) notFound()
  return <PaginaLista id={data.id} caminho="/social-conteudo" sp={await searchParams} />
}
