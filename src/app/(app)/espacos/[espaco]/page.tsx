import { notFound, redirect } from 'next/navigation'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { exigirEquipe } from '@/infra/supabase/sessao'

// Os espaços viraram áreas fixas com rota própria; o link antigo leva para a área, ou 404 se não for uma delas.
export default async function PaginaEspaco({ params }: PageProps<'/espacos/[espaco]'>) {
  const { espaco: id } = await params
  await exigirEquipe()
  const { data } = await (await criarClienteServidor()).from('spaces').select('slug').eq('id', id).maybeSingle()
  if (!data?.slug) notFound()
  redirect(`/${data.slug}`)
}
