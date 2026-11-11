import Link from 'next/link'
import { Icone } from '@/componentes/Icone'
import { Marca } from '@/componentes/Marca'
import { exigirAdmin } from '@/infra/admin'
import { sair } from './acoes'


export default async function LayoutAdmin({ children }: LayoutProps<'/admin'>) {
  await exigirAdmin()
  return (
    <div>
      <aside className="hidden">
        <Link href="/admin" aria-label="Início">
          <Marca />
        </Link>
        <Link href="/admin">
          <Icone nome="clientes" />
          Clientes
        </Link>
        <form action={sair}>
          <button>
            <Icone nome="sair" />
            Sair
          </button>
        </form>
      </aside>
      <div>
        <div>
          <Link href="/admin">
            <Marca tamanho="h-7 w-7 text-xs" /> Grupo SRV
          </Link>
          <form action={sair}>
            <button>Sair</button>
          </form>
        </div>
        <div>{children}</div>
      </div>
    </div>
  )
}
