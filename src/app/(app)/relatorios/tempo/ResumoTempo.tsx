'use client'

import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, CircleDollarSign, Clock, Download, SlidersHorizontal } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { definirFaturavelAcao } from '@/app/(app)/tarefas/acoes'
import { Avatar } from '@/componentes/Avatar'
import { EstadoVazio } from '@/componentes/EstadoVazio'
import { Button } from '@/componentes/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/componentes/ui/command'
import { Input } from '@/componentes/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/componentes/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/componentes/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/componentes/ui/sheet'
import { Tabs, TabsList, TabsTrigger } from '@/componentes/ui/tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/componentes/ui/tooltip'
import { formatarDuracao } from '@/dominio/formatar'
import {
  SEM_CLIENTE,
  agrupar,
  duracaoPorExtenso,
  escreverFiltrosTempo,
  moverPeriodo,
  periodoPadrao,
  somar,
  temFiltroAtivo,
  type FiltroFaturavel,
  type FiltrosTempo,
  type GrupoResumo,
  type LinhaResumo,
  type OrdemResumo,
  type PeriodoTempo,
} from '@/dominio/tempo-faturavel'
import type { RegistroDoPeriodo } from '@/servicos/tempo'
import { registrosDoPeriodoAcao } from './acoes'

type Opcao = { id: string; nome: string }
const CAMINHO = '/relatorios/tempo'
type PainelEstado = { titulo: string; registros: RegistroDoPeriodo[] | null; erro: boolean }
const dataBr = (iso: string) => iso.split('-').reverse().join('/')
const rotuloPeriodo = (de: string, ate: string) => `${dataBr(de).slice(0, 5)} – ${dataBr(ate)}`

