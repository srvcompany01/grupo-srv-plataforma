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
      <main>
        {lista.length === 0 && (
          <div>
            Nenhum post ainda. Use <strong>+ Post</strong> para criar o primeiro.
          </div>
        )}

        <div>
          {grupos.map((g) => (
            <details key={g.status} open>
              <summary>
                <Icone nome="abaixo" />
                <SeloStatus status={g.status} contagem={g.posts.length} />
              </summary>
              <div>
                <div>
                  <span>Ideia</span>
                  <span>Formato</span>
                  <span>Data prevista</span>
                  <span>Versão</span>
                </div>
                <ul>
                  {g.posts.map((p) => (
                    <li key={p.id}>
                      <Link
                        href={`/admin/posts/${p.id}`}
                      >
                        <span>
                          {p.ideia || <em>Sem ideia ainda</em>}
                        </span>
                        <span>
                          <EtiquetaFormato formato={p.formato} />
                        </span>
                        <span>
                          <Icone nome="calendario" />
                          {formatarData(p.dataPrevista)}
                        </span>
                        <span className="hidden">v{p.versaoAtual}</span>
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
