'use client'

import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  CheckSquare,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  Pin,
  Settings,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useMemo, useRef, useState, useTransition, type ComponentType, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react'
import { moverItemNavegacao } from '@/app/(app)/acoes-navegacao'
import { avisar } from '@/componentes/tarefas/avisar'
import { Avatar } from '@/componentes/Avatar'
import { IconeVisual } from '@/componentes/IconeVisual'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/componentes/ui/sheet'
import { IndicadorCronometro } from './IndicadorCronometro'
import { SinoAvisos } from './SinoAvisos'
import type { Aviso } from '@/servicos/avisos'
import type { CronometroAtivo } from '@/servicos/tempo'
import { CriarEstruturaDialog, PersonalizarItemDialog } from './CriadoresNavegacao'
import type { ItemLista, Navegacao, NoEspaco, NoPasta } from '@/dominio/arvore-espacos'
import { rotuloMes } from '@/dominio/formatar'
import { COOKIE_LARGURA_LATERAL, COOKIE_MODO_LATERAL, LARGURA_LATERAL, limitarLargura, type ModoLateral } from '@/dominio/tema-lateral'
import { sair } from '@/app/(auth)/login/acoes'

type Opcao = { id: string; nome: string }
type Props = { navegacao: Navegacao; clientes: Opcao[]; nome: string; papel: string; cronometro: CronometroAtivo | null; avisos: Aviso[]; naoLidos: number; euId: string }
type IconeLucide = ComponentType<{ className?: string }>
type TipoArrastavel = 'space' | 'folder' | 'list'

const item =
  'flex h-8 items-center gap-2 rounded-md px-2 text-legenda tracking-[0.04em] text-lat-2 transition-colors hover:bg-lat-hover hover:text-lat-fg'
const ativo = 'bg-lat-ativo font-semibold text-lat-fg hover:bg-lat-ativo hover:text-lat-fg'

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
  const { listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: idArrastavel(tipo, id),
    data: { tipo, id },
    disabled: !habilitado,
  })
  // Segurar e arrastar a linha inteira (o PointerSensor só ativa após 6px, então cliques seguem funcionando).
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      className={`${className} ${isDragging ? 'z-20 cursor-grabbing opacity-45 ring-1 ring-marca/40' : ''}`}
      style={{ ...style, transform: CSS.Transform.toString(transform), transition }}
    >
      {children}
    </div>
  )
}

