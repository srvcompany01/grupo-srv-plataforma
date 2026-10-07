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
import { botaoPrimario } from '@/lib/ui'
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
          <Link href={`/admin/posts/${post.id}/editar`} className={botaoPrimario}>
            <Icone nome="editar" className="h-3.5 w-3.5" /> Editar
          </Link>
        }
      />
      <div className="flex min-h-0 flex-1 flex-col overflow-auto lg:flex-row lg:overflow-hidden">
        <main className="min-w-0 flex-1 space-y-6 bg-white p-4 sm:p-8 lg:overflow-auto">
          <h1 className="text-2xl font-semibold leading-tight">{atual.ideia.split('\n')[0] || 'Post sem ideia'}</h1>
          <Propriedades
            itens={[
              { icone: 'status', rotulo: 'Status', valor: <SeloStatus status={post.status} /> },
              { icone: 'formato', rotulo: 'Formato', valor: <EtiquetaFormato formato={post.formato} /> },
              { icone: 'calendario', rotulo: 'Data prevista', valor: formatarData(post.dataPrevista) },
              { icone: 'versao', rotulo: 'Versão', valor: `v${atual.numero}` },
            ]}
          />
          <div className="grid gap-8 border-t border-borda pt-6 md:grid-cols-[minmax(0,340px)_1fr]">
            <VisualizadorMidia midias={midiasAtuais} formato={post.formato} nomeZip={zip} />
            <TextosPost {...atual} />
          </div>
        </main>

        <aside className="w-full shrink-0 border-t border-borda bg-fundo lg:w-[380px] lg:overflow-auto lg:border-l lg:border-t-0">
          <h2 className="sticky top-0 z-10 border-b border-borda bg-fundo px-5 py-3.5 text-sm font-semibold">Atividade</h2>
          <ol className="space-y-4 p-5">
            {cronologia.map((v, i) => (
              <li key={v.id} className="space-y-3">
                <div className="flex items-start gap-2 text-corpo text-texto-2">
                  <Icone nome={v.numero === 1 ? 'mais' : 'atualizar'} className="mt-0.5 h-3.5 w-3.5 shrink-0 text-texto-3" />
                  <div className="min-w-0 flex-1">
                    <p>
                      {v.numero === 1 ? 'Post criado' : <>Versão <strong className="text-texto">v{v.numero}</strong> enviada</>}
                      <span className="ml-1.5 text-xs text-texto-3">{formatarDataHora(v.criadaEm)}</span>
                    </p>
                    {v.id !== atual.id && (
                      <details className="mt-1.5">
                        <summary className="cursor-pointer text-xs font-medium text-marca hover:underline">Ver conteúdo da v{v.numero}</summary>
                        <div className="mt-3 space-y-4 rounded-lg border border-borda bg-white p-3">
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
              <li className="flex items-center gap-2 text-corpo text-texto-3">
                <span className="h-2 w-2 animate-pulse rounded-full bg-st-aguardando" /> Aguardando resposta do cliente
              </li>
            )}
          </ol>
        </aside>
      </div>
    </>
  )
}
