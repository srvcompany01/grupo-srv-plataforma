import { CalendarDays, Columns3, List, Plus } from 'lucide-react'
import Link from 'next/link'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/componentes/ui/dropdown-menu'
import { escreverFiltros, type Filtros, type VisaoTarefas } from '@/dominio/filtros'

const OPCOES = {
  lista: { rotulo: 'Lista', Icone: List },
  calendario: { rotulo: 'Calendário', Icone: CalendarDays },
  kanban: { rotulo: 'Quadro', Icone: Columns3 },
} satisfies Record<VisaoTarefas, { rotulo: string; Icone: typeof List }>

export function AlternadorVisao({
  caminho,
  filtros,
  visoes = ['lista', 'kanban'],
  abas = false,
}: {
  caminho: string
  filtros: Filtros
  visoes?: VisaoTarefas[]
  abas?: boolean
}) {
  const href = (visao: VisaoTarefas) => {
    const qs = escreverFiltros({ ...filtros, visao }).toString()
    return qs ? `${caminho}?${qs}` : caminho
  }
  const aba = (visao: VisaoTarefas) => {
    const { rotulo, Icone } = OPCOES[visao]
    return (
    <Link
      key={visao}
      href={href(visao)}
      scroll={false}
      className={`inline-flex items-center gap-1.5 text-rotulo font-semibold transition ${
        abas
          ? `-mb-px border-b-2 px-2 py-3 ${filtros.visao === visao ? 'border-texto text-texto' : 'border-transparent text-texto-2 hover:border-borda-forte hover:text-texto'}`
          : `rounded-full px-3 py-1.5 ${filtros.visao === visao ? 'bg-texto text-white' : 'text-texto-2 hover:bg-hover hover:text-texto'}`
      }`}
    >
      <Icone className={`h-4 w-4 ${visao === 'calendario' ? 'text-aviso' : ''}`} />
      {rotulo}
    </Link>
    )
  }
  return (
    <nav className={abas ? 'flex min-w-0 items-center gap-2 overflow-x-auto border-b border-borda px-4 md:px-5' : 'flex w-fit gap-1 rounded-full border border-borda bg-white p-1'}>
      {visoes.map(aba)}
      {abas && (
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center gap-1.5 whitespace-nowrap px-2 py-3 text-rotulo font-medium text-texto-3 transition hover:text-texto">
            <Plus className="h-4 w-4" /> Visualização
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44">
            {(Object.keys(OPCOES) as VisaoTarefas[]).map((visao) => {
              const { rotulo, Icone } = OPCOES[visao]
              return <DropdownMenuItem key={visao} asChild><Link href={href(visao)} scroll={false}><Icone className="h-4 w-4" />{rotulo}</Link></DropdownMenuItem>
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </nav>
  )
}
