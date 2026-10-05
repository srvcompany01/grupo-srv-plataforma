import Link from 'next/link'
import { dbAdmin } from '@/infra/admin'
import { CartaoResposta } from '@/componentes/CartaoResposta'
import { SeloStatus } from '@/componentes/SeloStatus'
import { TextosPost } from '@/componentes/TextosPost'
import { VisualizadorMidia } from '@/componentes/VisualizadorMidia'
import { formatarDataHora } from '@/dominio/formatar'
import { midiasParaVer } from '@/lib/midias-view'
import { ou404 } from '@/lib/pagina'
import { botaoPrimario } from '@/lib/ui'
import { detalhePost } from '@/servicos/posts'

export default async function DetalhePost({ params }: PageProps<'/admin/posts/[id]'>) {
  const { id } = await params
  const { post, cliente, versoes } = await ou404(detalhePost(await dbAdmin(), id))
  const [atual, ...anteriores] = versoes
  const midiasAtuais = await midiasParaVer(atual.midias)
  const midiasAnteriores = await Promise.all(anteriores.map((v) => midiasParaVer(v.midias)))

  return (
    <main className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href={`/admin/clientes/${cliente.id}`} className="text-sm text-neutral-500 hover:text-neutral-900">
            ← {cliente.nome}
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">Versão {atual.numero}</h1>
            <SeloStatus status={post.status} />
          </div>
        </div>
        <Link href={`/admin/posts/${post.id}/editar`} className={botaoPrimario}>
          Editar
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-[minmax(0,360px)_1fr]">
        <VisualizadorMidia midias={midiasAtuais} formato={post.formato} />
        <div className="space-y-4">
          {atual.resposta && <CartaoResposta resposta={atual.resposta} />}
          <TextosPost formato={post.formato} dataPrevista={post.dataPrevista} {...atual} />
        </div>
      </div>

      {anteriores.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Histórico</h2>
          {anteriores.map((v, i) => (
            <details key={v.id} className="rounded-2xl bg-white p-4 shadow-sm">
              <summary className="cursor-pointer text-sm font-medium">
                Versão {v.numero} · criada em {formatarDataHora(v.criadaEm)}
                {v.resposta && ` · ${v.resposta.decisao === 'aprovado' ? 'aprovada' : 'ajuste pedido'}`}
              </summary>
              <div className="mt-4 grid gap-6 md:grid-cols-[minmax(0,280px)_1fr]">
                <VisualizadorMidia midias={midiasAnteriores[i]} formato={post.formato} />
                <div className="space-y-4">
                  {v.resposta && <CartaoResposta resposta={v.resposta} />}
                  <TextosPost formato={post.formato} dataPrevista={post.dataPrevista} {...v} />
                </div>
              </div>
            </details>
          ))}
        </section>
      )}
    </main>
  )
}
