'use client'

import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useDroppable, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import {
  AtSign,
  CheckSquare,
  ChevronDown,
  FileText,
  Hash,
  Inbox,
  LayoutDashboard,
  MessageCircle,
  PanelLeftClose,
  Pin,
  Reply,
  Settings,
  Star,
  Users,
  Video,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createContext, useContext, useMemo, useRef, useState, useTransition, type ComponentType, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react'
import { moverItemNavegacao } from '@/app/(app)/acoes-navegacao'
import { avisar } from '@/componentes/tarefas/avisar'
import { IconeVisual } from '@/componentes/IconeVisual'
import { IndicadorCronometro } from './IndicadorCronometro'
import { LinhaNavegacao, type TipoArrastavel } from './LinhaNavegacao'
import type { CronometroAtivo } from '@/servicos/tempo'
import { CriarEspacoDialog, CriarEstruturaDialog, PersonalizarItemDialog } from './CriadoresNavegacao'
import type { ItemLista, Navegacao, NoEspaco, NoPasta } from '@/dominio/arvore-espacos'
import { rotuloMes } from '@/dominio/formatar'
import { COOKIE_LARGURA_LATERAL, COOKIE_MODO_LATERAL, COOKIE_NAV_FECHADOS, LARGURA_LATERAL, escreverFechados, limitarLargura, type ModoLateral } from '@/dominio/tema-lateral'

type Opcao = { id: string; nome: string }
export type PropsPainel = { navegacao: Navegacao; papel: string; cronometro: CronometroAtivo | null; /** Espaços e pastas recolhidos (vem do cookie, para não piscar). */ fechados?: string[] }
type IconeLucide = ComponentType<{ className?: string }>

/** Quais espaços e pastas estão recolhidos. A escolha fica gravada no navegador e vale na próxima visita. */
const Recolhidos = createContext<{ fechado: (id: string) => boolean; alternar: (id: string) => void; admin: boolean }>({ fechado: () => false, alternar: () => {}, admin: false })

const item =
  'flex h-7 items-center gap-2 rounded-md px-2 text-legenda text-lat-2 transition-colors hover:bg-lat-hover hover:text-lat-fg'
const ativo = 'bg-lat-ativo font-semibold text-lat-fg hover:bg-lat-ativo hover:text-lat-fg'

/** Módulo que ainda não existe: aparece como no ClickUp, desabilitado e com a etiqueta "Em breve". */
function ItemEmBreve({ rotulo, Icone }: { rotulo: string; Icone: IconeLucide }) {
  return (
    <span role="link" aria-disabled="true" title={`${rotulo}: em breve`} className="flex h-7 cursor-not-allowed items-center gap-2 rounded-md px-2 text-legenda text-lat-3">
      <Icone className="h-3.5 w-3.5" />
      <span className="min-w-0 flex-1 truncate">{rotulo}</span>
      <span className="shrink-0 rounded-full bg-lat-hover px-1.5 py-0.5 text-micro font-medium tracking-normal text-lat-2">Em breve</span>
    </span>
  )
}

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

function Pasta({ pasta, nivel, contexto, pastas, podeGerir, podeArrastar }: { pasta: NoPasta; nivel: number; contexto: Opcao | null; pastas: NoPasta[]; podeGerir: boolean; podeArrastar: boolean }) {
  const { fechado, alternar } = useContext(Recolhidos)
  const aberta = !fechado(pasta.id)
  const setAberta = () => alternar(pasta.id)

  return (
    <div>
      <LinhaNavegacao tipo="folder" id={pasta.id} nome={pasta.nome} habilitado={podeArrastar} podeEditar={podeGerir} podeExcluir={podeGerir} className={`${item} group w-full`} style={{ paddingLeft: 8 + nivel * 14 }}>
        <IconeAlternavel aberto={aberta} alternar={setAberta} rotulo={pasta.nome} ativo>
          <span style={{ color: pasta.cor }}><IconeVisual icone={pasta.icone} emoji={pasta.emoji} className="h-3.5 w-3.5" /></span>
        </IconeAlternavel>
        <button type="button" onClick={setAberta} className="min-w-0 flex-1 truncate text-left">{pasta.nome}</button>
        <span className="ml-auto text-legenda tabular-nums text-lat-3">{pasta.listas.length}</span>
        {podeGerir && <CriarEstruturaDialog espaco={contexto} pastas={pastas} pastaInicial={pasta.id} modoInicial="lista" />}
        {podeGerir && <PersonalizarItemDialog tipo="folders" id={pasta.id} nomeInicial={pasta.nome} visualInicial={{ cor: pasta.cor, icone: pasta.icone, emoji: pasta.emoji }} />}
      </LinhaNavegacao>
      {aberta && pasta.listas.map((lista) => <LinkLista key={lista.id} lista={lista} nivel={nivel + 1} podeGerir={podeGerir} podeArrastar={podeArrastar} />)}
    </div>
  )
}

function Espaco({ espaco, nivel, podeGerir, podeEditarEspaco, podeArrastar }: { espaco: NoEspaco; nivel: number; podeGerir: boolean; podeEditarEspaco: boolean; podeArrastar: boolean }) {
  const caminho = usePathname()
  const { fechado, alternar } = useContext(Recolhidos)
  const aberto = !fechado(espaco.id)
  const href = `/espacos/${espaco.id}`
  const temConteudo = espaco.filhos.length + espaco.pastas.length + espaco.listas.length > 0

  return (
    <div>
      <LinhaNavegacao tipo="space" id={espaco.id} nome={espaco.nome} habilitado={podeArrastar} podeEditar={podeEditarEspaco} podeExcluir={podeEditarEspaco} fixa={!!espaco.slug} className={`${item} group ${caminho === href ? ativo : ''}`} style={{ paddingLeft: 8 + nivel * 14 }}>
        <IconeAlternavel aberto={aberto} alternar={() => alternar(espaco.id)} rotulo={espaco.nome} ativo={temConteudo}>
          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] text-white" style={{ background: espaco.cor }}>
            <IconeVisual icone={espaco.icone} emoji={espaco.emoji} className="h-2.5 w-2.5" />
          </span>
        </IconeAlternavel>
        <Link href={href} draggable={false} className="min-w-0 flex-1 truncate">
          {espaco.nome}
        </Link>
        {podeGerir && <CriarEstruturaDialog espaco={{ id: espaco.id, nome: espaco.nome }} pastas={espaco.pastas} />}
        {podeEditarEspaco && <PersonalizarItemDialog tipo="spaces" id={espaco.id} nomeInicial={espaco.nome} visualInicial={{ cor: espaco.cor, icone: espaco.icone, emoji: espaco.emoji }} />}
      </LinhaNavegacao>

      {aberto && (
        <div>
          {espaco.filhos.map((filho) => <Espaco key={filho.id} espaco={filho} nivel={nivel + 1} podeGerir={podeGerir} podeEditarEspaco={podeEditarEspaco} podeArrastar={podeArrastar} />)}
          {espaco.pastas.map((pasta) => <Pasta key={pasta.id} pasta={pasta} nivel={nivel + 1} contexto={{ id: espaco.id, nome: espaco.nome }} pastas={espaco.pastas} podeGerir={podeGerir} podeArrastar={podeArrastar} />)}
          {espaco.listas.map((lista) => <LinkLista key={lista.id} lista={lista} nivel={nivel + 1} podeGerir={podeGerir} podeArrastar={podeArrastar} />)}
        </div>
      )}
    </div>
  )
}