/** Seleção múltipla com busca (Popover + Command). */
function MultiSelecao({ rotulo, opcoes, selecionados, aoMudar, altura, avatar }: { rotulo: string; opcoes: Opcao[]; selecionados: string[]; aoMudar: (ids: string[]) => void; altura: string; avatar?: boolean }) {
  const alternar = (id: string) => aoMudar(selecionados.includes(id) ? selecionados.filter((s) => s !== id) : [...selecionados, id])
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className={`${altura} ${selecionados.length ? 'border-[var(--focus)]' : ''}`}>
          {rotulo}{selecionados.length > 0 && <span className="tabular-nums"> ({selecionados.length})</span>}
          <ChevronDown aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-0">
        <Command>
          <CommandInput placeholder={`Buscar ${rotulo.toLowerCase()}`} />
          <CommandList>
            <CommandEmpty>Nada encontrado.</CommandEmpty>
            <CommandGroup>
              {opcoes.map((o) => (
                <CommandItem key={o.id} value={o.nome} onSelect={() => alternar(o.id)} aria-selected={selecionados.includes(o.id)}>
                  <span aria-hidden="true" className={`flex h-4 w-4 items-center justify-center rounded border text-[10px] ${selecionados.includes(o.id) ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--on-primary)]' : 'border-borda'}`}>{selecionados.includes(o.id) && '✓'}</span>
                  {avatar && <Avatar nome={o.nome} tamanho="h-5 w-5 text-[9px]" />}
                  <span className="truncate">{o.nome}</span>
                  {selecionados.includes(o.id) && <span className="sr-only">(selecionado)</span>}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

function Barra({ percentual }: { percentual: number }) {
  return (
    <span aria-hidden="true" className="inline-block h-1.5 w-20 overflow-hidden rounded-sm bg-hover align-middle">
      <span className="block h-full bg-sucesso" style={{ width: `${percentual}%` }} />
    </span>
  )
}

function CartaoResumo({ rotulo, valor, detalhe, leitura }: { rotulo: string; valor: string; detalhe?: string; leitura: string }) {
  return (
    <div className="rounded-lg border border-borda bg-white p-4" aria-label={leitura} role="group">
      <p className="text-legenda font-semibold uppercase tracking-rotulo text-texto-2">{rotulo}</p>
      <p className="text-[20px] font-semibold tabular-nums text-texto">{valor}{detalhe && <span className="text-corpo font-normal text-texto-2"> · {detalhe}</span>}</p>
    </div>
  )
}

const COLUNAS: { chave: OrdemResumo['coluna']; titulo: string; alinhar: string }[] = [
  { chave: 'total', titulo: 'Total', alinhar: 'text-right' },
  { chave: 'faturavel', titulo: 'Faturável', alinhar: 'text-right' },
  { chave: 'naoFaturavel', titulo: 'Não fat.', alinhar: 'text-right' },
  { chave: 'percentual', titulo: '% fat.', alinhar: 'text-left' },
]

export function ResumoTempo({ filtros, linhas, clientes, equipe }: { filtros: FiltrosTempo; linhas: LinhaResumo[]; clientes: (Opcao & { cor: string })[]; equipe: Opcao[] }) {
  const router = useRouter()
  const [atualizando, iniciar] = useTransition()
  const [visao, setVisao] = useState<'cliente' | 'pessoa'>('cliente')
  const [ordem, setOrdem] = useState<OrdemResumo>({ coluna: 'total', direcao: 'desc' })
  const [abertos, setAbertos] = useState<Set<string>>(new Set())
  const [filtrosAbertos, setFiltrosAbertos] = useState(false)
  const [exportando, setExportando] = useState(false)
  const [painel, setPainel] = useState<PainelEstado | null>(null)

  const aplicar = (mudanca: Partial<FiltrosTempo>) => iniciar(() => router.replace(`${CAMINHO}?${escreverFiltrosTempo({ ...filtros, ...mudanca })}`, { scroll: false }))
  const totais = useMemo(() => somar(linhas), [linhas])
  const grupos = useMemo(() => agrupar(linhas, visao, ordem), [linhas, visao, ordem])
  const nomeCliente = (id: string | null) => clientes.find((c) => c.id === id)
  const opcoesCliente = [{ id: SEM_CLIENTE, nome: 'Sem cliente' }, ...clientes]
  const nFiltros = filtros.clientes.length + filtros.pessoas.length + (filtros.faturavel !== 'todos' ? 1 : 0)
  const limpar = () => aplicar({ clientes: [], pessoas: [], faturavel: 'todos' })
  const semDados = linhas.length === 0

  function ordenar(coluna: OrdemResumo['coluna']) {
    setOrdem((o) => (o.coluna === coluna ? { coluna, direcao: o.direcao === 'desc' ? 'asc' : 'desc' } : { coluna, direcao: coluna === 'nome' ? 'asc' : 'desc' }))
  }
  const ariaSort = (coluna: OrdemResumo['coluna']) => (ordem.coluna === coluna ? (ordem.direcao === 'asc' ? 'ascending' : 'descending') : 'none')

  function mudarPeriodo(p: PeriodoTempo) {
    if (p === 'intervalo') return aplicar({ periodo: p })
    aplicar({ periodo: p, ...periodoPadrao(p, filtros.de) })
  }

  async function exportar() {
    setExportando(true)
    try {
      const resposta = await fetch(`${CAMINHO}/csv?${escreverFiltrosTempo(filtros)}`)
      if (!resposta.ok) throw new Error(String(resposta.status))
      const blob = await resposta.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `tempo-${filtros.de}_a_${filtros.ate}.csv`
      a.click()
      URL.revokeObjectURL(a.href)
      toast.success(`CSV exportado (${resposta.headers.get('X-Registros') ?? '0'} registros)`)
    } catch {
      toast.error('Não foi possível exportar o CSV. Tente de novo.')
    } finally {
      setExportando(false)
    }
  }

  const altura = 'h-11 md:h-7'
  const filtrosExtras = (
    <>
      <MultiSelecao rotulo="Cliente" opcoes={opcoesCliente} selecionados={filtros.clientes} aoMudar={(clientesSel) => aplicar({ clientes: clientesSel })} altura={altura} />
      <MultiSelecao rotulo="Pessoa" opcoes={equipe} selecionados={filtros.pessoas} aoMudar={(pessoas) => aplicar({ pessoas })} altura={altura} avatar />
      <Select value={filtros.faturavel} onValueChange={(v) => aplicar({ faturavel: v as FiltroFaturavel })}>
        <SelectTrigger aria-label="Faturável" size="sm" className={altura}><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos</SelectItem>
          <SelectItem value="sim">Só faturável</SelectItem>
          <SelectItem value="nao">Só não faturável</SelectItem>
        </SelectContent>
      </Select>
      {temFiltroAtivo(filtros) && <Button variant="ghost" size="sm" className={altura} onClick={limpar}>Limpar filtros</Button>}
    </>
  )

  function abrirRegistros(titulo: string, extra: Partial<FiltrosTempo>) {
    setPainel({ titulo, registros: null, erro: false })
    void registrosDoPeriodoAcao({ ...filtros, ...extra }).then((r) =>
      setPainel((atual) => (atual?.titulo === titulo ? ('erro' in r ? { titulo, registros: null, erro: true } : { titulo, registros: r.registros, erro: false }) : atual)),
    )
  }
  const filtroDoGrupo = (g: GrupoResumo, filho?: { id: string | null }): Partial<FiltrosTempo> => {
    const cliente = visao === 'cliente' ? g.id : filho ? filho.id : null
    const pessoa = visao === 'pessoa' ? g.id : filho?.id
    return {
      clientes: visao === 'cliente' || filho ? [cliente ?? SEM_CLIENTE] : filtros.clientes,
      pessoas: pessoa ? [pessoa] : filtros.pessoas,
    }
  }

  return (
    <div className="page-shell">
      <header className="flex h-10 items-center justify-between gap-2">
        <h1 className="text-destaque font-semibold">Tempo</h1>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button variant="outline" size="sm" onClick={exportar} disabled={exportando || semDados} aria-label="Exportar CSV">
                  <Download aria-hidden="true" />
                  <span className="hidden md:inline">{exportando ? 'Exportando…' : 'Exportar CSV'}</span>
                </Button>
              </span>
            </TooltipTrigger>
            {semDados && <TooltipContent>Não há registros neste período</TooltipContent>}
          </Tooltip>
        </TooltipProvider>
      </header>

      <div className="flex min-h-11 flex-wrap items-center gap-2">
        <Tabs value={filtros.periodo} onValueChange={(v) => mudarPeriodo(v as PeriodoTempo)} className="w-full md:w-auto">
          <TabsList className="w-full md:w-auto">
            <TabsTrigger value="semana">Semana</TabsTrigger>
            <TabsTrigger value="mes">Mês</TabsTrigger>
            <TabsTrigger value="intervalo">Intervalo</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" aria-label="Período anterior" onClick={() => aplicar(moverPeriodo(filtros, -1))}><ChevronLeft /></Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="tabular-nums">{rotuloPeriodo(filtros.de, filtros.ate)}</Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-64 space-y-2 p-3">
              <label className="block text-rotulo text-texto-2">De<Input type="date" value={filtros.de} onChange={(e) => e.target.value && aplicar({ periodo: 'intervalo', de: e.target.value, ate: e.target.value > filtros.ate ? e.target.value : filtros.ate })} /></label>
              <label className="block text-rotulo text-texto-2">Até<Input type="date" value={filtros.ate} onChange={(e) => e.target.value && aplicar({ periodo: 'intervalo', ate: e.target.value, de: e.target.value < filtros.de ? e.target.value : filtros.de })} /></label>
            </PopoverContent>
          </Popover>
          <Button variant="ghost" size="icon-sm" aria-label="Próximo período" onClick={() => aplicar(moverPeriodo(filtros, 1))}><ChevronRight /></Button>
        </div>
        <div className="hidden flex-wrap items-center gap-2 md:flex">{filtrosExtras}</div>
        <Button variant="outline" size="lg" className="md:hidden" onClick={() => setFiltrosAbertos(true)}><SlidersHorizontal aria-hidden="true" />Filtros{nFiltros > 0 && ` (${nFiltros})`}</Button>
      </div>
      <Sheet open={filtrosAbertos} onOpenChange={setFiltrosAbertos}>
        <SheetContent side="bottom" className="rounded-t-[var(--r-panel)] p-4">
          <SheetTitle>Filtros</SheetTitle>
          <SheetDescription className="sr-only">Cliente, pessoa e faturável</SheetDescription>
          <div className="flex flex-col items-stretch gap-2">{filtrosExtras}</div>
        </SheetContent>
      </Sheet>

      <div aria-busy={atualizando} className={`space-y-4 ${atualizando ? 'opacity-70' : ''}`}>
        {atualizando && <div role="progressbar" aria-label="Atualizando" className="h-0.5 w-full animate-pulse bg-[var(--primary)]" />}
        {semDados ? (
          <EstadoVazio icone={Clock} titulo="Nenhum tempo registrado neste período" descricao="Escolha outro período ou limpe os filtros.">
            {temFiltroAtivo(filtros) && <Button variant="outline" size="sm" onClick={limpar}>Limpar filtros</Button>}
          </EstadoVazio>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <CartaoResumo rotulo="Total" valor={formatarDuracao(totais.total)} leitura={`Total: ${duracaoPorExtenso(totais.total)}`} />
              <CartaoResumo rotulo="Faturável" valor={formatarDuracao(totais.faturavel)} detalhe={`${totais.percentual}%`} leitura={`Faturável: ${duracaoPorExtenso(totais.faturavel)}, ${totais.percentual}%`} />
              <CartaoResumo rotulo="Não faturável" valor={formatarDuracao(totais.naoFaturavel)} leitura={`Não faturável: ${duracaoPorExtenso(totais.naoFaturavel)}`} />
            </div>

            <Tabs value={visao} onValueChange={(v) => { setVisao(v as typeof visao); setAbertos(new Set()) }}>
              <TabsList>
                <TabsTrigger value="cliente">Por cliente</TabsTrigger>
                <TabsTrigger value="pessoa">Por pessoa</TabsTrigger>
              </TabsList>
            </Tabs>

            <table className="hidden w-full text-corpo md:table">
              <caption className="sr-only">Horas por {visao} de {dataBr(filtros.de)} a {dataBr(filtros.ate)}</caption>
              <thead className="bg-[var(--bg-subtle)] text-rotulo text-texto-2">
                <tr>
                  <th scope="col" aria-sort={ariaSort('nome')} className="px-2 py-1.5 text-left font-medium">
                    <button type="button" onClick={() => ordenar('nome')} className="inline-flex items-center gap-1">{visao === 'cliente' ? 'Cliente' : 'Pessoa'}<Seta ativa={ordem.coluna === 'nome'} direcao={ordem.direcao} /></button>
                  </th>
                  {COLUNAS.map((c) => (
                    <th key={c.chave} scope="col" aria-sort={ariaSort(c.chave)} className={`px-2 py-1.5 font-medium ${c.alinhar}`}>
                      <button type="button" onClick={() => ordenar(c.chave)} className="inline-flex items-center gap-1">{c.titulo}<Seta ativa={ordem.coluna === c.chave} direcao={ordem.direcao} /></button>
                    </th>
                  ))}
                  <th scope="col" className="px-2 py-1.5"><span className="sr-only">Registros</span></th>
                </tr>
              </thead>
              <tbody>
                {grupos.map((g) => {
                  const chave = g.id ?? SEM_CLIENTE
                  const aberto = abertos.has(chave)
                  const cliente = visao === 'cliente' ? nomeCliente(g.id) : null
                  return (
                    <GrupoLinhas
                      key={chave}
                      g={g}
                      aberto={aberto}
                      visao={visao}
                      corCliente={cliente?.cor}
                      aoAlternar={() => setAbertos((a) => { const n = new Set(a); if (!n.delete(chave)) n.add(chave); return n })}
                      aoVerRegistros={(filho) => abrirRegistros(filho ? `${g.nome} · ${filho.nome}` : g.nome, filtroDoGrupo(g, filho))}
                    />
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-borda-forte font-semibold tabular-nums">
                  <th scope="row" className="px-2 py-1.5 text-left">Total</th>
                  <td className="px-2 py-1.5 text-right">{formatarDuracao(totais.total)}</td>
                  <td className="px-2 py-1.5 text-right">{formatarDuracao(totais.faturavel)}</td>
                  <td className="px-2 py-1.5 text-right">{formatarDuracao(totais.naoFaturavel)}</td>
                  <td className="px-2 py-1.5">{totais.percentual}%</td>
                  <td />
                </tr>
              </tfoot>
            </table>

            <ul className="space-y-2 md:hidden">
              {grupos.map((g) => {
                const chave = g.id ?? SEM_CLIENTE
                const aberto = abertos.has(chave)
                return (
                  <li key={chave} className="rounded-lg border border-borda bg-white p-3">
                    <button type="button" aria-expanded={aberto} onClick={() => setAbertos((a) => { const n = new Set(a); if (!n.delete(chave)) n.add(chave); return n })} className="flex min-h-11 w-full items-center justify-between gap-2 text-left">
                      <span>
                        <span className="block font-bold">{g.nome}</span>
                        <span className="block text-rotulo tabular-nums text-texto-2">{formatarDuracao(g.total)} · {g.percentual}% faturável</span>
                      </span>
                      <ChevronDown className={`h-4 w-4 transition-transform ${aberto ? 'rotate-180' : ''}`} aria-hidden="true" />
                    </button>
                    <Barra percentual={g.percentual} />
                    {aberto && (
                      <ul className="mt-2 space-y-1 border-t border-borda pt-2">
                        {g.filhos.map((f) => (
                          <li key={f.id ?? SEM_CLIENTE} className="flex justify-between text-rotulo tabular-nums">
                            <span>{f.nome}</span><span>{formatarDuracao(f.total)} · {f.percentual}%</span>
                          </li>
                        ))}
                        <li><Button variant="link" size="sm" onClick={() => abrirRegistros(g.nome, filtroDoGrupo(g))}>Ver registros</Button></li>
                      </ul>
                    )}
                  </li>
                )
              })}
              <li className="flex justify-between px-1 pt-1 font-semibold tabular-nums"><span>Total</span><span>{formatarDuracao(totais.total)} · {totais.percentual}%</span></li>
            </ul>
          </>
        )}
      </div>

      <PainelRegistros painel={painel} aoFechar={() => setPainel(null)} aoMudarRegistros={(registros) => setPainel((p) => (p ? { ...p, registros } : p))} aoAlterar={() => router.refresh()} />
    </div>
  )
}

function Seta({ ativa, direcao }: { ativa: boolean; direcao: 'asc' | 'desc' }) {
  if (!ativa) return null
  return direcao === 'asc' ? <ChevronUp className="h-3 w-3" aria-hidden="true" /> : <ChevronDown className="h-3 w-3" aria-hidden="true" />
}

function GrupoLinhas({ g, aberto, visao, corCliente, aoAlternar, aoVerRegistros }: { g: GrupoResumo; aberto: boolean; visao: 'cliente' | 'pessoa'; corCliente?: string; aoAlternar: () => void; aoVerRegistros: (filho?: { id: string | null; nome: string }) => void }) {
  const celulas = (t: { total: number; faturavel: number; naoFaturavel: number; percentual: number }) => (
    <>
      <td className="px-2 text-right tabular-nums">{formatarDuracao(t.total)}</td>
      <td className="px-2 text-right tabular-nums">{formatarDuracao(t.faturavel)}</td>
      <td className="px-2 text-right tabular-nums">{formatarDuracao(t.naoFaturavel)}</td>
      <td className="px-2 tabular-nums"><span className="inline-flex items-center gap-2"><Barra percentual={t.percentual} />{t.percentual}%</span></td>
    </>
  )
  return (
    <>
      <tr className="h-8 border-t border-borda">
        <th scope="row" className="px-2 text-left font-bold" style={visao === 'cliente' && corCliente ? { color: corCliente } : undefined}>
          <button type="button" aria-expanded={aberto} onClick={aoAlternar} className="inline-flex items-center gap-1.5">
            <ChevronRight className={`h-3.5 w-3.5 transition-transform ${aberto ? 'rotate-90' : ''}`} aria-hidden="true" />
            {g.nome}
          </button>
        </th>
        {celulas(g)}
        <td className="px-2 text-right"><Button variant="link" size="xs" onClick={() => aoVerRegistros()}>Ver registros</Button></td>
      </tr>
      {aberto && g.filhos.map((f) => (
        <tr key={f.id ?? SEM_CLIENTE} className="h-8 border-t border-borda-fraca text-texto-2">
          <th scope="row" className="py-0 pl-8 pr-2 text-left font-normal">{f.nome}</th>
          {celulas(f)}
          <td className="px-2 text-right"><Button variant="link" size="xs" onClick={() => aoVerRegistros(f)}>Ver registros</Button></td>
        </tr>
      ))}
    </>
  )
}

/** Painel lateral com os registros um a um, para corrigir a marca de faturável antes de faturar. */
function PainelRegistros({ painel, aoFechar, aoMudarRegistros, aoAlterar }: { painel: PainelEstado | null; aoFechar: () => void; aoMudarRegistros: (registros: RegistroDoPeriodo[]) => void; aoAlterar: () => void }) {
  const registros = painel?.registros ?? null
  const erro = painel?.erro ?? false
  async function alternar(r: RegistroDoPeriodo) {
    const novo = !r.faturavel
    const marcar = (valor: boolean) => registros && aoMudarRegistros(registros.map((x) => (x.id === r.id ? { ...x, faturavel: valor } : x)))
    marcar(novo)
    const resposta = await definirFaturavelAcao(r.id, novo)
    if (resposta?.erro) {
      marcar(!novo)
      toast.error('Não foi possível alterar. Tente de novo.')
    } else aoAlterar()
  }
  return (
    <Sheet open={painel !== null} onOpenChange={(a) => !a && aoFechar()}>
      <SheetContent side="right" className="w-full overflow-y-auto p-4 sm:max-w-[480px]">
        <SheetTitle>{painel?.titulo}</SheetTitle>
        <SheetDescription className="text-rotulo text-texto-2">Registros do período. Corrija a marca de faturável antes de faturar.</SheetDescription>
        {erro ? (
          <p role="alert" className="text-rotulo text-perigo-forte">Não foi possível carregar os registros.</p>
        ) : registros === null ? (
          <p className="text-rotulo text-texto-2" role="status">Carregando…</p>
        ) : registros.length === 0 ? (
          <p className="text-rotulo text-texto-2">Nenhum registro.</p>
        ) : (
          <ul className="divide-y divide-borda">
            {registros.map((r) => (
              <li key={r.id} className="flex items-start gap-2 py-2 text-rotulo">
                <div className="min-w-0 flex-1">
                  <Link href={`/tarefas/${r.tarefaId}`} className="block truncate font-medium hover:underline">{r.tarefaTitulo}</Link>
                  <p className="truncate text-texto-2">{dataBr(r.dia)} · {r.pessoaNome}{r.nota ? ` · ${r.nota}` : ''}</p>
                </div>
                <span className="shrink-0 tabular-nums">{formatarDuracao(r.segundos)}</span>
                <button
                  type="button"
                  aria-pressed={r.faturavel}
                  aria-label={r.faturavel ? 'Faturável. Clique para marcar como não faturável.' : 'Não faturável. Clique para marcar como faturável.'}
                  onClick={() => void alternar(r)}
                  className={`shrink-0 rounded p-1 hover:bg-hover ${r.faturavel ? 'text-sucesso-forte' : 'text-texto-3'}`}
                >
                  <CircleDollarSign className={`h-3.5 w-3.5 ${r.faturavel ? 'fill-sucesso-fundo' : ''}`} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </SheetContent>
    </Sheet>
  )
}