/** Ícone do item; ao passar o mouse vira a seta de abrir/recolher (quando há o que abrir). */
function IconeAlternavel({ aberto, alternar, rotulo, ativo, children }: { aberto: boolean; alternar: () => void; rotulo: string; ativo: boolean; children: ReactNode }) {
  if (!ativo) return <span className="flex h-4 w-4 shrink-0 items-center justify-center">{children}</span>
  return (
    <button
      type="button"
      onClick={alternar}
      aria-label={`${aberto ? 'Recolher' : 'Expandir'} ${rotulo}`}
      aria-expanded={aberto}
      className="group/seta relative flex h-4 w-4 shrink-0 items-center justify-center rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-marca"
    >
      <span className="flex transition-opacity group-hover/seta:opacity-0 group-focus-visible/seta:opacity-0">{children}</span>
      <ChevronDown aria-hidden="true" className={`absolute h-3.5 w-3.5 text-lat-fg opacity-0 transition group-hover/seta:opacity-100 group-focus-visible/seta:opacity-100 ${aberto ? '' : '-rotate-90'}`} />
    </button>
  )
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
      style={{ paddingLeft: 8 + nivel * 14 }}
    >
      <Link href={href} title={[lista.nome, detalhe].filter(Boolean).join(' · ')} className="flex min-w-0 flex-1 items-center gap-2">
        <span className="flex h-4 w-4 shrink-0 items-center justify-center" style={{ color: lista.cor }}><IconeVisual icone={lista.icone} emoji={lista.emoji} className="h-3.5 w-3.5" /></span>
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
      <LinhaArrastavel tipo="folder" id={pasta.id} habilitado={podeArrastar} className={`${item} group w-full`} style={{ paddingLeft: 8 + nivel * 14 }}>
        <IconeAlternavel aberto={aberta} alternar={() => setAberta(!aberta)} rotulo={pasta.nome} ativo>
          <span style={{ color: pasta.cor }}><IconeVisual icone={pasta.icone} emoji={pasta.emoji} className="h-3.5 w-3.5" /></span>
        </IconeAlternavel>
        <button type="button" onClick={() => setAberta(!aberta)} className="min-w-0 flex-1 truncate text-left">{pasta.nome}</button>
        <span className="ml-auto text-legenda tabular-nums text-lat-3">{pasta.listas.length}</span>
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
  const href = `/${espaco.slug}`
  const temConteudo = espaco.filhos.length + espaco.pastas.length + espaco.listas.length > 0

  return (
    <div>
      <LinhaArrastavel tipo="space" id={espaco.id} habilitado={podeArrastar} className={`${item} group ${caminho === href ? ativo : ''}`} style={{ paddingLeft: 8 + nivel * 14 }}>
        <IconeAlternavel aberto={aberto} alternar={() => setAberto(!aberto)} rotulo={espaco.nome} ativo={temConteudo}>
          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] text-white" style={{ background: espaco.cor }}>
            <IconeVisual icone={espaco.icone} emoji={espaco.emoji} className="h-2.5 w-2.5" />
          </span>
        </IconeAlternavel>
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

function Painel({ navegacao, clientes, nome, papel, cronometro, avisos, naoLidos, euId, acaoTopo }: Props & { acaoTopo?: ReactNode }) {
  const caminho = usePathname()
  const router = useRouter()
  const [movendo, iniciarMovimento] = useTransition()
  const podeArrastar = papel === 'admin'
  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  // Só as áreas fixas aparecem; espaços antigos (sem slug) ficam fora da navegação.
  const arvore = navegacao.espacos.filter((espaco) => espaco.slug)
  const itensOrdenaveis = useMemo(() => idsDaNavegacao(navegacao), [navegacao])

  const concluirMovimento = (evento: DragEndEvent) => {
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
      <Icone className="h-3.5 w-3.5 text-lat-2" />
      <span className="truncate">{rotulo}</span>
    </Link>
  )

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col bg-lat-bg text-lat-fg">
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-lat-borda px-4">
        <p className="min-w-0 flex-1 truncate text-corpo font-bold tracking-[0.22em] text-lat-fg">Grupo SRV</p>
        <SinoAvisos avisos={avisos} naoLidos={naoLidos} euId={euId} />
        {acaoTopo}
      </div>

      <div className={`min-h-0 flex-1 overflow-y-auto px-2 py-2 ${movendo ? 'pointer-events-none opacity-70' : ''}`}>
        <div className="flex h-8 items-center px-2">
          <h2 className="text-legenda font-semibold tracking-[0.18em] text-lat-3">Navegação</h2>
        </div>
        <nav className="space-y-0.5">
          {link('/inicio', 'Minhas tarefas', CheckSquare)}
          {link('/painel-de-gestao', 'Painel de Gestão', LayoutDashboard)}
          {link('/clientes', 'Clientes', Users)}
          {papel === 'admin' && link('/config', 'Configurações', Settings)}
        </nav>

        <div className="mx-2 my-3 border-t border-lat-borda" />

        <DndContext id="navegacao-lateral" sensors={sensores} collisionDetection={closestCenter} onDragEnd={concluirMovimento}>
          <SortableContext items={itensOrdenaveis} strategy={verticalListSortingStrategy}>
            <div className="flex h-8 items-center px-2">
              <h2 className="min-w-0 flex-1 text-legenda font-semibold tracking-[0.18em] text-lat-3">Áreas</h2>
            </div>

            <nav className="space-y-0.5">
              {arvore.length === 0 && <p className="px-2 py-2 text-legenda leading-5 text-lat-3">Nenhuma área disponível.</p>}
              {arvore.map((espaco) => <Espaco key={espaco.id} espaco={espaco} nivel={0} clientes={clientes} podeGerir={papel === 'admin' || papel === 'gestor'} podeEditarEspaco={false} podeArrastar={podeArrastar} />)}
            </nav>

          </SortableContext>
        </DndContext>
      </div>

      <div className="shrink-0 border-t border-lat-borda p-2">
        <IndicadorCronometro cronometro={cronometro} />
        <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-lat-hover">
          <Avatar nome={nome || '?'} tamanho="h-6 w-6 text-legenda" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-legenda font-semibold text-lat-fg">{nome}</p>
            <p className="truncate text-legenda text-lat-3">{papel}</p>
          </div>
          <form action={sair}>
            <button aria-label="Sair" title="Sair" className="rounded-[5px] p-1.5 text-lat-3 transition hover:bg-lat-hover hover:text-lat-fg">
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

const botaoTopo = 'rounded-md p-1.5 text-lat-2 transition-colors hover:bg-lat-hover hover:text-lat-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca'

function gravarPreferencia(chave: string, valor: string) {
  document.cookie = `${chave}=${valor}; path=/; max-age=31536000; samesite=lax`
}

export function BarraLateral({ modoInicial, larguraInicial, ...props }: Props & { modoInicial: ModoLateral; larguraInicial: number }) {
  const [modo, setModo] = useState(modoInicial)
  const [largura, setLargura] = useState(larguraInicial)
  const [aberta, setAberta] = useState(false)
  const asideRef = useRef<HTMLElement>(null)
  const arrasto = useRef<{ x: number; largura: number } | null>(null)
  const atraso = useRef<ReturnType<typeof setTimeout> | null>(null)
  const recolhida = modo === 'recolhida'

  const trocarModo = (novo: ModoLateral) => {
    setModo(novo)
    setAberta(false)
    gravarPreferencia(COOKIE_MODO_LATERAL, novo)
  }
  const abrir = () => {
    if (atraso.current) clearTimeout(atraso.current)
    setAberta(true)
  }
  const fecharComAtraso = () => {
    if (atraso.current) clearTimeout(atraso.current)
    atraso.current = setTimeout(() => {
      // Mantém aberta enquanto um popover/diálogo aberto a partir da barra ainda está ativo
      // (só gatilhos com aria-haspopup; os botões de expandir a árvore ficam sempre expandidos).
      if (asideRef.current?.querySelector('[aria-haspopup][aria-expanded="true"]')) return
      setAberta(false)
    }, 250)
  }
  const aplicarLargura = (valor: number) => {
    const nova = limitarLargura(valor)
    setLargura(nova)
    gravarPreferencia(COOKIE_LARGURA_LATERAL, String(nova))
  }
  const iniciarArrasto = (evento: PointerEvent<HTMLButtonElement>) => {
    arrasto.current = { x: evento.clientX, largura: asideRef.current?.offsetWidth ?? largura }
    evento.currentTarget.setPointerCapture(evento.pointerId)
    evento.preventDefault()
  }
  // Durante o arrasto só a variável CSS muda (sem re-render da árvore); o estado é gravado ao soltar.
  const moverArrasto = (evento: PointerEvent<HTMLButtonElement>) => {
    if (!arrasto.current) return
    asideRef.current?.style.setProperty('--lat-w', `${limitarLargura(arrasto.current.largura + evento.clientX - arrasto.current.x)}px`)
  }
  const soltarArrasto = (evento: PointerEvent<HTMLButtonElement>) => {
    if (!arrasto.current) return
    arrasto.current = null
    if (evento.currentTarget.hasPointerCapture(evento.pointerId)) evento.currentTarget.releasePointerCapture(evento.pointerId)
    if (asideRef.current) aplicarLargura(asideRef.current.offsetWidth)
  }
  const redimensionarComTeclado = (evento: KeyboardEvent<HTMLButtonElement>) => {
    if (evento.key !== 'ArrowLeft' && evento.key !== 'ArrowRight') return
    evento.preventDefault()
    aplicarLargura(largura + (evento.key === 'ArrowRight' ? 16 : -16))
  }

  return (
    <>
      {recolhida && <div aria-hidden="true" className="fixed inset-y-0 left-0 z-30 hidden w-2 md:block" onMouseEnter={abrir} />}
      <aside
        ref={asideRef}
        style={{ '--lat-w': `${largura}px` } as CSSProperties}
        onMouseEnter={recolhida ? abrir : undefined}
        onMouseLeave={recolhida ? fecharComAtraso : undefined}
        onFocus={recolhida ? abrir : undefined}
        onBlur={recolhida ? (evento) => !evento.currentTarget.contains(evento.relatedTarget) && fecharComAtraso() : undefined}
        className={`hidden h-screen w-[var(--lat-w)] border-r border-lat-borda md:flex ${
          recolhida
            ? `fixed inset-y-0 left-0 z-40 shadow-2xl transition-transform duration-200 ${aberta ? 'translate-x-0' : '-translate-x-full'}`
            : 'sticky top-0 shrink-0'
        }`}
      >
        <Painel
          {...props}
          acaoTopo={
            recolhida ? (
              <button type="button" onClick={() => trocarModo('fixa')} aria-label="Fixar barra lateral" title="Fixar barra lateral" className={botaoTopo}>
                <Pin className="h-4 w-4" aria-hidden="true" />
              </button>
            ) : (
              <button type="button" onClick={() => trocarModo('recolhida')} aria-label="Recolher barra lateral" title="Recolher barra lateral" className={botaoTopo}>
                <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
              </button>
            )
          }
        />
        {!recolhida && (
          <button
            type="button"
            role="separator"
            aria-orientation="vertical"
            aria-label="Ajustar largura da barra lateral"
            aria-valuenow={largura}
            aria-valuemin={LARGURA_LATERAL.minima}
            aria-valuemax={LARGURA_LATERAL.maxima}
            title="Arraste para ajustar. Duplo clique restaura."
            onPointerDown={iniciarArrasto}
            onPointerMove={moverArrasto}
            onPointerUp={soltarArrasto}
            onPointerCancel={soltarArrasto}
            onDoubleClick={() => aplicarLargura(LARGURA_LATERAL.padrao)}
            onKeyDown={redimensionarComTeclado}
            className="absolute -right-1 top-0 z-10 h-full w-2 cursor-col-resize touch-none outline-none after:absolute after:inset-y-0 after:left-1/2 after:w-px after:bg-transparent hover:after:bg-marca focus-visible:after:w-0.5 focus-visible:after:bg-marca"
          />
        )}
      </aside>

      <div className="sticky top-0 z-40 flex h-12 items-center gap-2 border-b border-borda bg-white/95 px-3 backdrop-blur md:hidden">
        <Sheet>
          <SheetTrigger aria-label="Abrir menu" className="rounded-md p-1.5 hover:bg-hover">
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] border-r border-lat-borda bg-lat-bg p-0 text-lat-fg">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <Painel {...props} />
          </SheetContent>
        </Sheet>
        <span className="text-corpo font-bold tracking-[0.22em]">Grupo SRV</span>
      </div>
    </>
  )
}
