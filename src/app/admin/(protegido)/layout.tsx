import Link from 'next/link'
import { exigirAdmin } from '@/infra/admin'
import { sair } from './acoes'

export default async function LayoutAdmin({ children }: LayoutProps<'/admin'>) {
  await exigirAdmin()
  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-8">
      <header className="mb-8 flex items-center justify-between">
        <Link href="/admin" className="font-semibold">
          Grupo SRV · Conteúdo
        </Link>
        <form action={sair}>
          <button className="text-sm text-neutral-500 hover:text-neutral-900">Sair</button>
        </form>
      </header>
      {children}
    </div>
  )
}
