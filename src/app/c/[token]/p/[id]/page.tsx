import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getDb } from '@/db/conexao'
import { CartaoResposta } from '@/componentes/CartaoResposta'
import { FormResposta } from '@/componentes/FormResposta'
import { SeloStatus } from '@/componentes/SeloStatus'
import { TextosPost } from '@/componentes/TextosPost'
import { VisualizadorMidia } from '@/componentes/VisualizadorMidia'
import { midiasParaVer } from '@/lib/midias-view'
import { ou404 } from '@/lib/pagina'
import { buscarClientePorToken } from '@/servicos/clientes'
import { postParaCliente } from '@/servicos/respostas'

export default async function PostDoCliente({ params }: PageProps<'/c/[token]/p/[id]'>) {
  const { token, id } = await params
  const db = await getDb()
  const cliente = await buscarClientePorToken(db, token)
  if (!cliente) notFound()
  const { post, versoes } = await ou404(postParaCliente(db, cliente.id, id))
  const atual = versoes[0]
  const midias = await midiasParaVer(atual.midias)

  return (
    <main className="mx-auto max-w-[480px] space-y-5 p-4 pb-10">
      <div className="flex items-center justify-between">
        <Link href={`/c/${token}`} className="text-sm text-neutral-500">
          ← Todos os posts
        </Link>
        <SeloStatus status={post.status} />
      </div>
      <VisualizadorMidia midias={midias} formato={post.formato} />
      {post.status === 'aguardando' ? (
        <FormResposta token={token} postId={post.id} versaoNumero={atual.numero} />
      ) : (
        atual.resposta && <CartaoResposta resposta={atual.resposta} />
      )}
      <TextosPost formato={post.formato} dataPrevista={post.dataPrevista} {...atual} />
    </main>
  )
}
