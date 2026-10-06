import { Columns3, List } from 'lucide-react'
import Link from 'next/link'
import { escreverFiltros, type Filtros } from '@/dominio/filtros'

export function AlternadorVisao({ caminho, filtros }: { caminho: string; filtros: Filtros }) {
  const href = (visao: Filtros['visao']) => {
    const qs = escreverFiltros({ ...filtros, visao }).toString()
    return qs ? `${caminho}?${qs}` : caminho
  }
  const aba = (visao: Filtros['visao'], rotulo: string, Icone: typeof List) => (
    <Link
      href={href(visao)}
      scroll={false}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold transition ${
        filtros.visao === visao ? 'bg-texto text-white' : 'text-texto-2 hover:bg-hover hover:text-texto'
      }`}
    >
      <Icone className="h-4 w-4" />
      {rotulo}
    </Link>
  )
  return (
    <nav className="flex w-fit gap-1 rounded-full border border-borda bg-white p-1">
      {aba('lista', 'Lista', List)}
      {aba('kanban', 'Kanban', Columns3)}
    </nav>
  )
}
