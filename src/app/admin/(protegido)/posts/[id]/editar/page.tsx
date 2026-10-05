import Link from 'next/link'
import { getDb } from '@/db/conexao'
import { EditorPost } from '@/componentes/EditorPost'
import { SeloStatus } from '@/componentes/SeloStatus'
import { urlLeitura } from '@/infra/r2'
import { ou404 } from '@/lib/pagina'
import { detalhePost } from '@/servicos/posts'

export default async function EditarPost({ params }: PageProps<'/admin/posts/[id]/editar'>) {
  const { id } = await params
  const { post, cliente, versoes } = await ou404(detalhePost(await getDb(), id))
  const atual = versoes[0]
  const midias = await Promise.all(
    atual.midias.map(async (m) => ({
      chave: m.chaveR2,
      tipo: m.tipo,
      nomeOriginal: m.nomeOriginal,
      tamanhoBytes: m.tamanhoBytes,
      urlPreview: await urlLeitura(m.chaveR2),
    })),
  )

  return (
    <main className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href={`/admin/clientes/${cliente.id}`} className="text-sm text-neutral-500 hover:text-neutral-900">
          ← {cliente.nome}
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">Editar post</h1>
          <SeloStatus status={post.status} />
        </div>
      </div>
      {post.status === 'ajuste' && atual.resposta && (
        <blockquote className="rounded-xl bg-rose-50 p-3 text-sm text-rose-900">
          <p className="font-medium">{atual.resposta.nomeRespondente} pediu ajuste:</p>
          <p className="whitespace-pre-wrap">{atual.resposta.comentario}</p>
        </blockquote>
      )}
      <EditorPost
        postId={post.id}
        status={post.status}
        proximaVersao={atual.numero + 1}
        iniciais={{
          formato: post.formato,
          dataPrevista: post.dataPrevista,
          ideia: atual.ideia,
          objetivo: atual.objetivo,
          legenda: atual.legenda,
        }}
        midiasIniciais={midias}
      />
    </main>
  )
}
