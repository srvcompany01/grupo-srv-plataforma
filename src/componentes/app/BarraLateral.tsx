'use client'

import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useDroppable, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  CheckSquare,
  ChevronRight,
  GripVertical,
  LogOut,
  Menu,
  Settings,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useMemo, useState, useTransition, type ComponentType, type CSSProperties, type ReactNode } from 'react'
import { moverItemNavegacao } from '@/app/(app)/acoes-navegacao'
import { avisar } from '@/componentes/tarefas/avisar'
import { Avatar } from '@/componentes/Avatar'
import { IconeVisual } from '@/componentes/IconeVisual'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/componentes/ui/sheet'
import { IndicadorCronometro } from './IndicadorCronometro'
import { SinoAvisos } from './SinoAvisos'
import type { Aviso } from '@/servicos/avisos'
import type { CronometroAtivo } from '@/servicos/tempo'
import { CriarEspacoDialog, CriarEstruturaDialog, PersonalizarItemDialog } from './CriadoresNavegacao'
import type { ItemLista, Navegacao, NoEspaco, NoPasta } from '@/dominio/arvore-espacos'
import { rotuloMes } from '@/dominio/formatar'
import { sair } from '@/app/(auth)/login/acoes'

type Opcao = { id: string; nome: string }
type Props = { navegacao: Navegacao; clientes: Opcao[]; nome: string; papel: string; cronometro: CronometroAtivo | null; avisos: Aviso[]; naoLidos: number; euId: string }
type IconeLucide = ComponentType<{ className?: string }>
type TipoArrastavel = 'space' | 'folder' | 'list'

const item =
  'flex h-8 items-center gap-2 rounded-md px-2 text-[11px] tracking-[0.04em] text-white/75 transition-colors hover:bg-white/10 hover:text-white'
const ativo = 'bg-white/15 font-semibold text-white hover:bg-white/20 hover:text-white'

function idArrastavel(tipo: TipoArrastavel, id: string) {
  return `${tipo}:${id}`
}

function LinhaArrastavel({ tipo, id, habilitado, className, style, children }: {
  tipo: TipoArrastavel
  id: string
  habilitado: boolean
  className: string
  style?: CSSProperties
  children: ReactNode
}) {
  const { attributes, listeners, setActivatorNodeRef, setNodeRef, transform, transition, isDragging } = useSortable({
    id: idArrastavel(tipo, id),
    data: { tipo, id },
    disabled: !habilitado,
  })
  return (
    <div
      ref={setNodeRef}
      className={`${className} ${isDragging ? 'z-20 opacity-45 ring-1 ring-marca/40' : ''}`}
      style={{ ...style, transform: CSS.Transform.toString(transform), transition }}
    >
      {habilitado && (
        <button ref={setActivatorNodeRef} type="button" aria-label="Arrastar para organizar" className="-ml-1 cursor-grab touch-none rounded p-0.5 text-white/40 opacity-0 hover:bg-white/10 hover:text-white focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-marca group-hover:opacity-100 active:cursor-grabbing" {...attributes} {...listeners}>
          <GripVertical className="h-3 w-3" />
        </button>
      )}
      {children}
    </div>
  )
}

function ZonaRaiz({ visivel }: { visivel: boolean }) {
  const { isOver, setNodeRef } = useDroppable({ id: 'root', data: { tipo: 'root' } })
  if (!visivel) return null
  return <div ref={setNodeRef} className={`mx-1 my-2 rounded-lg border border-dashed px-3 py-2 text-center text-[10px] transition ${isOver ? 'border-white bg-white/10 text-white' : 'border-white/25 text-white/60'}`}>Solte aqui para deixar sem espaço</div>
}

function idsDaNavegacao(navegacao: Navegacao): string[] {
  const ids: string[] = []
  const adicionarEspaco = (espaco: NoEspaco) => {
    ids.push(idArrastavel('space', espaco.id))
    espaco.filhos.forEach(adicionarEspaco)
    for (const pasta of espaco.pastas) {
      ids.push(idArrastavel('folder', pasta.id))
      pasta.listas.forEach((lista) => ids.push(idArrastavel('list', lista.id)))
    }
    espaco.listas.forEach((lista) => ids.push(idArrastavel('list', lista.id)))
  }
  navegacao.espacos.forEach(adicionarEspaco)
  for (const pasta of navegacao.pastasRaiz) {
    ids.push(idArrastavel('folder', pasta.id))
    pasta.listas.forEach((lista) => ids.push(idArrastavel('list', lista.id)))
  }
  navegacao.listasRaiz.forEach((lista) => ids.push(idArrastavel('list', lista.id)))
  return ids
}

