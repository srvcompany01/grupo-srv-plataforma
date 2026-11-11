import Link from 'next/link'
import { Cabecalho } from '@/componentes/Cabecalho'
import { CartaoResposta } from '@/componentes/CartaoResposta'
import { EtiquetaFormato } from '@/componentes/EtiquetaFormato'
import { Icone } from '@/componentes/Icone'
import { Propriedades } from '@/componentes/Propriedades'
import { SeloStatus } from '@/componentes/SeloStatus'
import { TextosPost } from '@/componentes/TextosPost'
import { VisualizadorMidia } from '@/componentes/VisualizadorMidia'
import { nomeZip } from '@/dominio/download'
import { formatarData, formatarDataHora } from '@/dominio/formatar'
import { dbAdmin } from '@/infra/admin'
import { midiasParaVer } from '@/lib/midias-view'
import { ou404 } from '@/lib/pagina'
import { detalhePost } from '@/servicos/posts'

export default async function DetalhePost({ params }: PageProps<'/admin/posts/[id]'>) {
  const { id } = await params
  const { post, cliente, versoes } = await ou404(detalhePost(await dbAdmin(), id))
  const atual = versoes[0]
  const cronologia = [...versoes].reverse()
  const midias = await Promise.all(cronologia.map((v) => midiasParaVer(v.midias)))
  const midiasAtuais = midias[midias.length - 1]
  const zip = nomeZip(cliente.nome, post.dataPrevista)

  return (
    <>
      <Cabecalho
        trilha={[
          { rotulo: 'Clientes', href: '/admin' },
          { rotulo: cliente.nome, href: `/admin/clientes/${cliente.id}` },
          { rotulo: atual.ideia.split('\n')[0] || 'Post' },
        ]}
        acoes={
          <Link href={`/admin/posts/${post.id}/editar`}>
            <Icone nome="editar" /> Editar
          </Link>
        }
      />
      <div>
        <main>
          <h1>{atual.ideia.split('\n')[0] || 'Post sem ideia'}</h1>
          <Propriedades
            itens={[
              { icone: 'status', rotulo: 'Status', valor: <SeloStatus status={post.status} /> },
              { icone: 'formato', rotulo: 'Formato', valor: <EtiquetaFormato formato={post.formato} /> },
              { icone: 'calendario', rotulo: 'Data prevista', valor: formatarData(post.dataPrevista) },
              { icone: 'versao', rotulo: 'Versão', valor: `v${atual.numero}` },
            ]}
          />
          <div>
            <VisualizadorMidia midias={midiasAtuais} formato={post.formato} nomeZip={zip} />
            <TextosPost {...atual} />
          </div>
        </main>

        <aside>
          <h2>Atividade</h2>
          <ol>
            {cronologia.map((v, i) => (
              <li key={v.id}>
                <div>
                  <Icone nome={v.numero === 1 ? 'mais' : 'atualizar'} />
                  <div>
                    <p>
                      {v.numero === 1 ? 'Post criado' : <>Versão <strong>v{v.numero}</strong> enviada</>}
                      <span>{formatarDataHora(v.criadaEm)}</span>
                    </p>
                    {v.id !== atual.id && (
                      <details>
                        <summary>Ver conteúdo da v{v.numero}</summary>
                        <div>
                          <VisualizadorMidia midias={midias[i]} formato={post.formato} nomeZip={zip.replace('.zip', `-v${v.numero}.zip`)} />
                          <TextosPost {...v} />
                        </div>
                      </details>
                    )}
                  </div>
                </div>
                {v.resposta && <CartaoResposta resposta={v.resposta} />}
              </li>
            ))}
            {post.status === 'aguardando' && (
              <li>
                <span /> Aguardando resposta do cliente
              </li>
            )}
          </ol>
        </aside>
      </div>
    </>
  )
}
