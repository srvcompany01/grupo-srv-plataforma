import { Cabecalho } from '@/componentes/Cabecalho'
import { EditorPost } from '@/componentes/EditorPost'
import { dbAdmin } from '@/infra/admin'
import { urlLeitura } from '@/infra/r2'
import { ou404 } from '@/lib/pagina'
import { detalhePost } from '@/servicos/posts'

export default async function EditarPost({ params }: PageProps<'/admin/posts/[id]/editar'>) {
  const { id } = await params
  const { post, cliente, versoes } = await ou404(detalhePost(await dbAdmin(), id))
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
    <>
      <Cabecalho
        trilha={[
          { rotulo: 'Clientes', href: '/admin' },
          { rotulo: cliente.nome, href: `/admin/clientes/${cliente.id}` },
          { rotulo: atual.ideia.split('\n')[0] || 'Post', href: `/admin/posts/${post.id}` },
          { rotulo: 'Editar' },
        ]}
      />
      <main>
        <div>
          <h1>Editar post</h1>
          {post.status === 'ajuste' && atual.resposta && (
            <div>
              <p>{atual.resposta.nomeRespondente} pediu ajuste</p>
              <p>{atual.resposta.comentario}</p>
            </div>
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
        </div>
      </main>
    </>
  )
}