function LinkLista({ lista, nivel, podeGerir, podeArrastar }: { lista: ItemLista; nivel: number; podeGerir: boolean; podeArrastar: boolean }) {
  const caminho = usePathname()
  const href = `/listas/${lista.id}`
  const detalhe = [`@${lista.clienteNome}`, lista.mes && rotuloMes(lista.mes)].filter(Boolean).join(' · ')

  return (
    <LinhaArrastavel
      tipo="list"
      id={lista.id}
      habilitado={podeArrastar}
      className={`${item} group ${caminho === href ? ativo : ''}`}
      style={{ paddingLeft: 10 + nivel * 14 }}
    >
      <Link href={href} title={[lista.nome, detalhe].filter(Boolean).join(' · ')} className="flex min-w-0 flex-1 items-center gap-2">
        <span style={{ color: lista.cor }}><IconeVisual icone={lista.icone} emoji={lista.emoji} className="h-3.5 w-3.5" /></span>
        <span className="min-w-0 flex-1 truncate">{lista.nome}</span>
      </Link>
      {podeGerir && <PersonalizarItemDialog tipo="lists" id={lista.id} nomeInicial={lista.nome} visualInicial={{ cor: lista.cor, icone: lista.icone, emoji: lista.emoji }} />}
    </LinhaArrastavel>
  )
}

function Pasta({ pasta, nivel, contexto, pastas, clientes, podeGerir, podeArrastar }: { pasta: NoPasta; nivel: number; contexto: Opcao | null; pastas: NoPasta[]; clientes: Opcao[]; podeGerir: boolean; podeArrastar: boolean }) {
  const [aberta, setAberta] = useState(true)

  return (
    <div>
      <LinhaArrastavel tipo="folder" id={pasta.id} habilitado={podeArrastar} className={`${item} group w-full`} style={{ paddingLeft: 6 + nivel * 14 }}>
        <button type="button" onClick={() => setAberta(!aberta)} aria-label={aberta ? `Recolher ${pasta.nome}` : `Expandir ${pasta.nome}`} aria-expanded={aberta} className="rounded p-0.5 hover:bg-white/10">
          <ChevronRight className={`h-3 w-3 shrink-0 text-white/50 transition-transform ${aberta ? 'rotate-90' : ''}`} />
        </button>
        <span style={{ color: pasta.cor }}><IconeVisual icone={pasta.icone} emoji={pasta.emoji} className="h-3.5 w-3.5" /></span>
        <button type="button" onClick={() => setAberta(!aberta)} className="min-w-0 flex-1 truncate text-left">{pasta.nome}</button>
        <span className="ml-auto text-[9px] tabular-nums text-white/50">{pasta.listas.length}</span>
        {podeGerir && <CriarEstruturaDialog espaco={contexto} pastas={pastas} clientes={clientes} pastaInicial={pasta.id} modoInicial="lista" />}
        {podeGerir && <PersonalizarItemDialog tipo="folders" id={pasta.id} nomeInicial={pasta.nome} visualInicial={{ cor: pasta.cor, icone: pasta.icone, emoji: pasta.emoji }} />}
      </LinhaArrastavel>
      {aberta && pasta.listas.map((lista) => <LinkLista key={lista.id} lista={lista} nivel={nivel + 1} podeGerir={podeGerir} podeArrastar={podeArrastar} />)}
    </div>
  )
}

