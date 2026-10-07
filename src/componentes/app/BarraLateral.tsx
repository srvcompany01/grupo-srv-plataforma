'use client'

import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useDroppable, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Home,
  GripVertical,
  Layers3,
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
import { CriarEspacoDialog, CriarEstruturaDialog, PersonalizarItemDialog } from './CriadoresNavegacao'
import type { ItemLista, Navegacao, NoEspaco, NoPasta } from '@/dominio/arvore-espacos'
import { rotuloMes } from '@/dominio/formatar'
import { sair } from '@/app/(auth)/login/acoes'

type Opcao = { id: string; nome: string }
type Props = { navegacao: Navegacao; clientes: Opcao[]; nome: string; papel: string }
type IconeLucide = ComponentType<{ className?: string }>
type TipoArrastavel = 'space' | 'folder' | 'list'

const item =
  'flex h-8 items-center gap-2 rounded-md px-2 text-[12px] text-[#65676b] transition-colors hover:bg-[#ededee] hover:text-[#292a2d]'
const ativo = 'bg-[#e4e4e6] font-semibold text-[#292a2d] hover:bg-[#dedee0] hover:text-[#292a2d]'

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
        <button ref={setActivatorNodeRef} type="button" aria-label="Arrastar para organizar" className="-ml-1 cursor-grab touch-none rounded p-0.5 text-[#b0b1b5] opacity-0 hover:bg-black/5 hover:text-[#65666b] focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-marca group-hover:opacity-100 active:cursor-grabbing" {...attributes} {...listeners}>
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
  return <div ref={setNodeRef} className={`mx-1 my-2 rounded-lg border border-dashed px-3 py-2 text-center text-[10px] transition ${isOver ? 'border-marca bg-marca/10 text-marca' : 'border-[#cfd0d3] text-[#8d8e93]'}`}>Solte aqui para deixar sem espaço</div>
}

