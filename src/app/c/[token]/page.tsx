import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getDb } from '@/db/conexao'
import { CabecalhoCliente } from '@/componentes/CabecalhoCliente'
import { EtiquetaFormato } from '@/componentes/EtiquetaFormato'
import { Icone } from '@/componentes/Icone'
import { SeloStatus } from '@/componentes/SeloStatus'
import { formatarData } from '@/dominio/formatar'
import type { PostResumo } from '@/servicos/posts'
import { buscarClientePorToken } from '@/servicos/clientes'
import { postsDoClienteParaVer } from '@/servicos/respostas'

function Linha({ token, post, mostrarStatus }: { token: string; post: PostResumo; mostrarStatus?: boolean }) {
  return (
    <li>
      <Link href={`/c/${token}/p/${post.id}`} className="flex items-center gap-3 px-4 py-3 transition active:bg-hover">
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="truncate text-[15px] font-medium">{post.ideia || 'Post'}</p>
          <div className="flex flex-wrap items-center gap-2 text-[13px] text-texto-2">
            <EtiquetaFormato formato={post.formato} />
            <span className="flex items-center gap-1">
              <Icone nome="calendario" className="h-3.5 w-3.5 text-texto-3" />
              {formatarData(post.dataPrevista)}
            </span>
            {mostrarStatus && <SeloStatus status={post.status} />}
          </div>
        </div>
        <Icone nome="seta" className="h-4 w-4 shrink-0 text-texto-3" />
      </Link>
    </li>
  )
}

export default async function AreaDoCliente({ params }: PageProps<'/c/[token]'>) {
  const { token } = await params
  const db = await getDb()
  const cliente = await buscarClientePorToken(db, token)
  if (!cliente) notFound()
  const { pendentes, respondidos } = await postsDoClienteParaVer(db, cliente.id)

  return (
    <>
      <CabecalhoCliente nome={cliente.nome} token={token} />
      <main className="mx-auto max-w-[560px] space-y-6 p-4 pb-12">
        <section className="space-y-2">
          <SeloStatus status="aguardando" contagem={pendentes.length} />
          {pendentes.length === 0 ? (
            <div className="rounded-xl border border-borda bg-white p-6 text-center text-texto-2">
              <Icone nome="check" className="mx-auto mb-2 h-6 w-6 text-st-aprovado" />
              Tudo em dia por aqui.
            </div>
          ) : (
            <ul className="divide-y divide-borda overflow-hidden rounded-xl border border-borda bg-white">
              {pendentes.map((p) => (
                <Linha key={p.id} token={token} post={p} />
              ))}
            </ul>
          )}
        </section>

        {respondidos.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-[13px] font-semibold text-texto-2">Já respondidos · {respondidos.length}</h2>
            <ul className="divide-y divide-borda overflow-hidden rounded-xl border border-borda bg-white">
              {respondidos.map((p) => (
                <Linha key={p.id} token={token} post={p} mostrarStatus />
              ))}
            </ul>
          </section>
        )}
      </main>
    </>
  )
}