function Espaco({ espaco, nivel, clientes, podeGerir, podeEditarEspaco, podeArrastar }: { espaco: NoEspaco; nivel: number; clientes: Opcao[]; podeGerir: boolean; podeEditarEspaco: boolean; podeArrastar: boolean }) {
  const caminho = usePathname()
  const [aberto, setAberto] = useState(true)
  const href = `/espacos/${espaco.id}`
  const temConteudo = espaco.filhos.length + espaco.pastas.length + espaco.listas.length > 0

  return (
    <div>
      <LinhaArrastavel tipo="space" id={espaco.id} habilitado={podeArrastar} className={`${item} group ${caminho === href ? ativo : ''}`} style={{ paddingLeft: 6 + nivel * 14 }}>
        <button
          type="button"
          onClick={() => temConteudo && setAberto(!aberto)}
          aria-label={aberto ? 'Recolher espaço' : 'Expandir espaço'}
          aria-expanded={aberto}
          className={`rounded p-0.5 hover:bg-white/10 ${temConteudo ? '' : 'invisible'}`}
        >
          <ChevronRight className={`h-3 w-3 transition-transform ${aberto ? 'rotate-90' : ''}`} />
        </button>
        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] text-white" style={{ background: espaco.cor }}>
          <IconeVisual icone={espaco.icone} emoji={espaco.emoji} className="h-2.5 w-2.5" />
        </span>
        <Link href={href} className="min-w-0 flex-1 truncate">
          {espaco.nome}
        </Link>
        {podeGerir && <CriarEstruturaDialog espaco={{ id: espaco.id, nome: espaco.nome }} pastas={espaco.pastas} clientes={clientes} />}
        {podeEditarEspaco && <PersonalizarItemDialog tipo="spaces" id={espaco.id} nomeInicial={espaco.nome} visualInicial={{ cor: espaco.cor, icone: espaco.icone, emoji: espaco.emoji }} />}
      </LinhaArrastavel>

      {aberto && (
        <div>
          {espaco.filhos.map((filho) => <Espaco key={filho.id} espaco={filho} nivel={nivel + 1} clientes={clientes} podeGerir={podeGerir} podeEditarEspaco={podeEditarEspaco} podeArrastar={podeArrastar} />)}
          {espaco.pastas.map((pasta) => <Pasta key={pasta.id} pasta={pasta} nivel={nivel + 1} contexto={{ id: espaco.id, nome: espaco.nome }} pastas={espaco.pastas} clientes={clientes} podeGerir={podeGerir} podeArrastar={podeArrastar} />)}
          {espaco.listas.map((lista) => <LinkLista key={lista.id} lista={lista} nivel={nivel + 1} podeGerir={podeGerir} podeArrastar={podeArrastar} />)}
        </div>
      )}
    </div>
  )
}

