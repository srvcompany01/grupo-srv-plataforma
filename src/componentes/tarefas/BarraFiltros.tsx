'use client'

import { Ic } from '@/componentes/app/Ic'
import { EVENTO_ABRIR_COLUNAS } from '@/dominio/eventos-lista'
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
      <DropdownMenuTrigger>
        <Icone />
        {rotulo}
        {marcados.length > 0 && ` · ${marcados.length}`}
        <ChevronDown />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
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
    <div>
      {comAgrupamento && (
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={`Agrupar por: ${rotuloAgrupamento}`}
            title="Agrupar por"
          >
            <Ic n="layers" s={15} style={{ color: 'var(--text-2)' }} />
            {rotuloAgrupamento}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
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
          <Popover>
            <PopoverTrigger title="Subtarefas" aria-label="Opções de subtarefas" style={filtros.subtarefas === 'planas' ? { background: 'var(--bg-active)', color: 'var(--text)' } : undefined}><Ic n="account_tree" s={16} /></PopoverTrigger>
            <PopoverContent align="start">
              {([
                { chave: 'expandidas', titulo: 'Expandir subtarefas', texto: 'As tarefas já abrem mostrando as subtarefas.', ligado: filtros.expandidas, desabilitado: filtros.subtarefas === 'planas', mudar: () => aplicar({ expandidas: !filtros.expandidas }) },
                { chave: 'planas', titulo: 'Subtarefas como tarefas principais', texto: 'Mostra só as subtarefas, soltas, e esconde as tarefas-mãe. Assim os posts aparecem juntos e dá para agrupar por formato, mês e outros campos.', ligado: filtros.subtarefas === 'planas', desabilitado: false, mudar: () => aplicar({ subtarefas: filtros.subtarefas === 'planas' ? 'normal' : 'planas' }) },
              ] as const).map((o) => (
                <div key={o.chave} style={{ opacity: o.desabilitado ? 0.5 : 1 }}>
                  <span><span>{o.titulo}</span><span>{o.texto}</span></span>
                  <button type="button" role="switch" aria-checked={o.ligado} aria-label={o.titulo} disabled={o.desabilitado} onClick={o.mudar} style={{ width: 28, height: 16, flex: 'none', marginTop: 2, borderRadius: 8, border: 0, padding: 0, position: 'relative', cursor: 'pointer', background: o.ligado ? 'var(--primary)' : 'var(--border-strong)', transition: 'background 150ms' }}>
                    <span style={{ position: 'absolute', top: 2, left: o.ligado ? 14 : 2, width: 12, height: 12, borderRadius: '50%', background: 'var(--bg)', transition: 'left 150ms' }} />
                  </button>
                </div>
              ))}
            </PopoverContent>
          </Popover>
          <button type="button" title="Colunas" aria-label="Colunas" onClick={() => window.dispatchEvent(new Event(EVENTO_ABRIR_COLUNAS))}><Ic n="view_week" s={16} /></button>
        </>
      )}
      <Popover>
        <PopoverTrigger>
          <Ic n="filter_list" s={16} /> Filtro{nFiltros > 0 && <span style={{ minWidth: 16, height: 16, padding: '0 4px', borderRadius: 4, background: 'var(--primary)', color: 'var(--on-primary)', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{nFiltros}</span>}
        </PopoverTrigger>
        <PopoverContent align="start">
      <Multi filtros={filtros} aplicar={aplicar} rotulo="Responsável" chave="responsaveis" opcoes={equipe} Icone={Users} tom="azul" />
      <Multi filtros={filtros} aplicar={aplicar} rotulo="Status" chave="status" opcoes={status} Icone={CircleDot} tom="violeta" />
      <Multi filtros={filtros} aplicar={aplicar} rotulo="Prioridade" chave="prioridades" opcoes={PRIORIDADES.map((p) => ({ id: p, nome: ROTULO_PRIORIDADE[p] }))} Icone={Flag} tom="âmbar" />
      <Multi filtros={filtros} aplicar={aplicar} rotulo="Etiqueta" chave="tags" opcoes={tags} Icone={Tags} tom="rosa" />
      {clientes && <Multi filtros={filtros} aplicar={aplicar} rotulo="Tag do cliente" chave="clientes" opcoes={clientes.map((cliente) => ({ ...cliente, nome: `@${cliente.nome}` }))} Icone={Tags} tom="verde" />}
      <DropdownMenu>
        <DropdownMenuTrigger>
          {filtros.prazo ? ROTULO_PRAZO[filtros.prazo] : 'Vencimento'}
          <ChevronDown />
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
        />
      )}
        </PopoverContent>
      </Popover>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          aplicar({ busca: String(new FormData(e.currentTarget).get('busca') ?? '').trim() })
        }}
        className="hidden lg:block"
      >
        <Ic n="search" s={15} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
        <input
          key={filtros.busca}
          name="busca"
          defaultValue={filtros.busca}
          aria-label="Pesquisar tarefas"
          placeholder="Buscar na lista" autoComplete="off"
        />
        {filtros.busca && <button type="button" aria-label="Limpar pesquisa" onClick={() => aplicar({ busca: '' })}><X /></button>}
      </form>
      {algum && (
        <button
          onClick={() => aplicar({ responsaveis: [], status: [], prioridades: [], tags: [], clientes: [], prazo: null, mes: null, busca: '' })}
        >
          <X /> Limpar
        </button>
      )}
    </div>
  )
}
