'use client'

import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useDroppable, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import {
  Briefcase,
  CalendarClock,
  CalendarDays,
  CheckSquare,
  ClipboardList,
  FileText,
  Filter,
  LayoutDashboard,
  MessagesSquare,
  Mic,
  PanelLeftClose,
  PenTool,
  Pin,
  Settings,
  Users,
  UsersRound,
  Wallet,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createContext, useContext, useMemo, useRef, useState, useTransition, type ComponentType, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react'
import { moverItemNavegacao } from '@/app/(app)/acoes-navegacao'
import { avisar } from '@/componentes/tarefas/avisar'
import { IconeVisual } from '@/componentes/IconeVisual'
import { IndicadorCronometro } from './IndicadorCronometro'
import { ListaOrdenavel } from './ListaOrdenavel'
import { LinhaNavegacao, type TipoArrastavel } from './LinhaNavegacao'
import type { CronometroAtivo } from '@/servicos/tempo'
import { CriarEspacoDialog, CriarEstruturaDialog, PersonalizarItemDialog } from './CriadoresNavegacao'
import type { ItemLista, Navegacao, NoEspaco, NoPasta } from '@/dominio/arvore-espacos'
import { rotuloMes } from '@/dominio/formatar'
import { COOKIE_LARGURA_LATERAL, COOKIE_MODO_LATERAL, COOKIE_NAV_FECHADOS, COOKIE_ORDEM_INICIO, LARGURA_LATERAL, escreverFechados, limitarLargura, type ModoLateral } from '@/dominio/tema-lateral'

type Opcao = { id: string; nome: string }
export type PropsPainel = { navegacao: Navegacao; papel: string; cronometro: CronometroAtivo | null; /** Espaços e pastas recolhidos (vem do cookie, para não piscar). */ fechados?: string[]; /** Ordem dos atalhos de Início escolhida pela pessoa (vem do cookie). */ ordemInicio?: string[]; /** Mensagens do chat ainda não lidas. */ chatNaoLidas?: number }
type IconeLucide = ComponentType<{ className?: string }>

type Atalho = { id: string; href: string; rotulo: string; curto: string; Icone: IconeLucide; contador?: number }

/** Atalhos dos módulos: na faixa de ícones (desktop) e no topo do menu (celular). `curto` = rótulo da faixa. */
function atalhosDoInicio(papel: string, chatNaoLidas: number): Atalho[] {
  return [
    { id: 'tarefas', href: '/inicio', rotulo: 'Minhas tarefas', curto: 'Tarefas', Icone: CheckSquare },
    { id: 'chat', href: '/chat', rotulo: 'Chat', curto: 'Chat', Icone: MessagesSquare, contador: chatNaoLidas },
    { id: 'agenda', href: '/agenda', rotulo: 'Agenda', curto: 'Agenda', Icone: CalendarDays },
    { id: 'agendamentos', href: '/agendamentos', rotulo: 'Agendamentos', curto: 'Posts', Icone: CalendarClock },
    { id: 'painel', href: '/painel-de-gestao', rotulo: 'Painel de Gestão', curto: 'Painel', Icone: LayoutDashboard },
    { id: 'clientes', href: '/clientes', rotulo: 'Clientes', curto: 'Clientes', Icone: Users },
    { id: 'projetos', href: '/projetos', rotulo: 'Projetos', curto: 'Projetos', Icone: Briefcase },
    { id: 'reunioes', href: '/reunioes', rotulo: 'Reuniões', curto: 'Reuniões', Icone: Mic },
    { id: 'time', href: '/time', rotulo: 'Time', curto: 'Time', Icone: UsersRound },
    { id: 'documentos', href: '/documentos', rotulo: 'Documentos', curto: 'Docs', Icone: FileText },
    { id: 'quadros', href: '/quadros', rotulo: 'Quadros', curto: 'Quadros', Icone: PenTool },
    { id: 'funis', href: '/funis', rotulo: 'Funis', curto: 'Funis', Icone: Filter },
    ...(papel === 'admin'
      ? [
          { id: 'financeiro', href: '/financeiro', rotulo: 'Financeiro', curto: 'Financeiro', Icone: Wallet },
          { id: 'formularios', href: '/config/formularios', rotulo: 'Formulários', curto: 'Forms', Icone: ClipboardList },
          { id: 'config', href: '/config', rotulo: 'Configurações', curto: 'Config.', Icone: Settings },
        ]
      : []),
  ]
}

const estaEm = (caminho: string, href: string) => caminho === href || caminho.startsWith(`${href}/`)

/** Faixa estreita (desktop) com os atalhos dos módulos: ícone e o nome embaixo, compacto. Ordem por arrastar. */
export function FaixaAtalhos({ papel, chatNaoLidas = 0, ordemInicio = [] }: Pick<PropsPainel, 'papel' | 'chatNaoLidas' | 'ordemInicio'>) {
  const caminho = usePathname()
  const atalhos = atalhosDoInicio(papel, chatNaoLidas)
  // "/config" não acende em "/config/formularios" (que tem o seu próprio atalho).
  const ativoEm = (href: string) => estaEm(caminho, href) && !atalhos.some((a) => a.href !== href && a.href.startsWith(`${href}/`) && estaEm(caminho, a.href))
  return (
    <nav aria-label="Módulos" className="sticky top-14 z-20 hidden h-[calc(100dvh-3.5rem)] w-16 shrink-0 overflow-y-auto border-r border-lat-borda bg-lat-bg px-1 py-1.5 md:block">
      <ListaOrdenavel
        className="space-y-0.5"
        cookie={COOKIE_ORDEM_INICIO}
        ordemInicial={ordemInicio}
        itens={atalhos.map(({ id, href, rotulo, curto, Icone, contador }) => ({
          id,
          no: (
            <Link href={href} draggable={false} title={rotulo} aria-current={ativoEm(href) ? 'page' : undefined} className={`relative flex flex-col items-center gap-0.5 rounded-md px-0.5 py-1.5 text-lat-2 transition-colors hover:bg-lat-hover hover:text-lat-fg ${ativoEm(href) ? 'bg-lat-ativo text-lat-fg' : ''}`}>
              <Icone className="h-4 w-4" />
              <span className="w-full truncate text-center text-[10px] leading-3 font-medium">{curto}</span>
              {!!contador && <span className="absolute right-1 top-0.5 rounded-full bg-perigo px-1 text-[9px] leading-3.5 font-bold text-white">{contador > 99 ? '99+' : contador}</span>}
            </Link>
          ),
        }))}
      />
    </nav>
  )
}

/** Quais espaços e pastas estão recolhidos. A escolha fica gravada no navegador e vale na próxima visita. */
const Recolhidos = createContext<{ fechado: (id: string) => boolean; alternar: (id: string) => void; admin: boolean }>({ fechado: () => false, alternar: () => {}, admin: false })

const item =
  'flex h-7 items-center gap-2 rounded-md px-2 text-legenda text-lat-2 transition-colors hover:bg-lat-hover hover:text-lat-fg'
const ativo = 'bg-lat-ativo font-semibold text-lat-fg hover:bg-lat-ativo hover:text-lat-fg'

function TituloSecao({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-7 items-center px-2">
      <h2 className="min-w-0 flex-1 text-legenda font-semibold tracking-rotulo text-lat-3">{children}</h2>
    </div>
  )
}

function idArrastavel(tipo: TipoArrastavel, id: string) {
  return `${tipo}:${id}`
}

function ZonaRaiz({ visivel }: { visivel: boolean }) {
  const { isOver, setNodeRef } = useDroppable({ id: 'root', data: { tipo: 'root' } })
  if (!visivel) return null
  return <div ref={setNodeRef} className={`mx-1 my-2 rounded-lg border border-dashed px-3 py-2 text-center text-legenda transition ${isOver ? 'border-marca bg-marca/10 text-marca' : 'border-lat-borda text-lat-3'}`}>Solte aqui para deixar sem espaço</div>
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
  const { admin } = useContext(Recolhidos)
  const href = `/listas/${lista.id}`
  const detalhe = lista.mes ? rotuloMes(lista.mes) : ''

  return (
    <LinhaNavegacao
      tipo="list"
      id={lista.id}
      nome={lista.nome}
      habilitado={podeArrastar}
      podeEditar={podeGerir}
      podeExcluir={podeGerir && (!lista.slug || admin)}
      fixa={!!lista.slug}
      className={`${item} group ${caminho === href ? ativo : ''}`}
      style={{ paddingLeft: 8 + nivel * 14 }}
    >
      <Link href={href} draggable={false} title={[lista.nome, detalhe].filter(Boolean).join(' · ')} className="flex min-w-0 flex-1 items-center gap-2">
        <span className="flex h-4 w-4 shrink-0 items-center justify-center" style={{ color: lista.cor }}><IconeVisual icone={lista.icone} emoji={lista.emoji} className="h-3.5 w-3.5" /></span>
        <span className="min-w-0 flex-1 truncate">{lista.nome}</span>
      </Link>
      {podeGerir && <PersonalizarItemDialog tipo="lists" id={lista.id} nomeInicial={lista.nome} visualInicial={{ cor: lista.cor, icone: lista.icone, emoji: lista.emoji }} />}
    </LinhaNavegacao>
  )
}

/** Pasta vira um subtítulo em negrito dentro do cartão do espaço, com as listas logo abaixo (sem recolher). */
function Pasta({ pasta, nivel, contexto, pastas, podeGerir, podeArrastar }: { pasta: NoPasta; nivel: number; contexto: Opcao | null; pastas: NoPasta[]; podeGerir: boolean; podeArrastar: boolean }) {
  return (
    <div className="mt-2">
      <LinhaNavegacao tipo="folder" id={pasta.id} nome={pasta.nome} habilitado={podeArrastar} podeEditar={podeGerir} podeExcluir={podeGerir} className="group flex h-7 items-center gap-2 rounded-md px-2 text-legenda font-semibold text-lat-fg hover:bg-lat-hover" style={{ paddingLeft: 8 + nivel * 14 }}>
        <span className="min-w-0 flex-1 truncate">{pasta.nome}</span>
        {podeGerir && <CriarEstruturaDialog espaco={contexto} pastas={pastas} pastaInicial={pasta.id} modoInicial="lista" />}
        {podeGerir && <PersonalizarItemDialog tipo="folders" id={pasta.id} nomeInicial={pasta.nome} visualInicial={{ cor: pasta.cor, icone: pasta.icone, emoji: pasta.emoji }} />}
      </LinhaNavegacao>
      {pasta.listas.map((lista) => <LinkLista key={lista.id} lista={lista} nivel={nivel + 1} podeGerir={podeGerir} podeArrastar={podeArrastar} />)}
    </div>
  )
}

/** Espaço na raiz vira um cartão com o nome em maiúsculas e as listas dentro; espaço dentro de espaço vira subtítulo. */
function Espaco({ espaco, nivel, podeGerir, podeEditarEspaco, podeArrastar }: { espaco: NoEspaco; nivel: number; podeGerir: boolean; podeEditarEspaco: boolean; podeArrastar: boolean }) {
  const caminho = usePathname()
  const href = `/espacos/${espaco.id}`
  const cartao = nivel === 0

  const corpo = (
    <>
      <LinhaNavegacao
        tipo="space"
        id={espaco.id}
        nome={espaco.nome}
        habilitado={podeArrastar}
        podeEditar={podeEditarEspaco}
        podeExcluir={podeEditarEspaco}
        fixa={!!espaco.slug}
        className={`${item} group ${cartao ? 'h-7 font-semibold uppercase text-lat-fg' : 'mt-2 font-semibold text-lat-fg'} ${caminho === href ? ativo : ''}`}
        style={{ paddingLeft: 8 + nivel * 14 }}
      >
        {cartao && (
          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-white" style={{ background: espaco.cor }}>
            <IconeVisual icone={espaco.icone} emoji={espaco.emoji} className="h-2.5 w-2.5" />
          </span>
        )}
        <Link href={href} draggable={false} className="min-w-0 flex-1 truncate">
          {espaco.nome}
        </Link>
        {podeGerir && <CriarEstruturaDialog espaco={{ id: espaco.id, nome: espaco.nome }} pastas={espaco.pastas} />}
        {podeEditarEspaco && <PersonalizarItemDialog tipo="spaces" id={espaco.id} nomeInicial={espaco.nome} visualInicial={{ cor: espaco.cor, icone: espaco.icone, emoji: espaco.emoji }} />}
      </LinhaNavegacao>
      <div className={cartao ? 'mt-1' : ''}>
        {espaco.listas.map((lista) => <LinkLista key={lista.id} lista={lista} nivel={nivel + 1} podeGerir={podeGerir} podeArrastar={podeArrastar} />)}
        {espaco.pastas.map((pasta) => <Pasta key={pasta.id} pasta={pasta} nivel={nivel + 1} contexto={{ id: espaco.id, nome: espaco.nome }} pastas={espaco.pastas} podeGerir={podeGerir} podeArrastar={podeArrastar} />)}
        {espaco.filhos.map((filho) => <Espaco key={filho.id} espaco={filho} nivel={nivel + 1} podeGerir={podeGerir} podeEditarEspaco={podeEditarEspaco} podeArrastar={podeArrastar} />)}
      </div>
    </>
  )
  return cartao ? <section className="rounded-xl border border-lat-borda p-1.5">{corpo}</section> : <div>{corpo}</div>
}

/** Barra dos espaços: cada departamento (espaço) com as suas pastas e listas. No celular, também os atalhos dos módulos. */
export function PainelEspacos({ navegacao, papel, cronometro, fechados: fechadosIniciais = [], ordemInicio = [], chatNaoLidas = 0, acaoTopo, comAtalhos = false }: PropsPainel & { acaoTopo?: ReactNode; /** Atalhos dos módulos no topo (no celular, onde não há a faixa de ícones). */ comAtalhos?: boolean }) {
  const caminho = usePathname()
  const [fechados, setFechados] = useState(() => new Set(fechadosIniciais))
  const recolhimento = useMemo(
    () => ({
      admin: papel === 'admin',
      fechado: (id: string) => fechados.has(id),
      alternar: (id: string) =>
        setFechados((atual) => {
          const proximo = new Set(atual)
          if (!proximo.delete(id)) proximo.add(id)
          gravarPreferencia(COOKIE_NAV_FECHADOS, escreverFechados(proximo))
          return proximo
        }),
    }),
    [fechados, papel],
  )
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

  const link = (href: string, rotulo: string, Icone: IconeLucide, contador = 0) => (
    <Link href={href} draggable={false} className={`${item} ${estaEm(caminho, href) ? ativo : ''}`}>
      <Icone className="h-3.5 w-3.5 text-lat-2" />
      <span className="truncate">{rotulo}</span>
      {contador > 0 && <span className="ml-auto rounded-full bg-perigo px-1.5 text-micro font-bold text-white">{contador > 99 ? '99+' : contador}</span>}
    </Link>
  )

  return (
    <Recolhidos.Provider value={recolhimento}>
    <div className="flex h-full min-w-0 flex-1 flex-col bg-lat-bg text-lat-fg">
      <div className={`min-h-0 flex-1 overflow-y-auto px-2 py-2 ${movendo ? 'pointer-events-none opacity-70' : ''}`}>
        {comAtalhos && (
          <>
            <TituloSecao>Início</TituloSecao>
            <ListaOrdenavel
              className="space-y-0.5"
              cookie={COOKIE_ORDEM_INICIO}
              ordemInicial={ordemInicio}
              itens={atalhosDoInicio(papel, chatNaoLidas).map((a) => ({ id: a.id, no: link(a.href, a.rotulo, a.Icone, a.contador) }))}
            />
            <div className="mx-2 my-3 border-t border-lat-borda" />
          </>
        )}

        <DndContext id="navegacao-lateral" sensors={sensores} collisionDetection={closestCenter} onDragStart={() => setArrastando(true)} onDragCancel={() => setArrastando(false)} onDragEnd={concluirMovimento}>
          <SortableContext items={itensOrdenaveis} strategy={verticalListSortingStrategy}>
            <div className="flex h-7 items-center px-2">
              <h2 className="min-w-0 flex-1 text-legenda font-semibold tracking-rotulo text-lat-3">Espaços</h2>
              {papel === 'admin' && <CriarEspacoDialog pais={arvore.map((espaco) => ({ id: espaco.id, nome: espaco.nome }))} />}
              {acaoTopo}
            </div>

            <nav className="space-y-1.5">
              {arvore.length === 0 && <p className="px-2 py-2 text-legenda leading-5 text-lat-3">Nenhum espaço disponível.</p>}
              {arvore.map((espaco) => <Espaco key={espaco.id} espaco={espaco} nivel={0} podeGerir={papel === 'admin' || papel === 'gestor'} podeEditarEspaco={papel === 'admin'} podeArrastar={podeArrastar} />)}
            </nav>

            {(navegacao.pastasRaiz.length > 0 || navegacao.listasRaiz.length > 0) && (
              <div className="mt-3 border-t border-lat-borda pt-2">
                <div className="flex h-7 items-center px-2">
                  <h2 className="min-w-0 flex-1 text-legenda font-semibold tracking-rotulo text-lat-3">Itens soltos</h2>
                  {papel === 'admin' && <CriarEstruturaDialog espaco={null} pastas={navegacao.pastasRaiz} />}
                </div>
                <nav className="space-y-0.5">
                  {navegacao.pastasRaiz.map((pasta) => <Pasta key={pasta.id} pasta={pasta} nivel={0} contexto={null} pastas={navegacao.pastasRaiz} podeGerir={papel === 'admin'} podeArrastar={podeArrastar} />)}
                  {navegacao.listasRaiz.map((lista) => <LinkLista key={lista.id} lista={lista} nivel={0} podeGerir={papel === 'admin'} podeArrastar={podeArrastar} />)}
                </nav>
              </div>
            )}
            <ZonaRaiz visivel={arrastando} />
          </SortableContext>
        </DndContext>

      </div>

      <div className="shrink-0 border-t border-lat-borda p-2">
        <IndicadorCronometro cronometro={cronometro} />
      </div>
    </div>
    </Recolhidos.Provider>
  )
}

const botaoTopo = 'rounded-md p-1.5 text-lat-2 transition-colors hover:bg-lat-hover hover:text-lat-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca'

function gravarPreferencia(chave: string, valor: string) {
  document.cookie = `${chave}=${valor}; path=/; max-age=31536000; samesite=lax`
}

/** Camada 2 no desktop (ao lado da faixa de atalhos): a barra de espaços, abaixo do cabeçalho, recolhível e redimensionável. */
export function BarraLateral({ modoInicial, larguraInicial, ...props }: PropsPainel & { modoInicial: ModoLateral; larguraInicial: number }) {
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
      {recolhida && <div aria-hidden="true" className="fixed bottom-0 left-16 top-14 z-30 hidden w-2 md:block" onMouseEnter={abrir} />}
      <aside
        ref={asideRef}
        style={{ '--lat-w': `${largura}px` } as CSSProperties}
        onMouseEnter={recolhida ? abrir : undefined}
        onMouseLeave={recolhida ? fecharComAtraso : undefined}
        onFocus={recolhida ? abrir : undefined}
        onBlur={recolhida ? (evento) => !evento.currentTarget.contains(evento.relatedTarget) && fecharComAtraso() : undefined}
        className={`hidden h-[calc(100dvh-3.5rem)] w-[var(--lat-w)] border-r border-lat-borda md:flex ${
          recolhida
            ? `fixed bottom-0 left-16 top-14 z-40 shadow-flutuante transition-[translate,opacity] duration-200 ${aberta ? 'translate-x-0' : 'pointer-events-none -translate-x-full opacity-0'}`
            : 'sticky top-14 z-20 shrink-0'
        }`}
      >
        <PainelEspacos
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
            className="absolute right-0 top-0 z-30 h-full w-2 cursor-col-resize touch-none outline-none after:absolute after:inset-y-0 after:left-1/2 after:w-px after:bg-transparent hover:after:bg-marca focus-visible:after:w-0.5 focus-visible:after:bg-marca"
          />
        )}
      </aside>
    </>
  )
}