/** Segunda camada: árvore de espaços, pastas e listas. `mobile` = dentro do menu do celular (traz também os atalhos da navegação principal). */
export function PainelEspacos({ navegacao, papel, cronometro, fechados: fechadosIniciais = [], acaoTopo, mobile = false }: PropsPainel & { acaoTopo?: ReactNode; mobile?: boolean }) {
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

  const link = (href: string, rotulo: string, Icone: IconeLucide) => (
    <Link href={href} className={`${item} ${caminho.startsWith(href) ? ativo : ''}`}>
      <Icone className="h-3.5 w-3.5 text-lat-2" />
      <span className="truncate">{rotulo}</span>
    </Link>
  )

  return (
    <Recolhidos.Provider value={recolhimento}>
    <div className="flex h-full min-w-0 flex-1 flex-col bg-lat-bg text-lat-fg">
      <div className={`min-h-0 flex-1 overflow-y-auto px-2 py-2 ${movendo ? 'pointer-events-none opacity-70' : ''}`}>
        {mobile && (
          <>
            <nav className="space-y-0.5">
              {link('/inicio', 'Minhas tarefas', CheckSquare)}
              {link('/documentos', 'Documentos', FileText)}
              {link('/clientes', 'Clientes', Users)}
              {papel === 'admin' && link('/config', 'Configurações', Settings)}
            </nav>
            <div className="mx-2 my-3 border-t border-lat-borda" />
          </>
        )}

        <TituloSecao>Início</TituloSecao>
        <nav className="space-y-0.5">
          {link('/painel-de-gestao', 'Painel de Gestão', LayoutDashboard)}
          <ItemEmBreve rotulo="Caixa de entrada" Icone={Inbox} />
          <ItemEmBreve rotulo="Respostas" Icone={Reply} />
          <ItemEmBreve rotulo="Comentários atribuídos" Icone={AtSign} />
          <ItemEmBreve rotulo="Reuniões" Icone={Video} />
          {link('/inicio', 'Minhas tarefas', CheckSquare)}
          {link('/documentos', 'Documentos', FileText)}
        </nav>
        <div className="mx-2 my-3 border-t border-lat-borda" />
        <TituloSecao>Favoritos</TituloSecao>
        <nav className="space-y-0.5">
          <ItemEmBreve rotulo="Marcar como favorito" Icone={Star} />
        </nav>
        <div className="mx-2 my-3 border-t border-lat-borda" />

        <DndContext id="navegacao-lateral" sensors={sensores} collisionDetection={closestCenter} onDragStart={() => setArrastando(true)} onDragCancel={() => setArrastando(false)} onDragEnd={concluirMovimento}>
          <SortableContext items={itensOrdenaveis} strategy={verticalListSortingStrategy}>
            <div className="flex h-7 items-center px-2">
              <h2 className="min-w-0 flex-1 text-legenda font-semibold tracking-rotulo text-lat-3">Espaços</h2>
              {papel === 'admin' && <CriarEspacoDialog pais={arvore.map((espaco) => ({ id: espaco.id, nome: espaco.nome }))} />}
              {acaoTopo}
            </div>

            <nav className="space-y-0.5">
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

        <div className="mt-3 border-t border-lat-borda pt-2">
          <TituloSecao>Canais</TituloSecao>
          <ItemEmBreve rotulo="Adicionar canal" Icone={Hash} />
          <TituloSecao>Mensagens diretas</TituloSecao>
          <ItemEmBreve rotulo="Nova mensagem" Icone={MessageCircle} />
        </div>
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

/** Camada 2 no desktop: a barra de espaços, abaixo do cabeçalho, recolhível e redimensionável. */
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
            ? `fixed bottom-0 left-16 top-14 z-40 shadow-flutuante transition-transform duration-200 ${aberta ? 'translate-x-0' : '-translate-x-[calc(100%+64px)]'}`
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
