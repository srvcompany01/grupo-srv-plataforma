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
      className={`-mb-px inline-flex items-center gap-1.5 border-b-2 pb-2 text-[13px] font-medium ${
        filtros.visao === visao ? 'border-marca text-marca' : 'border-transparent text-texto-2 hover:text-texto'
      }`}
    >
      <Icone className="h-4 w-4" />
      {rotulo}
    </Link>
  )
  return (
    <nav className="flex gap-4 border-b border-borda">
      {aba('lista', 'Lista', List)}
      {aba('kanban', 'Kanban', Columns3)}
    </nav>
  )
}
