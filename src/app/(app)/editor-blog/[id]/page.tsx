import Link from 'next/link'
import { notFound } from 'next/navigation'
import { EditorArtigo } from '@/componentes/blog/EditorArtigo'
import { somarDias } from '@/dominio/agenda'
import { dataDeHoje } from '@/dominio/filtros'
import { configIA } from '@/ia/modelo'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { autores, categorias, desempenho, palavrasChaveDosPosts, postDaEquipe, postsDaEquipe } from '@/servicos/blog'

// A IA pode levar até 2 minutos para escrever o rascunho.
export const maxDuration = 180

export default async function EditarArtigo({ params }: PageProps<'/editor-blog/[id]'>) {
  await exigirEquipe()
  const { id } = await params
  const sb = await criarClienteServidor()
  const novo = id === 'novo'
  if (!novo && !/^[0-9a-f-]{36}$/i.test(id)) notFound()
  const [post, cats, listaAutores, todos, chaves, numeros] = await Promise.all([
    novo ? null : postDaEquipe(sb, id),
    categorias(),
    autores(sb),
    postsDaEquipe(sb),
    palavrasChaveDosPosts(sb),
    novo ? null : desempenho(sb, somarDias(dataDeHoje(new Date()), -90), id),
  ])
  if (!novo && !post) notFound()
  const agora = new Date()
  const situacao = !post || post.status === 'rascunho' ? 'Rascunho' : post.status === 'revisao' ? 'Em revisão' : post.publicadoEmBruto && new Date(post.publicadoEmBruto) > agora ? 'Agendado' : 'Publicado'
  const chave = new Map(chaves.map((c) => [c.id, c.palavraChave]))
  return (
    <div className="page-shell">
      <Link href="/editor-blog" className="text-rotulo text-texto-2 hover:text-texto">← Blog</Link>
      <EditorArtigo
        key={post?.id ?? 'novo'}
        post={post}
        categorias={cats}
        autores={listaAutores}
        iaPronta={!!configIA()}
        situacao={situacao}
        outros={todos.map((p) => ({ id: p.id, titulo: p.titulo, palavraChave: chave.get(p.id) ?? '' }))}
        desempenho={post ? (numeros?.get(post.id) ?? null) : null}
      />
    </div>
  )
}
