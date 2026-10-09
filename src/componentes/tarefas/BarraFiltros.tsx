'use client'

import { ChevronDown, CircleDot, Flag, Layers3, Search, Tags, Users, X, type LucideIcon } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/componentes/ui/dropdown-menu'
import { AGRUPAMENTOS_BASICOS, ROTULO_AGRUPAMENTO } from '@/dominio/agrupamento'
import { escreverFiltros, type FiltroPrazo, type Filtros } from '@/dominio/filtros'
import { PRIORIDADES, ROTULO_PRIORIDADE } from '@/dominio/tarefas'

type Opcao = { id: string; nome: string }

const ROTULO_PRAZO: Record<FiltroPrazo, string> = {
  atrasadas: 'Atrasadas',
  hoje: 'Hoje',
  semana: 'Próximos 7 dias',
  'sem-prazo': 'Sem prazo',
}

const botao = 'inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-rotulo font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-petroleo/20'
// Filtro ativo = chip cheio na cor de ação; inativo = contorno neutro. As chaves seguem só para compatibilidade com os chamadores.
const ATIVO = 'border-petroleo bg-petroleo text-white'
const TOM = { violeta: ATIVO, azul: ATIVO, rosa: ATIVO, âmbar: ATIVO, verde: ATIVO } as const

type ChaveMulti = 'responsaveis' | 'status' | 'tags' | 'clientes' | 'prioridades'

function Multi({
  rotulo,
  chave,
  opcoes,
  filtros,
  aplicar,
  Icone,
  tom,
}: {
  rotulo: string
  chave: ChaveMulti
  opcoes: Opcao[]
  filtros: Filtros
  aplicar: (m: Partial<Filtros>) => void
  Icone: LucideIcon
  tom: keyof typeof TOM
}) {
  const marcados = filtros[chave] as string[]
  if (!opcoes.length) return null
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={`${botao} ${marcados.length ? TOM[tom] : 'border-borda bg-white text-texto-2 hover:bg-hover'}`}>
        <Icone className={`h-3.5 w-3.5 ${marcados.length ? '' : 'text-texto-3'}`} />
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
  comAgrupamento = false,
  camposAgrupaveis = [],
}: {
  filtros: Filtros
  equipe: Opcao[]
  status: Opcao[]
  tags?: Opcao[]
  clientes?: Opcao[]
  comMes?: boolean
  comAgrupamento?: boolean
  /** Campos personalizados da lista que podem virar grupo (id do campo + nome). */
  camposAgrupaveis?: Opcao[]
}) {
  const router = useRouter()
  const caminho = usePathname()
  const aplicar = (mudanca: Partial<Filtros>) => {
    const qs = escreverFiltros({ ...filtros, ...mudanca }).toString()
    router.replace(qs ? `${caminho}?${qs}` : caminho, { scroll: false })
  }

  const rotuloAgrupamento = filtros.agrupamento.startsWith('campo:')
    ? (camposAgrupaveis.find((campo) => `campo:${campo.id}` === filtros.agrupamento)?.nome ?? ROTULO_AGRUPAMENTO.status)
    : ROTULO_AGRUPAMENTO[filtros.agrupamento as keyof typeof ROTULO_AGRUPAMENTO]

  const algum =
    filtros.responsaveis.length + filtros.status.length + filtros.prioridades.length + filtros.tags.length + filtros.clientes.length > 0 ||
    !!filtros.prazo ||
    !!filtros.mes ||
    !!filtros.busca

  return (
    <div className="flex flex-wrap items-center gap-2">
      {comAgrupamento && (
        <DropdownMenu>
          <DropdownMenuTrigger className={`${botao} border-borda bg-white text-texto-2 hover:bg-hover`}>
            <Layers3 className="h-3.5 w-3.5" /> Agrupar: {rotuloAgrupamento}
            <ChevronDown className="h-3 w-3" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="max-h-80 overflow-y-auto">
            <DropdownMenuRadioGroup value={filtros.agrupamento} onValueChange={(v) => aplicar({ agrupamento: v })}>
              {AGRUPAMENTOS_BASICOS.map((grupo) => (
                <DropdownMenuRadioItem key={grupo} value={grupo}>{ROTULO_AGRUPAMENTO[grupo]}</DropdownMenuRadioItem>
              ))}
              {camposAgrupaveis.length > 0 && <DropdownMenuSeparator />}
              {camposAgrupaveis.length > 0 && <DropdownMenuLabel>Campos personalizados</DropdownMenuLabel>}
              {camposAgrupaveis.map((campo) => (
                <DropdownMenuRadioItem key={campo.id} value={`campo:${campo.id}`}>{campo.nome}</DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      <Multi filtros={filtros} aplicar={aplicar} rotulo="Responsável" chave="responsaveis" opcoes={equipe} Icone={Users} tom="azul" />
      <Multi filtros={filtros} aplicar={aplicar} rotulo="Status" chave="status" opcoes={status} Icone={CircleDot} tom="violeta" />
      <Multi filtros={filtros} aplicar={aplicar} rotulo="Prioridade" chave="prioridades" opcoes={PRIORIDADES.map((p) => ({ id: p, nome: ROTULO_PRIORIDADE[p] }))} Icone={Flag} tom="âmbar" />
      <Multi filtros={filtros} aplicar={aplicar} rotulo="Etiqueta" chave="tags" opcoes={tags} Icone={Tags} tom="rosa" />
      {clientes && <Multi filtros={filtros} aplicar={aplicar} rotulo="Tag do cliente" chave="clientes" opcoes={clientes.map((cliente) => ({ ...cliente, nome: `@${cliente.nome}` }))} Icone={Tags} tom="verde" />}
      <DropdownMenu>
        <DropdownMenuTrigger className={`${botao} ${filtros.prazo ? ATIVO : 'border-borda bg-white text-texto-2 hover:bg-hover'}`}>
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
      <form
        onSubmit={(e) => {
          e.preventDefault()
          aplicar({ busca: String(new FormData(e.currentTarget).get('busca') ?? '').trim() })
        }}
        className="relative ml-auto min-w-44 flex-1 sm:max-w-64"
      >
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-texto-3" />
        <input
          key={filtros.busca}
          name="busca"
          defaultValue={filtros.busca}
          aria-label="Pesquisar tarefas"
          placeholder="Pesquisar tarefas…" autoComplete="off"
          className="h-8 w-full rounded-full border border-borda bg-white pl-8 pr-8 text-rotulo outline-none transition focus-visible:border-petroleo focus-visible:ring-3 focus-visible:ring-petroleo/15"
        />
        {filtros.busca && <button type="button" aria-label="Limpar pesquisa" onClick={() => aplicar({ busca: '' })} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-texto-3 hover:bg-hover"><X className="h-3 w-3" /></button>}
      </form>
      {algum && (
        <button
          onClick={() => aplicar({ responsaveis: [], status: [], prioridades: [], tags: [], clientes: [], prazo: null, mes: null, busca: '' })}
          className={`${botao} border-transparent text-texto-3 hover:text-texto`}
        >
          <X className="h-3 w-3" /> Limpar
        </button>
      )}
    </div>
  )
}
