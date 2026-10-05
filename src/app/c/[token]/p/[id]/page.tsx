import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getDb } from '@/db/conexao'
import { CabecalhoCliente } from '@/componentes/CabecalhoCliente'
import { CartaoResposta } from '@/componentes/CartaoResposta'
import { EtiquetaFormato } from '@/componentes/EtiquetaFormato'
import { FormResposta } from '@/componentes/FormResposta'
import { Icone } from '@/componentes/Icone'
import { Propriedades } from '@/componentes/Propriedades'
import { SeloStatus } from '@/componentes/SeloStatus'
import { TextosPost } from '@/componentes/TextosPost'
import { VisualizadorMidia } from '@/componentes/VisualizadorMidia'
import { nomeZip } from '@/dominio/download'
import { formatarData } from '@/dominio/formatar'
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
    <>
      <CabecalhoCliente nome={cliente.nome} token={token} />
      <main className="mx-auto max-w-[560px] space-y-5 p-4 pb-12">
        <Link href={`/c/${token}`} className="inline-flex items-center gap-1 text-[13px] text-texto-2 hover:text-marca">
          <Icone nome="voltar" className="h-4 w-4" /> Todos os posts
        </Link>
        <VisualizadorMidia midias={midias} formato={post.formato} nomeZip={nomeZip(cliente.nome, post.dataPrevista)} />
        {post.status === 'aguardando' ? (
          <FormResposta token={token} postId={post.id} versaoNumero={atual.numero} />
        ) : (
          atual.resposta && <CartaoResposta resposta={atual.resposta} />
        )}
        <div className="space-y-5 rounded-xl border border-borda bg-white p-4">
          <Propriedades
            itens={[
              { icone: 'status', rotulo: 'Status', valor: <SeloStatus status={post.status} /> },
              { icone: 'formato', rotulo: 'Formato', valor: <EtiquetaFormato formato={post.formato} /> },
              { icone: 'calendario', rotulo: 'Data prevista', valor: formatarData(post.dataPrevista) },
            ]}
          />
          <div className="border-t border-borda pt-5">
            <TextosPost {...atual} />
          </div>
        </div>
      </main>
    </>
  )
}
