'use client'

import { Filter, Trash2 } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { removerFiltroSalvoAcao, salvarFiltroAcao } from '@/app/(app)/listas/acoes-visao'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/componentes/ui/dropdown-menu'
import { aplicarFiltroSalvo, filtrosEmTexto, type Filtros } from '@/dominio/filtros'
import { enderecoDaVisao } from '@/dominio/visao-salva'
import type { FiltroSalvo } from '@/servicos/visoes'
import { avisar } from './avisar'

/** Como os filtros se combinam (E / OU) e os filtros salvos da pessoa nesta lista. */
export function FiltrosSalvos({ listaId, filtros, salvos }: { listaId: string; filtros: Filtros; salvos: FiltroSalvo[] }) {
  const router = useRouter()
  const caminho = usePathname()
  const [pendente, iniciar] = useTransition()
  const ir = (f: Filtros) => router.replace(enderecoDaVisao(caminho, f), { scroll: false })
  const textoAtual = filtrosEmTexto(filtros)

  const salvar = () => {
    const nome = window.prompt('Nome do filtro')
    if (!nome?.trim()) return
    iniciar(async () => {
      if (avisar(await salvarFiltroAcao(listaId, nome, textoAtual), true)) router.refresh()
    })
  }
  const remover = (id: string) =>
    iniciar(async () => {
      if (avisar(await removerFiltroSalvoAcao(id), true)) router.refresh()
    })

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex h-7 items-center gap-1.5 rounded-md border border-borda bg-white px-3 text-rotulo font-medium text-texto-2 hover:bg-hover focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-petroleo/20">
        <Filter className="h-3.5 w-3.5 text-texto-3" />
        {filtros.logica === 'ou' ? 'Salvos · OU' : 'Salvos'}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Combinar filtros</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={filtros.logica} onValueChange={(v) => ir({ ...filtros, logica: v as Filtros['logica'] })}>
          <DropdownMenuRadioItem value="e">E — todos precisam bater</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="ou">OU — basta um bater</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Filtros salvos</DropdownMenuLabel>
        {salvos.length === 0 && <div className="px-2 py-1.5 text-legenda text-texto-3">Nenhum ainda.</div>}
        {salvos.map((f) => (
          <DropdownMenuItem key={f.id} onSelect={() => ir(aplicarFiltroSalvo(filtros, f.params))} className="justify-between">
            <span className="truncate">{f.nome}</span>
            <button type="button" aria-label={`Remover ${f.nome}`} disabled={pendente} onClick={(e) => { e.stopPropagation(); remover(f.id) }} className="rounded p-1 text-texto-3 hover:bg-hover hover:text-texto">
              <Trash2 className="h-3 w-3" />
            </button>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={!textoAtual || pendente} onSelect={salvar}>Salvar filtro atual…</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