function listasDoEspaco(espaco: NoEspaco): string[] {
  return [
    ...espaco.listas.map((lista) => lista.id),
    ...espaco.pastas.flatMap((pasta) => pasta.listas.map((lista) => lista.id)),
    ...espaco.filhos.flatMap(listasDoEspaco),
  ]
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
      <Link href={href} className="flex min-w-0 flex-1 items-center gap-2">
        <span style={{ color: lista.cor }}><IconeVisual icone={lista.icone} emoji={lista.emoji} className="h-3.5 w-3.5" /></span>
        <span className="min-w-0 flex-1 truncate">{lista.nome}</span>
        {detalhe && <span className="max-w-16 truncate text-[9px] text-[#a1a2a6]">{detalhe}</span>}
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
        <button type="button" onClick={() => setAberta(!aberta)} aria-label={aberta ? `Recolher ${pasta.nome}` : `Expandir ${pasta.nome}`} aria-expanded={aberta} className="rounded p-0.5 hover:bg-black/5">
          <ChevronRight className={`h-3 w-3 shrink-0 text-[#999a9f] transition-transform ${aberta ? 'rotate-90' : ''}`} />
        </button>
        <span style={{ color: pasta.cor }}><IconeVisual icone={pasta.icone} emoji={pasta.emoji} className="h-3.5 w-3.5" /></span>
        <button type="button" onClick={() => setAberta(!aberta)} className="min-w-0 flex-1 truncate text-left">{pasta.nome}</button>
        <span className="ml-auto text-[9px] tabular-nums text-[#a1a2a6]">{pasta.listas.length}</span>
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
          className={`rounded p-0.5 hover:bg-black/5 ${temConteudo ? '' : 'invisible'}`}
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

function Trilho({ navegacao, papel }: Pick<Props, 'navegacao' | 'papel'>) {
  const caminho = usePathname()
  const arvore = navegacao.espacos
  const departamentos = arvore.slice(0, 5)
  const hrefEspacos = departamentos[0] ? `/espacos/${departamentos[0].id}` : '/inicio'

  const link = (href: string, rotulo: string, Icone: IconeLucide, estaAtivo: boolean) => (
    <Link
      href={href}
      aria-label={rotulo}
      title={rotulo}
      className={`group flex min-h-12 w-full flex-col items-center justify-center gap-0.5 px-1 py-1 text-center text-[8px] font-semibold leading-tight transition-colors ${
        estaAtivo ? 'bg-white/15 text-white' : 'text-white/75 hover:bg-white/10 hover:text-white'
      }`}
    >
      <Icone className="h-[18px] w-[18px]" />
      <span className="line-clamp-1 max-w-12">{rotulo}</span>
    </Link>
  )

  return (
    <div className="flex h-full w-14 shrink-0 flex-col overflow-hidden bg-[#075e57] text-white">
      <Link href="/inicio" aria-label="Grupo SRV" className="flex h-12 shrink-0 items-center justify-center border-b border-white/10">
        <span className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-white font-[var(--font-plus-jakarta)] text-xs font-extrabold text-[#075e57]">
          S
        </span>
      </Link>

      <nav className="min-h-0 flex-1 overflow-y-auto py-1">
        {link('/inicio', 'Início', Home, caminho.startsWith('/inicio'))}
        {link('/clientes', 'Clientes', Users, caminho.startsWith('/clientes'))}
        <div className="mx-2 my-1 border-t border-white/15" />
        {link(hrefEspacos, 'Espaços', Layers3, caminho.startsWith('/espacos') || caminho.startsWith('/listas'))}
        {departamentos.map((espaco) => {
          const listaIds = listasDoEspaco(espaco)
          const selecionado = caminho === `/espacos/${espaco.id}` || listaIds.some((id) => caminho === `/listas/${id}`)
          return (
            <Link
              key={espaco.id}
              href={`/espacos/${espaco.id}`}
              aria-label={espaco.nome}
              title={espaco.nome}
              className={`group flex min-h-12 w-full flex-col items-center justify-center gap-0.5 px-1 py-1 text-[8px] font-semibold leading-tight transition-colors ${
                selecionado ? 'bg-white/15 text-white' : 'text-white/75 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="flex h-[19px] w-[19px] items-center justify-center rounded-[5px] text-white" style={{ background: espaco.cor }}>
                <IconeVisual icone={espaco.icone} emoji={espaco.emoji} className="h-3 w-3" />
              </span>
              <span className="line-clamp-1 max-w-12">{espaco.nome}</span>
            </Link>
          )
        })}
      </nav>

      <nav className="border-t border-white/10 py-1">
        {papel === 'admin' && link('/config', 'Ajustes', Settings, caminho.startsWith('/config'))}
      </nav>
    </div>
  )
}

function Painel({ navegacao, clientes, nome, papel }: Props) {
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
      <Icone className="h-3.5 w-3.5 text-[#7d7e83]" />
      <span className="truncate">{rotulo}</span>
    </Link>
  )

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col bg-[#f7f7f8]">
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-[#e2e2e4] px-3">
        <span className="flex h-6 w-6 items-center justify-center rounded-[6px] bg-marca text-[9px] font-extrabold text-white">S</span>
        <p className="min-w-0 flex-1 truncate text-[12px] font-semibold text-[#303136]">Grupo SRV</p>
        <ChevronDown className="h-3.5 w-3.5 text-[#8d8e93]" />
      </div>

      <div className={`min-h-0 flex-1 overflow-y-auto px-2 py-2 ${movendo ? 'pointer-events-none opacity-70' : ''}`}>
        <div className="flex h-8 items-center px-2">
          <h2 className="text-[14px] font-semibold tracking-[-0.02em] text-[#292a2d]">Início</h2>
        </div>
        <nav className="space-y-0.5">
          {link('/inicio', 'Minhas tarefas', CheckSquare)}
          {link('/clientes', 'Clientes', Users)}
          {papel === 'admin' && link('/config', 'Configurações', Settings)}
        </nav>

        <div className="mx-2 my-3 border-t border-[#e1e1e3]" />

        <DndContext sensors={sensores} collisionDetection={closestCenter} onDragStart={() => setArrastando(true)} onDragCancel={() => setArrastando(false)} onDragEnd={concluirMovimento}>
          <SortableContext items={itensOrdenaveis} strategy={verticalListSortingStrategy}>
            <div className="flex h-8 items-center px-2">
              <h2 className="min-w-0 flex-1 text-[11px] font-semibold text-[#626368]">Espaços</h2>
              {papel === 'admin' && <CriarEspacoDialog pais={arvore.map((espaco) => ({ id: espaco.id, nome: espaco.nome }))} />}
            </div>

            <nav className="space-y-0.5">
              {arvore.length === 0 && <p className="px-2 py-2 text-[11px] leading-5 text-[#8d8e93]">Você ainda não faz parte de nenhum departamento.</p>}
              {arvore.map((espaco) => <Espaco key={espaco.id} espaco={espaco} nivel={0} clientes={clientes} podeGerir={papel === 'admin' || papel === 'gestor'} podeEditarEspaco={papel === 'admin'} podeArrastar={podeArrastar} />)}
            </nav>

            {(papel === 'admin' || navegacao.pastasRaiz.length > 0 || navegacao.listasRaiz.length > 0) && (
              <div className="mt-3 border-t border-[#e1e1e3] pt-2">
                <div className="flex h-8 items-center px-2">
                  <h2 className="min-w-0 flex-1 text-[11px] font-semibold text-[#626368]">Itens soltos</h2>
                  {papel === 'admin' && <CriarEstruturaDialog espaco={null} pastas={navegacao.pastasRaiz} clientes={clientes} />}
                </div>
                <nav className="space-y-0.5">
                  {navegacao.pastasRaiz.map((pasta) => <Pasta key={pasta.id} pasta={pasta} nivel={0} contexto={null} pastas={navegacao.pastasRaiz} clientes={clientes} podeGerir={papel === 'admin'} podeArrastar={podeArrastar} />)}
                  {navegacao.listasRaiz.map((lista) => <LinkLista key={lista.id} lista={lista} nivel={0} podeGerir={papel === 'admin'} podeArrastar={podeArrastar} />)}
                  {!navegacao.pastasRaiz.length && !navegacao.listasRaiz.length && !arrastando && <p className="px-2 py-1 text-[10px] text-[#9b9ca0]">Pastas e listas sem espaço aparecem aqui.</p>}
                </nav>
              </div>
            )}
            <ZonaRaiz visivel={arrastando} />
          </SortableContext>
        </DndContext>
      </div>

      <div className="shrink-0 border-t border-[#e2e2e4] p-2">
        <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[#ededee]">
          <Avatar nome={nome || '?'} tamanho="h-6 w-6 text-[9px]" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-semibold text-[#35363a]">{nome}</p>
            <p className="truncate text-[9px] capitalize text-[#96979b]">{papel}</p>
          </div>
          <form action={sair}>
            <button aria-label="Sair" title="Sair" className="rounded-[5px] p-1.5 text-[#8b8c90] transition hover:bg-white hover:text-[#303136]">
              <LogOut className="h-3.5 w-3.5" />
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
      <aside className="sticky top-0 hidden h-screen w-[296px] shrink-0 border-r border-[#dfdfe1] md:flex">
        <Trilho navegacao={props.navegacao} papel={props.papel} />
        <Painel {...props} />
      </aside>

      <div className="sticky top-0 z-40 flex h-12 items-center gap-2 border-b border-borda bg-white/95 px-3 backdrop-blur md:hidden">
        <Sheet>
          <SheetTrigger aria-label="Abrir menu" className="rounded-md p-1.5 hover:bg-hover">
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] border-r-borda bg-[#f7f7f8] p-0">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <Painel {...props} />
          </SheetContent>
        </Sheet>
        <span className="flex h-6 w-6 items-center justify-center rounded-[6px] bg-[#075e57] text-[9px] font-extrabold text-white">S</span>
        <span className="text-[13px] font-semibold">Grupo SRV</span>
      </div>
    </>
  )
}
