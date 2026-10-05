import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getDb } from '@/db/conexao'
import { SeloStatus } from '@/componentes/SeloStatus'
import { formatarData, ROTULO_FORMATO } from '@/dominio/formatar'
import type { PostResumo } from '@/servicos/posts'
import { buscarClientePorToken } from '@/servicos/clientes'
import { postsDoClienteParaVer } from '@/servicos/respostas'

function Cartao({ token, post }: { token: string; post: PostResumo }) {
  return (
    <Link href={`/c/${token}/p/${post.id}`} className="block rounded-2xl bg-white p-4 shadow-sm active:bg-neutral-50">
      <div className="mb-1 flex items-center justify-between gap-2 text-sm">
        <span className="text-neutral-500">
          {ROTULO_FORMATO[post.formato]} · {formatarData(post.dataPrevista)}
        </span>
        <SeloStatus status={post.status} />
      </div>
      <p className="line-clamp-2">{post.ideia || 'Post'}</p>
    </Link>
  )
}

export default async function AreaDoCliente({ params }: PageProps<'/c/[token]'>) {
  const { token } = await params
  const db = await getDb()
  const cliente = await buscarClientePorToken(db, token)
  if (!cliente) notFound()
  const { pendentes, respondidos } = await postsDoClienteParaVer(db, cliente.id)

  return (
    <main className="mx-auto max-w-[480px] space-y-6 p-4">
      <header className="pt-2">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Aprovação de conteúdo</p>
        <h1 className="text-2xl font-semibold">{cliente.nome}</h1>
      </header>

      <section className="space-y-3">
        <h2 className="font-semibold">Aguardando sua aprovação ({pendentes.length})</h2>
        {pendentes.length === 0 && <p className="text-sm text-neutral-500">Tudo em dia por aqui. ✨</p>}
        {pendentes.map((p) => (
          <Cartao key={p.id} token={token} post={p} />
        ))}
      </section>

      {respondidos.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-semibold text-neutral-500">Já respondidos</h2>
          {respondidos.map((p) => (
            <Cartao key={p.id} token={token} post={p} />
          ))}
        </section>
      )}
    </main>
  )
}
