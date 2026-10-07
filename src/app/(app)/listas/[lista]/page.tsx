import { notFound } from 'next/navigation'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { PaginaLista } from '../PaginaLista'

export default async function RotaLista({ params, searchParams }: PageProps<'/listas/[lista]'>) {
  const { lista: id } = await params
  await exigirEquipe()
  const { data } = await (await criarClienteServidor()).from('lists').select('id').eq('id', id).maybeSingle()
  if (!data) notFound()
  return <PaginaLista id={id} caminho={`/listas/${id}`} sp={await searchParams} />
}
