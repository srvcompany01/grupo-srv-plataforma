import { Plus } from 'lucide-react'
import Link from 'next/link'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/componentes/ui/dropdown-menu'
import { type Filtros, type VisaoTarefas } from '@/dominio/filtros'
import { enderecoDaVisao } from '@/dominio/visao-salva'
import { IconeVisao } from './IconesVisao'

const OPCOES: Record<VisaoTarefas, { rotulo: string }> = {
  lista: { rotulo: 'Lista' },
  calendario: { rotulo: 'Calendário' },
  kanban: { rotulo: 'Quadro' },
  tabela: { rotulo: 'Tabela' },
  galeria: { rotulo: 'Galeria' },
  cronograma: { rotulo: 'Linha do tempo' },
  carga: { rotulo: 'Carga de trabalho' },
  atividade: { rotulo: 'Atividade' },
  painel: { rotulo: 'Painel' },
  documentos: { rotulo: 'Documentos' },
}

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
  const href = (visao: VisaoTarefas) => enderecoDaVisao(caminho, { ...filtros, visao })
  const aba = (visao: VisaoTarefas) => {
    const { rotulo } = OPCOES[visao]
    return (
    <Link
      key={visao}
      href={href(visao)}
      scroll={false}
      aria-current={filtros.visao === visao ? 'page' : undefined}
      className={`inline-flex items-center gap-1.5 text-rotulo font-semibold transition ${
        abas
          ? `h-9 border-b-2 px-1.5 text-corpo ${filtros.visao === visao ? 'border-texto font-semibold text-texto' : 'border-transparent font-normal text-texto-2 hover:text-texto'}`
          : `rounded-full px-3 py-1.5 ${filtros.visao === visao ? 'bg-petroleo text-claro' : 'text-texto-2 hover:bg-hover hover:text-texto'}`
      }`}
    >
      <IconeVisao visao={visao} />
      {rotulo}
    </Link>
    )
  }
  return (
    <nav className={abas ? 'flex min-w-0 items-center gap-2 overflow-x-auto border-b border-borda-fraca px-3 [scrollbar-width:none]' : 'controle flex w-fit gap-1 rounded-full border border-borda bg-white p-1'}>
      {visoes.map(aba)}
      {abas && (
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded px-2 text-corpo font-medium text-texto-3 transition hover:bg-hover hover:text-texto">
            <Plus className="h-4 w-4" /> Visualização
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44">
            {(Object.keys(OPCOES) as VisaoTarefas[]).map((visao) => {
              const { rotulo } = OPCOES[visao]
              return <DropdownMenuItem key={visao} asChild><Link href={href(visao)} scroll={false}><IconeVisao visao={visao} />{rotulo}</Link></DropdownMenuItem>
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </nav>
  )
}
