'use client'

import { ChevronDown, X } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/componentes/ui/dropdown-menu'
import { escreverFiltros, type FiltroPrazo, type Filtros } from '@/dominio/filtros'
import { PRIORIDADES, ROTULO_PRIORIDADE } from '@/dominio/tarefas'

type Opcao = { id: string; nome: string }

const ROTULO_PRAZO: Record<FiltroPrazo, string> = {
  atrasadas: 'Atrasadas',
  hoje: 'Hoje',
  semana: 'Próximos 7 dias',
  'sem-prazo': 'Sem prazo',
}

const botao = 'inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[12px] font-medium transition-all focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-marca/15'

type ChaveMulti = 'responsaveis' | 'status' | 'tags' | 'clientes' | 'prioridades'

function Multi({
  rotulo,
  chave,
  opcoes,
  filtros,
  aplicar,
}: {
  rotulo: string
  chave: ChaveMulti
  opcoes: Opcao[]
  filtros: Filtros
  aplicar: (m: Partial<Filtros>) => void
}) {
  const marcados = filtros[chave] as string[]
  if (!opcoes.length) return null
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={`${botao} ${marcados.length ? 'border-marca bg-marca-fundo text-marca' : 'border-borda bg-white text-texto-2 hover:bg-hover'}`}>
        {rotulo}
        {marcados.length > 0 && ` · ${marcados.length}`}
        <ChevronDown className="h-3 w-3" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-80 overflow-y-auto">
        {opcoes.map((o) => (
          <DropdownMenuCheckboxItem
            key={o.id}
            checked={marcados.includes(o.id)}
            onSelect={(e) => e.preventDefault()}
            onCheckedChange={(v) => aplicar({ [chave]: v ? [...marcados, o.id] : marcados.filter((x) => x !== o.id) } as Partial<Filtros>)}
          >
            {o.nome}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function BarraFiltros({
  filtros,
  equipe,
  status,
  tags = [],
  clientes,
  comMes = false,
}: {
  filtros: Filtros
  equipe: Opcao[]
  status: Opcao[]
  tags?: Opcao[]
  clientes?: Opcao[]
  comMes?: boolean
}) {
  const router = useRouter()
  const caminho = usePathname()
  const aplicar = (mudanca: Partial<Filtros>) => {
    const qs = escreverFiltros({ ...filtros, ...mudanca }).toString()
    router.replace(qs ? `${caminho}?${qs}` : caminho, { scroll: false })
  }

  const algum =
    filtros.responsaveis.length + filtros.status.length + filtros.prioridades.length + filtros.tags.length + filtros.clientes.length > 0 ||
    !!filtros.prazo ||
    !!filtros.mes

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Multi filtros={filtros} aplicar={aplicar} rotulo="Responsável" chave="responsaveis" opcoes={equipe} />
      <Multi filtros={filtros} aplicar={aplicar} rotulo="Status" chave="status" opcoes={status} />
      <Multi filtros={filtros} aplicar={aplicar} rotulo="Prioridade" chave="prioridades" opcoes={PRIORIDADES.map((p) => ({ id: p, nome: ROTULO_PRIORIDADE[p] }))} />
      <Multi filtros={filtros} aplicar={aplicar} rotulo="Etiqueta" chave="tags" opcoes={tags} />
      {clientes && <Multi filtros={filtros} aplicar={aplicar} rotulo="Cliente" chave="clientes" opcoes={clientes} />}
      <DropdownMenu>
        <DropdownMenuTrigger className={`${botao} ${filtros.prazo ? 'border-marca bg-marca-fundo text-marca' : 'border-borda bg-white text-texto-2 hover:bg-hover'}`}>
          {filtros.prazo ? ROTULO_PRAZO[filtros.prazo] : 'Prazo'}
          <ChevronDown className="h-3 w-3" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuRadioGroup value={filtros.prazo ?? ''} onValueChange={(v) => aplicar({ prazo: (v || null) as FiltroPrazo | null })}>
            <DropdownMenuRadioItem value="">Qualquer</DropdownMenuRadioItem>
            {(Object.keys(ROTULO_PRAZO) as FiltroPrazo[]).map((p) => (
              <DropdownMenuRadioItem key={p} value={p}>
                {ROTULO_PRAZO[p]}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      {comMes && (
        <input
          type="month"
          aria-label="Mês de referência"
          value={filtros.mes?.slice(0, 7) ?? ''}
          onChange={(e) => aplicar({ mes: e.target.value ? `${e.target.value}-01` : null })}
          className={`${botao} border-borda bg-white text-texto-2`}
        />
      )}
      {algum && (
        <button
          onClick={() => aplicar({ responsaveis: [], status: [], prioridades: [], tags: [], clientes: [], prazo: null, mes: null })}
          className={`${botao} border-transparent text-texto-3 hover:text-texto`}
        >
          <X className="h-3 w-3" /> Limpar
        </button>
      )}
    </div>
  )
}
