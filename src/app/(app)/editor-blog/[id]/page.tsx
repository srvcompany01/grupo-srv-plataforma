import Link from 'next/link'
import { notFound } from 'next/navigation'
import { EditorArtigo } from '@/componentes/blog/EditorArtigo'
import { configIA } from '@/ia/modelo'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { autores, categorias, postDaEquipe } from '@/servicos/blog'

// A IA pode levar até 1 minuto para escrever o rascunho.
export const maxDuration = 120

export default async function EditarArtigo({ params }: PageProps<'/editor-blog/[id]'>) {
  await exigirEquipe()
  const { id } = await params
  const sb = await criarClienteServidor()
  const novo = id === 'novo'
  if (!novo && !/^[0-9a-f-]{36}$/i.test(id)) notFound()
  const [post, cats, listaAutores] = await Promise.all([novo ? null : postDaEquipe(sb, id), categorias(), autores(sb)])
  if (!novo && !post) notFound()
  const situacao = !post || post.status === 'rascunho' ? 'Rascunho' : post.publicadoEmBruto && new Date(post.publicadoEmBruto) > new Date() ? 'Agendado' : 'Publicado'
  return (
    <div className="page-shell">
      <Link href="/editor-blog" className="text-rotulo text-texto-2 hover:text-texto">← Blog</Link>
      <EditorArtigo key={post?.id ?? 'novo'} post={post} categorias={cats} autores={listaAutores} iaPronta={!!configIA()} situacao={situacao} />
    </div>
  )
}