function Painel({ navegacao, clientes, nome, papel, cronometro, avisos, naoLidos, euId }: Props) {
  const caminho = usePathname()
  const router = useRouter()
  const [arrastando, setArrastando] = useState(false)
  const [movendo, iniciarMovimento] = useTransition()
  const podeArrastar = papel === 'admin'
  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const arvore = navegacao.espacos
  const itensOrdenaveis = useMemo(() => idsDaNavegacao(navegacao), [navegacao])

  const concluirMovimento = (evento: DragEndEvent) => {
    setArrastando(false)
    if (!evento.over) return
    const origem = evento.active.data.current as { tipo?: TipoArrastavel; id?: string } | undefined
    const destino = evento.over.data.current as { tipo?: TipoArrastavel | 'root'; id?: string } | undefined
    if (!origem?.tipo || !origem.id || !destino?.tipo) return
    if (destino.tipo !== 'root' && !destino.id) return
    const tipoOrigem = origem.tipo
    const idOrigem = origem.id
    const tipoDestino = destino.tipo
    const idDestino = destino.id
    iniciarMovimento(async () => {
      const alvo = tipoDestino === 'root' ? { tipo: 'root' as const } : { tipo: tipoDestino, id: idDestino as string }
      if (!avisar(await moverItemNavegacao({ tipo: tipoOrigem, id: idOrigem, alvo }), true)) return
      router.refresh()
    })
  }

  const link = (href: string, rotulo: string, Icone: IconeLucide) => (
    <Link href={href} className={`${item} ${caminho.startsWith(href) ? ativo : ''}`}>
      <Icone className="h-3.5 w-3.5 text-white/70" />
      <span className="truncate">{rotulo}</span>
    </Link>
  )

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col bg-lateral text-white">
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-white/10 px-4">
        <p className="min-w-0 flex-1 truncate text-[13px] font-bold tracking-[0.22em] text-white">Grupo SRV</p>
        <SinoAvisos avisos={avisos} naoLidos={naoLidos} euId={euId} />
      </div>

      <div className={`min-h-0 flex-1 overflow-y-auto px-2 py-2 ${movendo ? 'pointer-events-none opacity-70' : ''}`}>
        <div className="flex h-8 items-center px-2">
          <h2 className="text-[10px] font-semibold tracking-[0.18em] text-white/55">Navegação</h2>
        </div>
        <nav className="space-y-0.5">
          {link('/inicio', 'Minhas tarefas', CheckSquare)}
          {link('/clientes', 'Clientes', Users)}
          {papel === 'admin' && link('/config', 'Configurações', Settings)}
        </nav>

        <div className="mx-2 my-3 border-t border-white/10" />

        <DndContext sensors={sensores} collisionDetection={closestCenter} onDragStart={() => setArrastando(true)} onDragCancel={() => setArrastando(false)} onDragEnd={concluirMovimento}>
          <SortableContext items={itensOrdenaveis} strategy={verticalListSortingStrategy}>
            <div className="flex h-8 items-center px-2">
              <h2 className="min-w-0 flex-1 text-[10px] font-semibold tracking-[0.18em] text-white/55">Espaços</h2>
              {papel === 'admin' && <CriarEspacoDialog pais={arvore.map((espaco) => ({ id: espaco.id, nome: espaco.nome }))} />}
            </div>

            <nav className="space-y-0.5">
              {arvore.length === 0 && <p className="px-2 py-2 text-[11px] leading-5 text-white/50">Você ainda não faz parte de nenhum departamento.</p>}
              {arvore.map((espaco) => <Espaco key={espaco.id} espaco={espaco} nivel={0} clientes={clientes} podeGerir={papel === 'admin' || papel === 'gestor'} podeEditarEspaco={papel === 'admin'} podeArrastar={podeArrastar} />)}
            </nav>

            {(papel === 'admin' || navegacao.pastasRaiz.length > 0 || navegacao.listasRaiz.length > 0) && (
              <div className="mt-3 border-t border-white/10 pt-2">
                <div className="flex h-8 items-center px-2">
                  <h2 className="min-w-0 flex-1 text-[10px] font-semibold tracking-[0.18em] text-white/55">Itens soltos</h2>
                  {papel === 'admin' && <CriarEstruturaDialog espaco={null} pastas={navegacao.pastasRaiz} clientes={clientes} />}
                </div>
                <nav className="space-y-0.5">
                  {navegacao.pastasRaiz.map((pasta) => <Pasta key={pasta.id} pasta={pasta} nivel={0} contexto={null} pastas={navegacao.pastasRaiz} clientes={clientes} podeGerir={papel === 'admin'} podeArrastar={podeArrastar} />)}
                  {navegacao.listasRaiz.map((lista) => <LinkLista key={lista.id} lista={lista} nivel={0} podeGerir={papel === 'admin'} podeArrastar={podeArrastar} />)}
                  {!navegacao.pastasRaiz.length && !navegacao.listasRaiz.length && !arrastando && <p className="px-2 py-1 text-[10px] text-white/45">Pastas e listas sem espaço aparecem aqui.</p>}
                </nav>
              </div>
            )}
            <ZonaRaiz visivel={arrastando} />
          </SortableContext>
        </DndContext>
      </div>

      <div className="shrink-0 border-t border-white/10 p-2">
        <IndicadorCronometro cronometro={cronometro} />
        <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-white/10">
          <Avatar nome={nome || '?'} tamanho="h-6 w-6 text-[9px]" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-semibold text-white">{nome}</p>
            <p className="truncate text-[9px] text-white/55">{papel}</p>
          </div>
          <form action={sair}>
            <button aria-label="Sair" title="Sair" className="rounded-[5px] p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white">
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export function BarraLateral(props: Props) {
  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-[272px] shrink-0 md:flex">
        <Painel {...props} />
      </aside>

      <div className="sticky top-0 z-40 flex h-12 items-center gap-2 border-b border-borda bg-white/95 px-3 backdrop-blur md:hidden">
        <Sheet>
          <SheetTrigger aria-label="Abrir menu" className="rounded-md p-1.5 hover:bg-hover">
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] border-r-0 bg-lateral p-0 text-white">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <Painel {...props} />
          </SheetContent>
        </Sheet>
        <span className="text-[13px] font-bold tracking-[0.22em]">Grupo SRV</span>
      </div>
    </>
  )
}
