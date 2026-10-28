import Link from 'next/link'
import { Icone } from '@/componentes/Icone'
import { Marca } from '@/componentes/Marca'
import { exigirAdmin } from '@/infra/admin'
import { sair } from './acoes'

const itemTrilho = 'flex w-12 flex-col items-center gap-1 rounded-lg py-2 text-legenda font-medium text-claro/60 transition hover:bg-white/10 hover:text-claro'

export default async function LayoutAdmin({ children }: LayoutProps<'/admin'>) {
  await exigirAdmin()
  return (
    <div className="flex min-h-screen bg-trilho">
      <aside className="sticky top-0 hidden h-screen w-16 shrink-0 flex-col items-center gap-2 py-3 sm:flex">
        <Link href="/admin" aria-label="Início" className="mb-2">
          <Marca />
        </Link>
        <Link href="/admin" className={`${itemTrilho} bg-white/10 text-claro`}>
          <Icone nome="clientes" className="h-5 w-5" />
          Clientes
        </Link>
        <form action={sair} className="mt-auto">
          <button className={itemTrilho}>
            <Icone nome="sair" className="h-5 w-5" />
            Sair
          </button>
        </form>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col sm:py-2 sm:pr-2">
        <div className="flex items-center justify-between bg-trilho px-4 py-2.5 sm:hidden">
          <Link href="/admin" className="flex items-center gap-2 text-sm font-semibold text-claro">
            <Marca tamanho="h-7 w-7 text-xs" /> Grupo SRV
          </Link>
          <form action={sair}>
            <button className="text-xs text-claro/70">Sair</button>
          </form>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-fundo sm:rounded-xl">{children}</div>
      </div>
    </div>
  )
}
