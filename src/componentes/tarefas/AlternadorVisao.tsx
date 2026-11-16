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
          : `rounded-md px-3 py-1.5 ${filtros.visao === visao ? 'bg-petroleo text-claro' : 'text-texto-2 hover:bg-hover hover:text-texto'}`
      }`}
    >
      <IconeVisao visao={visao} />
      {rotulo}
    </Link>
    )
  }
  // O Canal é o chat da própria lista (a rota cria o canal na primeira vez). Uma barrinha separa o Canal dos tipos de visualização.
  const listaId = caminho.startsWith('/listas/') ? caminho.split('/')[2] : null
  const abaEstilo = { height: 36, display: 'flex', alignItems: 'center', gap: 6, padding: '0 6px', borderBottom: '2px solid transparent', fontSize: 13, whiteSpace: 'nowrap', color: 'inherit' } as const
  return (
    <nav role="tablist" className={abas ? 'flex min-w-0 items-stretch overflow-x-auto [scrollbar-width:none]' : 'controle flex w-fit gap-1 rounded-md border border-borda bg-white p-1'} style={abas ? { height: 36, gap: 4, padding: '0 10px', borderBottom: '1px solid var(--border)', color: 'var(--text-2)' } : undefined}>
      {abas && listaId && (
        <>
          <Link href={`/listas/${listaId}/canal`} className="hover:text-[var(--text)]" style={abaEstilo}><IconeVisao visao="canal" />Canal</Link>
          <div aria-hidden="true" style={{ width: 1, height: 16, background: 'var(--border)', margin: '10px 4px', flex: 'none' }} />
        </>
      )}
      {visoes.map(aba)}
      {abas && <div aria-hidden="true" style={{ width: 1, height: 16, background: 'var(--border)', margin: '10px 4px', flex: 'none' }} />}
      {abas && (
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center gap-1 self-center whitespace-nowrap text-texto-3 hover:bg-hover hover:text-texto" style={{ height: 28, padding: '0 8px', borderRadius: 4, fontSize: 13 }}>
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
