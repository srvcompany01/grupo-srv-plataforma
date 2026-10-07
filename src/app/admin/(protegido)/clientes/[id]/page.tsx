import Link from 'next/link'
import { Cabecalho } from '@/componentes/Cabecalho'
import { EtiquetaFormato } from '@/componentes/EtiquetaFormato'
import { FormNovoPost } from '@/componentes/FormNovoPost'
import { Icone } from '@/componentes/Icone'
import { SeloStatus } from '@/componentes/SeloStatus'
import { formatarData } from '@/dominio/formatar'
import type { Status } from '@/dominio/tipos'
import { dbAdmin } from '@/infra/admin'
import { ou404 } from '@/lib/pagina'
import { buscarCliente } from '@/servicos/clientes'
import { listarPosts } from '@/servicos/posts'

// Ordem dos grupos: o que pede ação primeiro.
const ORDEM: Status[] = ['ajuste', 'aguardando', 'rascunho', 'aprovado']
const COLUNAS = 'sm:grid-cols-[minmax(0,1fr)_110px_120px_70px]'

export default async function PostsDoCliente({ params }: PageProps<'/admin/clientes/[id]'>) {
  const { id } = await params
  const db = await dbAdmin()
  const cliente = await ou404(buscarCliente(db, id))
  const lista = await listarPosts(db, id)
  const grupos = ORDEM.map((status) => ({ status, posts: lista.filter((p) => p.status === status) })).filter(
    (g) => g.posts.length > 0,
  )

  return (
    <>
      <Cabecalho
        trilha={[{ rotulo: 'Clientes', href: '/admin' }, { rotulo: cliente.nome }]}
        acoes={<FormNovoPost clienteId={id} />}
      />
      <main className="flex-1 overflow-auto p-4 sm:p-6">
        {lista.length === 0 && (
          <div className="rounded-xl border border-dashed border-borda-forte bg-white p-10 text-center text-texto-2">
            Nenhum post ainda. Use <strong className="text-marca">+ Post</strong> para criar o primeiro.
          </div>
        )}

        <div className="space-y-6">
          {grupos.map((g) => (
            <details key={g.status} open className="group">
              <summary className="mb-1 flex cursor-pointer list-none items-center gap-2 py-1 [&::-webkit-details-marker]:hidden">
                <Icone nome="abaixo" className="h-4 w-4 text-texto-3 transition group-[:not([open])]:-rotate-90" />
                <SeloStatus status={g.status} contagem={g.posts.length} />
              </summary>
              <div className="overflow-hidden rounded-xl border border-borda bg-white">
                <div className={`hidden gap-4 border-b border-borda px-4 py-2 text-xs font-medium text-texto-3 sm:grid ${COLUNAS}`}>
                  <span>Ideia</span>
                  <span>Formato</span>
                  <span>Data prevista</span>
                  <span>Versão</span>
                </div>
                <ul className="divide-y divide-borda">
                  {g.posts.map((p) => (
                    <li key={p.id}>
                      <Link
                        href={`/admin/posts/${p.id}`}
                        className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-4 py-2.5 transition hover:bg-hover ${COLUNAS}`}
                      >
                        <span className="col-span-2 truncate sm:col-span-1">
                          {p.ideia || <em className="text-texto-3">Sem ideia ainda</em>}
                        </span>
                        <span>
                          <EtiquetaFormato formato={p.formato} />
                        </span>
                        <span className="flex items-center gap-1.5 text-corpo text-texto-2">
                          <Icone nome="calendario" className="h-3.5 w-3.5 text-texto-3" />
                          {formatarData(p.dataPrevista)}
                        </span>
                        <span className="hidden text-corpo text-texto-2 sm:inline">v{p.versaoAtual}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </details>
          ))}
        </div>
      </main>
    </>
  )
}
