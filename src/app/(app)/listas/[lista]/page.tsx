import { notFound, redirect } from 'next/navigation'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { PaginaLista } from '../PaginaLista'

export default async function RotaLista({ params, searchParams }: PageProps<'/listas/[lista]'>) {
  const { lista: id } = await params
  await exigirEquipe()
  const { data } = await (await criarClienteServidor()).from('lists').select('slug').eq('id', id).maybeSingle()
  if (!data) notFound()
  // A lista de uma área fixa vive na rota da área.
  if (data.slug) redirect(`/${data.slug}`)
  return <PaginaLista id={id} caminho={`/listas/${id}`} sp={await searchParams} />
}
