'use client'

import { Ic } from '@/componentes/app/Ic'
import { EVENTO_ABRIR_COLUNAS, EVENTO_EXPANDIR_SUBTAREFAS } from '@/dominio/eventos-lista'
import { ChevronDown, CircleDot, Flag, Tags, Users, X, type LucideIcon } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { Popover, PopoverContent, PopoverTrigger } from '@/componentes/ui/popover'
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
import { type FiltroPrazo, type Filtros } from '@/dominio/filtros'
import { enderecoDaVisao } from '@/dominio/visao-salva'
import { PRIORIDADES, ROTULO_PRIORIDADE } from '@/dominio/tarefas'

type Opcao = { id: string; nome: string }

const ROTULO_PRAZO: Record<FiltroPrazo, string> = {
  atrasadas: 'Atrasadas',
  hoje: 'Hoje',
  semana: 'Próximos 7 dias',
  'sem-prazo': 'Sem vencimento',
}

const botao = 'inline-flex h-7 items-center gap-1.5 rounded-md border px-2.5 text-rotulo font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-petroleo/20'
// Filtro ativo = chip cheio na cor de ação; inativo = contorno neutro. As chaves seguem só para compatibilidade com os chamadores.
const ATIVO = 'border-petroleo bg-petroleo text-claro'
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
    router.replace(enderecoDaVisao(caminho, { ...filtros, ...mudanca }), { scroll: false })
  }

  const rotuloAgrupamento = filtros.agrupamento.startsWith('campo:')
    ? (camposAgrupaveis.find((campo) => `campo:${campo.id}` === filtros.agrupamento)?.nome ?? ROTULO_AGRUPAMENTO.status)
    : ROTULO_AGRUPAMENTO[filtros.agrupamento as keyof typeof ROTULO_AGRUPAMENTO]

  const nFiltros = filtros.responsaveis.length + filtros.status.length + filtros.prioridades.length + filtros.tags.length + filtros.clientes.length + (filtros.prazo ? 1 : 0) + (filtros.mes ? 1 : 0)
  const algum =
    filtros.responsaveis.length + filtros.status.length + filtros.prioridades.length + filtros.tags.length + filtros.clientes.length > 0 ||
    !!filtros.prazo ||
    !!filtros.mes ||
    !!filtros.busca

  return (
    <div className="flex items-center gap-1">
      {comAgrupamento && (
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={`Agrupar por: ${rotuloAgrupamento}`}
            title="Agrupar por"
            className="b-pill"
          >
            <Ic n="layers" s={15} style={{ color: 'var(--text-2)' }} />
            {rotuloAgrupamento}
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
      {comAgrupamento && (
        <>
          <button type="button" title="Expandir/recolher subtarefas" aria-label="Expandir ou recolher subtarefas" onClick={() => window.dispatchEvent(new Event(EVENTO_EXPANDIR_SUBTAREFAS))} className="b-icon"><Ic n="account_tree" s={16} /></button>
          <button type="button" title="Colunas" aria-label="Colunas" onClick={() => window.dispatchEvent(new Event(EVENTO_ABRIR_COLUNAS))} className="b-icon"><Ic n="view_week" s={16} /></button>
        </>
      )}
      <Popover>
        <PopoverTrigger className={`b-ghost ml-auto ${nFiltros ? 'on' : ''}`}>
          <Ic n="filter_list" s={16} /> Filtro{nFiltros > 0 && <span style={{ minWidth: 16, height: 16, padding: '0 4px', borderRadius: 4, background: 'var(--primary)', color: 'var(--on-primary)', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{nFiltros}</span>}
        </PopoverTrigger>
        <PopoverContent align="start" className="flex w-[22rem] flex-wrap gap-2 p-3">
      <Multi filtros={filtros} aplicar={aplicar} rotulo="Responsável" chave="responsaveis" opcoes={equipe} Icone={Users} tom="azul" />
      <Multi filtros={filtros} aplicar={aplicar} rotulo="Status" chave="status" opcoes={status} Icone={CircleDot} tom="violeta" />
      <Multi filtros={filtros} aplicar={aplicar} rotulo="Prioridade" chave="prioridades" opcoes={PRIORIDADES.map((p) => ({ id: p, nome: ROTULO_PRIORIDADE[p] }))} Icone={Flag} tom="âmbar" />
      <Multi filtros={filtros} aplicar={aplicar} rotulo="Etiqueta" chave="tags" opcoes={tags} Icone={Tags} tom="rosa" />
      {clientes && <Multi filtros={filtros} aplicar={aplicar} rotulo="Tag do cliente" chave="clientes" opcoes={clientes.map((cliente) => ({ ...cliente, nome: `@${cliente.nome}` }))} Icone={Tags} tom="verde" />}
      <DropdownMenu>
        <DropdownMenuTrigger className={`${botao} ${filtros.prazo ? ATIVO : 'border-borda bg-white text-texto-2 hover:bg-hover'}`}>
          {filtros.prazo ? ROTULO_PRAZO[filtros.prazo] : 'Vencimento'}
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
        </PopoverContent>
      </Popover>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          aplicar({ busca: String(new FormData(e.currentTarget).get('busca') ?? '').trim() })
        }}
        className="relative hidden w-44 shrink-0 lg:block"
      >
        <Ic n="search" s={15} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
        <input
          key={filtros.busca}
          name="busca"
          defaultValue={filtros.busca}
          aria-label="Pesquisar tarefas"
          placeholder="Buscar na lista" autoComplete="off"
          className="h-7 w-full rounded-md border border-borda bg-white pl-7 pr-7 text-[13px] outline-none transition focus-visible:border-[var(--focus)] focus-visible:ring-3 focus-visible:ring-[var(--focus-ring)]"
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
