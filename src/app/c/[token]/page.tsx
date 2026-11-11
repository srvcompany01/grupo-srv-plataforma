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
      <Link href={`/c/${token}/p/${post.id}`}>
        <div>
          <p>{post.ideia || 'Post'}</p>
          <div>
            <EtiquetaFormato formato={post.formato} />
            <span>
              <Icone nome="calendario" />
              {formatarData(post.dataPrevista)}
            </span>
            {mostrarStatus && <SeloStatus status={post.status} />}
          </div>
        </div>
        <Icone nome="seta" />
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
      <main>
        <section>
          <SeloStatus status="aguardando" contagem={pendentes.length} />
          {pendentes.length === 0 ? (
            <div>
              <Icone nome="check" />
              Tudo em dia por aqui.
            </div>
          ) : (
            <ul>
              {pendentes.map((p) => (
                <Linha key={p.id} token={token} post={p} />
              ))}
            </ul>
          )}
        </section>

        {respondidos.length > 0 && (
          <section>
            <h2>Já respondidos · {respondidos.length}</h2>
            <ul>
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
