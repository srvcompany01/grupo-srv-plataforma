import Link from 'next/link'
import { dbAdmin } from '@/infra/admin'
import { ou404 } from '@/lib/pagina'
import { formatarData, ROTULO_FORMATO, ROTULO_STATUS } from '@/dominio/formatar'
import { STATUS, type Status } from '@/dominio/tipos'
import { FormNovoPost } from '@/componentes/FormNovoPost'
import { SeloStatus } from '@/componentes/SeloStatus'
import { listarPosts } from '@/servicos/posts'
import { buscarCliente } from '@/servicos/clientes'

export default async function PostsDoCliente({ params, searchParams }: PageProps<'/admin/clientes/[id]'>) {
  const { id } = await params
  const { status } = await searchParams
  const filtro = STATUS.includes(status as Status) ? (status as Status) : undefined
  const db = await dbAdmin()
  const cliente = await ou404(buscarCliente(db, id))
  const lista = await listarPosts(db, id, filtro)

  return (
    <main className="space-y-6">
      <div>
        <Link href="/admin" className="text-sm text-neutral-500 hover:text-neutral-900">
          ← Clientes
        </Link>
        <h1 className="text-2xl font-semibold">{cliente.nome}</h1>
      </div>
      <FormNovoPost clienteId={id} />
      <nav className="flex flex-wrap gap-2 text-sm">
        {[undefined, ...STATUS].map((s) => (
          <Link
            key={s ?? 'todos'}
            href={s ? `?status=${s}` : '?'}
            className={`rounded-full px-3 py-1 ${filtro === s ? 'bg-neutral-900 text-white' : 'bg-white'}`}
          >
            {s ? ROTULO_STATUS[s] : 'Todos'}
          </Link>
        ))}
      </nav>
      {lista.length === 0 && <p className="text-neutral-500">Nenhum post aqui.</p>}
      <ul className="divide-y divide-neutral-200 rounded-2xl bg-white shadow-sm">
        {lista.map((p) => (
          <li key={p.id}>
            <Link href={`/admin/posts/${p.id}`} className="flex items-center gap-4 p-4 hover:bg-neutral-50">
              <div className="w-24 shrink-0 text-sm">
                <p className="font-medium">{formatarData(p.dataPrevista)}</p>
                <p className="text-neutral-500">{ROTULO_FORMATO[p.formato]}</p>
              </div>
              <p className="flex-1 truncate text-sm text-neutral-700">{p.ideia || <em>Sem ideia ainda</em>}</p>
              <SeloStatus status={p.status} />
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
