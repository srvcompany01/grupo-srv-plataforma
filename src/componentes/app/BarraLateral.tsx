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
  ChartNoAxesCombined,
  Filter,
  LayoutDashboard,
  Megaphone,
  MessagesSquare,
  Mic,
  Newspaper,
  House,
  PenTool,
  Settings,
  Users,
  UsersRound,
  Wallet,
  TrendingUp,
  MapPin,
  Radar,
  Grip,
  Rocket,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createContext, useContext, useEffect, useMemo, useRef, useState, useTransition, type ComponentType, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react'
import { moverItemNavegacao } from '@/app/(app)/acoes-navegacao'
import { avisar } from '@/componentes/tarefas/avisar'
import { IndicadorCronometro } from './IndicadorCronometro'
import { AlternarTema } from './AlternarTema'
import { Ic } from './Ic'
import { ListaOrdenavel } from './ListaOrdenavel'
import { EVENTO_ABRIR_PALETA, EVENTO_ALTERNAR_BARRA } from './AtalhosGlobais'
import { MenuPerfil } from './MenuPerfil'
import { DestinosMover, LinhaNavegacao, type DestinoMover, type TipoArrastavel } from './LinhaNavegacao'
import type { CronometroAtivo } from '@/servicos/tempo'
import { CriarEspacoDialog, CriarEstruturaDialog, PersonalizarItemDialog } from './CriadoresNavegacao'
import type { ItemLista, Navegacao, NoEspaco, NoPasta } from '@/dominio/arvore-espacos'
import { rotuloMes } from '@/dominio/formatar'
import { COOKIE_LARGURA_LATERAL, COOKIE_MODO_LATERAL, COOKIE_NAV_FECHADOS, COOKIE_ORDEM_INICIO, LARGURA_LATERAL, escreverFechados, limitarLargura, type ModoLateral, type ModoTema } from '@/dominio/tema-lateral'

type Opcao = { id: string; nome: string }
export type PropsPainel = { navegacao: Navegacao; /** Canais do chat (seção Canais do painel). */ canais?: { id: string; nome: string; naoLidas: number; privado: boolean }[]; /** Listas com a estrela da pessoa (seção Favoritos). */ favoritas?: { id: string; nome: string }[]; papel: string; /** Nome de quem está logado (perfil no pé da faixa de ícones). */ nome: string; /** Tema escolhido (claro é o padrão). */ tema: ModoTema; cronometro: CronometroAtivo | null; /** Espaços e pastas recolhidos (vem do cookie, para não piscar). */ fechados?: string[]; /** Ordem dos atalhos de Início escolhida pela pessoa (vem do cookie). */ ordemInicio?: string[]; /** Mensagens do chat ainda não lidas. */ chatNaoLidas?: number }
type IconeLucide = ComponentType<{ className?: string }>

type Atalho = { id: string; href: string; rotulo: string; curto: string; Icone: IconeLucide; contador?: number }

/** Atalhos dos módulos: na faixa de ícones (desktop) e no topo do menu (celular). `curto` = rótulo da faixa. */
export function atalhosDoInicio(papel: string, chatNaoLidas: number): Atalho[] {
  return [
    { id: 'home', href: '/home', rotulo: 'Home', curto: 'Início', Icone: House },
    { id: 'tarefas', href: '/inicio', rotulo: 'Minhas tarefas', curto: 'Tarefas', Icone: CheckSquare },
    { id: 'chat', href: '/chat', rotulo: 'Chat', curto: 'Chat', Icone: MessagesSquare, contador: chatNaoLidas },
    { id: 'agenda', href: '/agenda', rotulo: 'Agenda', curto: 'Planejador', Icone: CalendarDays },
    { id: 'agendamentos', href: '/agendamentos', rotulo: 'Agendamentos', curto: 'Posts', Icone: CalendarClock },
    { id: 'painel', href: '/painel-de-gestao', rotulo: 'Painel de Gestão', curto: 'Painéis', Icone: LayoutDashboard },
    { id: 'clientes', href: '/clientes', rotulo: 'Clientes', curto: 'Clientes', Icone: Users },
    { id: 'anuncios', href: '/anuncios', rotulo: 'Anúncios', curto: 'Anúncios', Icone: Megaphone },
    { id: 'insights', href: '/insights', rotulo: 'Insights', curto: 'Insights', Icone: ChartNoAxesCombined },
    { id: 'gmn', href: '/gmn', rotulo: 'Google Meu Negócio', curto: 'GMN', Icone: MapPin },
    { id: 'biolytics', href: '/biolytics', rotulo: 'Biolytics', curto: 'Biolytics', Icone: Radar },
    { id: 'performance', href: '/performance', rotulo: 'Performance', curto: 'Perform.', Icone: TrendingUp },
    { id: 'projetos', href: '/projetos', rotulo: 'Projetos', curto: 'Projetos', Icone: Briefcase },
    { id: 'reunioes', href: '/reunioes', rotulo: 'Reuniões', curto: 'Reuniões', Icone: Mic },
    { id: 'time', href: '/time', rotulo: 'Time', curto: 'Equipes', Icone: UsersRound },
    { id: 'blog', href: '/editor-blog', rotulo: 'Blog', curto: 'Blog', Icone: Newspaper },
    { id: 'documentos', href: '/documentos', rotulo: 'Documentos', curto: 'Docum.', Icone: FileText },
    { id: 'quadros', href: '/quadros', rotulo: 'Quadros', curto: 'Quadros', Icone: PenTool },
    { id: 'funis', href: '/funis', rotulo: 'Funis', curto: 'Funis', Icone: Filter },
    ...(papel === 'admin'
      ? [
          { id: 'financeiro', href: '/financeiro', rotulo: 'Financeiro', curto: 'Financeiro', Icone: Wallet },
          { id: 'formularios', href: '/config/formularios', rotulo: 'Formulários', curto: 'Formulár.', Icone: ClipboardList },
          { id: 'config', href: '/config', rotulo: 'Configurações', curto: 'Config.', Icone: Settings },
        ]
      : []),
  ]
}

const estaEm = (caminho: string, href: string) => caminho === href || caminho.startsWith(`${href}/`)

/**
 * Atalhos da barra lateral: os de uso diário ficam soltos no topo; os grupos ficam recolhidos e abrem por uma setinha.
 * Módulo novo entra no grupo certo aqui (e em atalhosDoInicio); se ficar fora de todos, aparece solto abaixo dos grupos.
 */
const NO_TOPO = ['home', 'espacos', 'chat', 'agenda', 'time', 'documentos', 'painel', 'quadros', 'formularios']
/** Todo o resto abre pelo botão "Mais", como no ClickUp. */
const GRUPOS_FAIXA: { id: string; rotulo: string; curto: string; Icone: IconeLucide; itens: string[] }[] = [
  { id: 'mais', rotulo: 'Mais', curto: 'Mais', Icone: Grip, itens: ['clientes', 'projetos', 'financeiro', 'anuncios', 'insights', 'gmn', 'performance', 'biolytics', 'blog', 'funis'] },
]

/** Nome do ícone (Material Symbols Rounded) de cada módulo, como no protótipo do redesign. */
export const ICONE_MS: Record<string, string> = {
  home: 'home', espacos: 'grid_view', chat: 'chat_bubble', agenda: 'event_note', time: 'groups', documentos: 'description', painel: 'monitoring', quadros: 'draw', formularios: 'assignment',
  tarefas: 'task_alt', agendamentos: 'event_available', reunioes: 'videocam', clientes: 'storefront', projetos: 'work', financeiro: 'payments', anuncios: 'campaign', insights: 'insights',
  gmn: 'location_on', performance: 'trending_up', biolytics: 'radar', blog: 'article', funis: 'filter_alt', config: 'settings',
}

const botaoRail = { flex: 'none', border: 0, background: 'transparent', color: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', borderRadius: 6 } as const

/**
 * Faixa de ícones (desktop, 64px, escura, cartão flutuante): botão de recolher o painel, os módulos (ladrilho 34×28 + rótulo de 10px; o ativo
 * ganha ladrilho vermelho), "Mais" (popover de 2 colunas) e, no pé, Convidar, tema e Configurações. Os módulos se reorganizam arrastando.
 */
export function FaixaAtalhos({ papel, chatNaoLidas = 0, ordemInicio = [], tema }: Pick<PropsPainel, 'papel' | 'nome' | 'chatNaoLidas' | 'ordemInicio' | 'tema'>) {
  const caminho = usePathname()
  const atalhos = atalhosDoInicio(papel, chatNaoLidas)
  const [abertoEm, setAbertoEm] = useState<string | null>(null)
  const aberto = abertoEm === caminho ? 'mais' : null
  const faixa = useRef<HTMLElement>(null)
  const [recolhido, setRecolhido] = useState(false)
  const ativoEm = (href: string) => estaEm(caminho, href) && !atalhos.some((a) => a.href !== href && a.href.startsWith(`${href}/`) && estaEm(caminho, a.href))
  const porId = new Map(atalhos.map((a) => [a.id, a]))
  porId.set('espacos', { id: 'espacos', href: '#espacos', rotulo: 'Espaços', curto: 'Espaços', Icone: Rocket })
  const soltosTopo = NO_TOPO.map((id) => porId.get(id)).filter((a): a is Atalho => !!a)
  const agrupados = GRUPOS_FAIXA.flatMap((g) => g.itens).map((id) => porId.get(id)).filter((a): a is Atalho => !!a)
  const emEspacos = /^\/(espacos|listas|pastas)(\/|$)/.test(caminho)
  useEffect(() => {
    if (!aberto) return
    const fora = (e: MouseEvent) => { if (!faixa.current?.contains(e.target as Node)) setAbertoEm(null) }
    const esc = (e: globalThis.KeyboardEvent) => { if (e.key === 'Escape') setAbertoEm(null) }
    document.addEventListener('mousedown', fora)
    document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', fora); document.removeEventListener('keydown', esc) }
  }, [aberto])
  useEffect(() => {
    const ouvir = () => setRecolhido((r) => !r)
    window.addEventListener(EVENTO_ALTERNAR_BARRA, ouvir)
    return () => window.removeEventListener(EVENTO_ALTERNAR_BARRA, ouvir)
  }, [])

  const item = ({ id, href, rotulo, curto, contador }: Atalho) => {
    const ativo = id === 'espacos' ? emEspacos : ativoEm(href)
    const estilo = { position: 'relative', width: 56, height: 50, flex: 'none', border: 0, borderRadius: 8, background: 'transparent', color: ativo ? '#fff' : 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, cursor: 'pointer', textDecoration: 'none' } as const
    const conteudo = (
      <>
        <span className="rail-tile" style={{ position: 'relative', width: 34, height: 28, borderRadius: 8, background: ativo ? '#d80d12' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 120ms' }}>
          <Ic n={ICONE_MS[id] ?? 'apps'} s={18} />
          {!!contador && <span style={{ position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16, padding: '0 4px', borderRadius: 8, background: '#d80d12', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 2px var(--rail)' }}>{contador > 99 ? '99+' : contador}</span>}
        </span>
        <span style={{ fontSize: 10, lineHeight: 1, fontWeight: 500, whiteSpace: 'nowrap' }}>{curto}</span>
      </>
    )
    return id === 'espacos' ? (
      <button key={id} type="button" title={rotulo} onClick={() => window.dispatchEvent(new Event(EVENTO_ALTERNAR_BARRA))} className="rail-item" style={estilo}>{conteudo}</button>
    ) : (
      <Link key={id} href={href} title={rotulo} draggable={false} aria-current={ativo ? 'page' : undefined} className="rail-item" style={estilo}>{conteudo}</Link>
    )
  }
  const config = porId.get('config')

  return (
    <nav ref={faixa} aria-label="Módulos" className="rail-nav sticky top-[72px] z-30 hidden h-[calc(100dvh-80px)] md:flex" style={{ width: 64, flex: 'none', background: 'var(--rail)', color: 'var(--rail-text)', borderRadius: 10, flexDirection: 'column', alignItems: 'center', padding: '6px 0 8px', gap: 4, overflowY: 'auto', scrollbarWidth: 'none' }}>
      <button type="button" onClick={() => window.dispatchEvent(new Event(EVENTO_ALTERNAR_BARRA))} title={recolhido ? 'Mostrar barra lateral' : 'Recolher barra lateral'} className="rail-btn" style={{ ...botaoRail, width: 40, height: 32 }}><Ic n={recolhido ? 'left_panel_open' : 'left_panel_close'} s={18} /></button>
      <div style={{ width: 28, height: 1, flex: 'none', background: 'rgba(255,255,255,.1)', margin: '2px 0 4px' }} />
      <ListaOrdenavel className="flex flex-col items-center" cookie={COOKIE_ORDEM_INICIO} ordemInicial={ordemInicio} itens={soltosTopo.map((a) => ({ id: a.id, no: item(a) }))} />
      <div style={{ position: 'relative' }}>
        <button type="button" onClick={() => setAbertoEm(aberto ? null : caminho)} title="Mais módulos" aria-expanded={!!aberto} aria-haspopup="menu" className="rail-btn" style={{ ...botaoRail, width: 56, height: 46, flexDirection: 'column', gap: 3 }}>
          <Ic n="more_horiz" s={18} />
          <span style={{ fontSize: 10, lineHeight: 1, fontWeight: 500 }}>Mais</span>
        </button>
        {aberto && (
          <div role="menu" aria-label="Mais módulos" style={{ position: 'fixed', left: 80, bottom: 90, zIndex: 41, width: 320, padding: 4, borderRadius: 8, background: 'var(--bg-elev)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-pop)', color: 'var(--text)' }}>
            <p style={{ padding: '6px 8px 4px', fontSize: 11, fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase', color: 'var(--text-3)' }}>Mais módulos</p>
            <ListaOrdenavel
              className="grid grid-cols-2 gap-0.5"
              cookie={COOKIE_ORDEM_INICIO}
              ordemInicial={ordemInicio}
              itens={agrupados.map(({ id, href, rotulo }) => ({
                id,
                no: (
                  <Link href={href} draggable={false} role="menuitem" aria-current={ativoEm(href) ? 'page' : undefined} className="menu-item" style={{ height: 32, display: 'flex', alignItems: 'center', gap: 8, padding: '0 8px', borderRadius: 4, fontSize: 13, background: ativoEm(href) ? 'var(--bg-active)' : 'transparent', fontWeight: ativoEm(href) ? 600 : 400, color: 'var(--text)', textDecoration: 'none' }}>
                    <Ic n={ICONE_MS[id] ?? 'apps'} s={16} style={{ color: 'var(--text-2)' }} />{rotulo}
                  </Link>
                ),
              }))}
            />
          </div>
        )}
      </div>
      <div style={{ flex: 1, minHeight: 8 }} />
      {papel === 'admin' && <Link href="/config/usuarios" title="Convidar" className="rail-btn" style={{ ...botaoRail, width: 40, height: 36 }}><Ic n="person_add" s={18} /></Link>}
      <AlternarTema inicial={tema} className="rail-btn" estilo={{ ...botaoRail, width: 40, height: 36 }} />
      {config && <Link href={config.href} title="Configurações" className="rail-btn" style={{ ...botaoRail, width: 40, height: 36, color: ativoEm(config.href) ? '#fff' : 'inherit' }}><Ic n="settings" s={18} /></Link>}
    </nav>
  )
}

/** Quais espaços e pastas estão recolhidos. A escolha fica gravada no navegador e vale na próxima visita. */
const Recolhidos = createContext<{ fechado: (id: string) => boolean; alternar: (id: string) => void; admin: boolean }>({ fechado: () => false, alternar: () => {}, admin: false })

const item = 'flex h-7 items-center gap-2 rounded px-2 text-[13px] text-texto transition-colors hover:bg-[var(--bg-hover)]'
const ativo = 'bg-[var(--bg-active)] font-semibold hover:bg-[var(--bg-active)]'
const linhaArvore = 'group flex h-7 items-center gap-1.5 rounded pr-1 text-[13px] text-texto transition-colors hover:bg-[var(--bg-hover)]'
const rotuloSecao = 'text-[11px] font-semibold uppercase tracking-[0.04em] text-texto-3'

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
      className={`${linhaArvore} ${caminho === href ? 'bg-[var(--bg-active)] font-semibold' : ''}`}
      style={{ paddingLeft: 6 + nivel * 14 }}
    >
      <Link href={href} draggable={false} title={[lista.nome, detalhe].filter(Boolean).join(' · ')} className="flex min-w-0 flex-1 items-center gap-1.5">
        <span className="flex w-4 shrink-0 justify-center"><span style={{ width: 7, height: 7, borderRadius: 2, background: lista.cor }} /></span>
        <span className="min-w-0 flex-1 truncate">{lista.nome}</span>
        {detalhe && <span className="text-rotulo text-texto-3">{detalhe}</span>}
      </Link>
      {podeGerir && <PersonalizarItemDialog tipo="lists" id={lista.id} nomeInicial={lista.nome} visualInicial={{ cor: lista.cor, icone: lista.icone, emoji: lista.emoji }} />}
    </LinhaNavegacao>
  )
}

function Pasta({ pasta, nivel, contexto, pastas, podeGerir, podeArrastar }: { pasta: NoPasta; nivel: number; contexto: Opcao | null; pastas: NoPasta[]; podeGerir: boolean; podeArrastar: boolean }) {
  const { fechado, alternar } = useContext(Recolhidos)
  const aberta = !fechado(pasta.id)
  return (
    <div>
      <LinhaNavegacao tipo="folder" id={pasta.id} nome={pasta.nome} habilitado={podeArrastar} podeEditar={podeGerir} podeExcluir={podeGerir} className={linhaArvore} style={{ paddingLeft: 6 + nivel * 14 }}>
        <button type="button" aria-label={aberta ? 'Recolher pasta' : 'Expandir pasta'} onClick={() => alternar(pasta.id)} className="flex w-4 shrink-0 text-texto-3"><Ic n={aberta ? 'expand_more' : 'chevron_right'} s={16} /></button>
        <Ic n="folder" s={16} className="text-texto-2" />
        <span className="min-w-0 flex-1 truncate">{pasta.nome}</span>
        {podeGerir && <CriarEstruturaDialog espaco={contexto} pastas={pastas} pastaInicial={pasta.id} modoInicial="lista" />}
        {podeGerir && <PersonalizarItemDialog tipo="folders" id={pasta.id} nomeInicial={pasta.nome} visualInicial={{ cor: pasta.cor, icone: pasta.icone, emoji: pasta.emoji }} />}
      </LinhaNavegacao>
      {aberta && pasta.listas.map((lista) => <LinkLista key={lista.id} lista={lista} nivel={nivel + 1} podeGerir={podeGerir} podeArrastar={podeArrastar} />)}
    </div>
  )
}

/** Espaço na raiz vira um cartão com o nome em maiúsculas e as listas dentro; espaço dentro de espaço vira subtítulo. */
function Espaco({ espaco, nivel, podeGerir, podeEditarEspaco, podeArrastar }: { espaco: NoEspaco; nivel: number; podeGerir: boolean; podeEditarEspaco: boolean; podeArrastar: boolean }) {
  const caminho = usePathname()
  const { fechado, alternar } = useContext(Recolhidos)
  const href = `/espacos/${espaco.id}`
  const aberto = !fechado(espaco.id)
  return (
    <div>
      <LinhaNavegacao
        tipo="space"
        id={espaco.id}
        nome={espaco.nome}
        habilitado={podeArrastar}
        podeEditar={podeEditarEspaco}
        podeExcluir={podeEditarEspaco}
        fixa={!!espaco.slug}
        className={`${linhaArvore} ${caminho === href ? 'bg-[var(--bg-active)]' : ''}`}
        style={{ paddingLeft: 6 + nivel * 14 }}
      >
        <button type="button" aria-label={aberto ? 'Recolher espaço' : 'Expandir espaço'} onClick={() => alternar(espaco.id)} className="flex w-4 shrink-0 text-texto-3"><Ic n={aberto ? 'expand_more' : 'chevron_right'} s={16} /></button>
        <span style={{ width: 18, height: 18, flex: 'none', borderRadius: 4, background: espaco.cor, color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{espaco.nome.slice(0, 1).toUpperCase()}</span>
        <Link href={href} draggable={false} className="min-w-0 flex-1 truncate font-medium">{espaco.nome}</Link>
        {podeGerir && <CriarEstruturaDialog espaco={{ id: espaco.id, nome: espaco.nome }} pastas={espaco.pastas} />}
        {podeEditarEspaco && <PersonalizarItemDialog tipo="spaces" id={espaco.id} nomeInicial={espaco.nome} visualInicial={{ cor: espaco.cor, icone: espaco.icone, emoji: espaco.emoji }} />}
      </LinhaNavegacao>
      {aberto && (
        <div>
          {espaco.listas.map((lista) => <LinkLista key={lista.id} lista={lista} nivel={nivel + 1} podeGerir={podeGerir} podeArrastar={podeArrastar} />)}
          {espaco.pastas.map((pasta) => <Pasta key={pasta.id} pasta={pasta} nivel={nivel + 1} contexto={{ id: espaco.id, nome: espaco.nome }} pastas={espaco.pastas} podeGerir={podeGerir} podeArrastar={podeArrastar} />)}
          {espaco.filhos.map((filho) => <Espaco key={filho.id} espaco={filho} nivel={nivel + 1} podeGerir={podeGerir} podeEditarEspaco={podeEditarEspaco} podeArrastar={podeArrastar} />)}
        </div>
      )}
    </div>
  )
}

/** Segunda barra: cada departamento (espaço) com as suas pastas e listas. No celular, também os atalhos dos módulos, o tema e o perfil. */
export function PainelEspacos({ navegacao, canais = [], favoritas = [], papel, nome, cronometro, fechados: fechadosIniciais = [], ordemInicio = [], chatNaoLidas = 0, tema, acaoTopo, comAtalhos = false }: PropsPainel & { acaoTopo?: ReactNode; /** Atalhos dos módulos no topo (no celular, onde não há a faixa de ícones). */ comAtalhos?: boolean }) {
  const caminho = usePathname()
  const atalhos = atalhosDoInicio(papel, chatNaoLidas)
  const [fechados, setFechados] = useState(() => new Set(fechadosIniciais))
  const [favAberto, setFavAberto] = useState(true)
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
  const destinos = useMemo(() => {
    const lista: DestinoMover[] = []
    const visitar = (e: Navegacao['espacos'][number]) => {
      lista.push({ id: e.id, nome: e.nome, tipo: 'space' })
      for (const pa of e.pastas) lista.push({ id: pa.id, nome: `${e.nome} › ${pa.nome}`, tipo: 'folder' })
      e.filhos.forEach(visitar)
    }
    navegacao.espacos.forEach(visitar)
    return lista
  }, [navegacao])
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

  const link = (href: string, rotulo: string, icone: string, contador = 0) => (
    <Link href={href} draggable={false} className={`${item} ${estaEm(caminho, href) ? ativo : ''}`}>
      <Ic n={icone} s={16} className="text-texto-2" />
      <span className="flex-1 truncate">{rotulo}</span>
      {contador > 0 && <span className="text-rotulo text-texto-3">{contador > 99 ? '99+' : contador}</span>}
    </Link>
  )

  return (
    <Recolhidos.Provider value={recolhimento}>
    <DestinosMover.Provider value={destinos}>
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col" style={{ background: 'var(--bg-subtle)', color: 'var(--text)' }}>
      <div className="flex shrink-0 items-center" style={{ height: 40, gap: 2, padding: '0 6px 0 14px', borderBottom: '1px solid var(--border-soft)' }}>
        <span style={{ fontWeight: 600, fontSize: 14, flex: 1 }}>Início</span>
        {papel === 'admin' && (
          <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--bg)', marginRight: 2 }}>
            <CriarEspacoDialog pais={arvore.map((espaco) => ({ id: espaco.id, nome: espaco.nome }))} trigger={<button type="button" title="Criar" className="hover-bg" style={{ width: 26, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 0, background: 'transparent', borderRadius: '5px 0 0 5px', color: 'var(--text)', cursor: 'pointer' }}><Ic n="add" s={16} /></button>} />
            <Link href="/config/espacos" title="Opções de criação" className="hover-bg" style={{ width: 18, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', borderLeft: '1px solid var(--border)', borderRadius: '0 5px 5px 0', color: 'var(--text-2)' }}><Ic n="expand_more" s={14} /></Link>
          </div>
        )}
        {acaoTopo}
      </div>
      <div className={`flex min-h-0 flex-1 flex-col overflow-y-auto ${movendo ? 'pointer-events-none opacity-70' : ''}`} style={{ padding: '6px 6px 12px', gap: 1 }}>
        {!comAtalhos && ['home', 'tarefas', 'agenda', 'agendamentos', 'reunioes'].map((id) => atalhos.find((a) => a.id === id)).filter((a): a is Atalho => !!a).map((a) => <div key={a.id}>{link(a.href, a.rotulo, ICONE_MS[a.id] ?? 'apps', a.contador)}</div>)}
        {comAtalhos && (
          <ListaOrdenavel
            className="flex flex-col"
            cookie={COOKIE_ORDEM_INICIO}
            ordemInicial={ordemInicio}
            itens={atalhos.map((a) => ({ id: a.id, no: link(a.href, a.rotulo, ICONE_MS[a.id] ?? 'apps', a.contador) }))}
          />
        )}

        <button type="button" onClick={() => setFavAberto((v) => !v)} className={`${rotuloSecao} flex h-7 shrink-0 items-center gap-1 rounded px-1 text-left hover:text-texto-2`} style={{ marginTop: 10 }}>
          <Ic n={favAberto ? 'expand_more' : 'chevron_right'} s={14} />Favoritos
        </button>
        {favAberto && favoritas.map((f) => <div key={f.id}>{link(`/listas/${f.id}`, f.nome, 'list_alt')}</div>)}
        {favAberto && favoritas.length === 0 && <p className="px-2 text-rotulo text-texto-3">Clique na estrela de uma lista para fixá-la aqui.</p>}

        <DndContext id="navegacao-lateral" sensors={sensores} collisionDetection={closestCenter} onDragStart={() => setArrastando(true)} onDragCancel={() => setArrastando(false)} onDragEnd={concluirMovimento}>
          <SortableContext items={itensOrdenaveis} strategy={verticalListSortingStrategy}>
            <div className="flex shrink-0 items-center" style={{ height: 28, gap: 2, paddingLeft: 8, marginTop: 10 }}>
              <span className={rotuloSecao} style={{ flex: 1 }}>Espaços</span>
              <button type="button" aria-label="Buscar espaços" title="Buscar espaços (⌘K)" onClick={() => window.dispatchEvent(new Event(EVENTO_ABRIR_PALETA))} className="hover-bg" style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 0, background: 'transparent', borderRadius: 4, color: 'var(--text-3)', cursor: 'pointer' }}><Ic n="search" s={15} /></button>
              {papel === 'admin' && <CriarEspacoDialog pais={arvore.map((espaco) => ({ id: espaco.id, nome: espaco.nome }))} trigger={<button type="button" title="Novo espaço" className="hover-bg" style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 0, background: 'transparent', borderRadius: 4, color: 'var(--text-3)', cursor: 'pointer' }}><Ic n="add" s={15} /></button>} />}
            </div>
            <nav className="flex flex-col" style={{ gap: 1 }}>
              {arvore.length === 0 && <p className="px-2 py-2 text-rotulo text-texto-3">Nenhum espaço disponível.</p>}
              {arvore.map((espaco) => <Espaco key={espaco.id} espaco={espaco} nivel={0} podeGerir={papel === 'admin' || papel === 'gestor'} podeEditarEspaco={papel === 'admin'} podeArrastar={podeArrastar} />)}
            </nav>
            {(navegacao.pastasRaiz.length > 0 || navegacao.listasRaiz.length > 0) && (
              <nav className="mt-2 flex flex-col" style={{ gap: 1 }}>
                {navegacao.pastasRaiz.map((pasta) => <Pasta key={pasta.id} pasta={pasta} nivel={0} contexto={null} pastas={navegacao.pastasRaiz} podeGerir={papel === 'admin'} podeArrastar={podeArrastar} />)}
                {navegacao.listasRaiz.map((lista) => <LinkLista key={lista.id} lista={lista} nivel={0} podeGerir={papel === 'admin'} podeArrastar={podeArrastar} />)}
              </nav>
            )}
            <ZonaRaiz visivel={arrastando} />
          </SortableContext>
        </DndContext>
        {papel === 'admin' && <CriarEspacoDialog pais={arvore.map((espaco) => ({ id: espaco.id, nome: espaco.nome }))} trigger={<button type="button" className="hover-bg flex h-7 w-full shrink-0 items-center gap-2 rounded px-2 text-left text-[13px] text-texto-3"><Ic n="add" s={16} />Novo espaço</button>} />}

        <div className={`${rotuloSecao} flex h-7 shrink-0 items-center px-2`} style={{ marginTop: 10 }}>Canais</div>
        {canais.map((c) => (
          <Link key={c.id} href={`/chat/${c.nome}`} className={`${item} ${caminho === `/chat/${c.nome}` ? ativo : ''}`}>
            <Ic n={c.privado ? 'lock' : 'tag'} s={16} className="text-texto-2" />
            <span className="min-w-0 flex-1 truncate">{c.nome}</span>
            {c.naoLidas > 0 && <span className="text-rotulo text-texto-3">{c.naoLidas > 99 ? '99+' : c.naoLidas}</span>}
          </Link>
        ))}
        <Link href="/chat" className="hover-bg flex h-7 shrink-0 items-center gap-2 rounded px-2 text-[13px] text-texto-3"><Ic n="add" s={16} />Adicionar canal</Link>
      </div>

      <div className="flex shrink-0 flex-col" style={{ borderTop: '1px solid var(--border)', padding: 6, gap: 2 }}>
        <IndicadorCronometro cronometro={cronometro} />
        {!comAtalhos && (
          <>
            <Link href="/chat" className={item}><Ic n="forum" s={16} className="text-texto-2" /><span className="flex-1">Mensagens diretas</span>{chatNaoLidas > 0 && <span style={{ minWidth: 16, height: 16, padding: '0 4px', borderRadius: 8, background: '#d80d12', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{chatNaoLidas > 99 ? '99+' : chatNaoLidas}</span>}</Link>
            <Link href="/config/personalizacao" className={`${item} text-texto-2`}><Ic n="tune" s={16} />Personalizar a barra lateral</Link>
          </>
        )}
        {comAtalhos && (
          <div className="flex items-center gap-1">
            <MenuPerfil nome={nome} papel={papel} lado="top" comNome className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5 outline-none transition-colors hover:bg-lat-hover" />
            <AlternarTema inicial={tema} className="hover-bg" estilo={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 0, background: 'transparent', borderRadius: 6, color: 'var(--text-2)', cursor: 'pointer' }} />
          </div>
        )}
      </div>
    </div>
    </DestinosMover.Provider>
    </Recolhidos.Provider>
  )
}


function gravarPreferencia(chave: string, valor: string) {
  document.cookie = `${chave}=${valor}; path=/; max-age=31536000; samesite=lax`
}

/** Barra lateral do desktop, abaixo do cabeçalho: recolhível e redimensionável. */
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
  // ⌘/Ctrl+\ alterna entre fixa e recolhida.
  useEffect(() => {
    const alternar = () => trocarModo(modo === 'recolhida' ? 'fixa' : 'recolhida')
    window.addEventListener(EVENTO_ALTERNAR_BARRA, alternar)
    return () => window.removeEventListener(EVENTO_ALTERNAR_BARRA, alternar)
  })
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
      {recolhida && <div aria-hidden="true" className="fixed bottom-0 left-[72px] top-[72px] z-30 hidden w-2 md:block" onMouseEnter={abrir} />}
      <aside
        ref={asideRef}
        style={{ '--lat-w': `${largura}px` } as CSSProperties}
        onMouseEnter={recolhida ? abrir : undefined}
        onMouseLeave={recolhida ? fecharComAtraso : undefined}
        onFocus={recolhida ? abrir : undefined}
        onBlur={recolhida ? (evento) => !evento.currentTarget.contains(evento.relatedTarget) && fecharComAtraso() : undefined}
        className={`hidden h-[calc(100dvh-80px)] w-[var(--lat-w)] overflow-hidden rounded-[10px] border border-lat-borda md:flex ${
          recolhida
            ? `fixed bottom-2 left-[72px] top-[72px] z-40 h-auto shadow-flutuante transition-[translate,opacity] duration-200 ${aberta ? 'translate-x-0' : 'pointer-events-none -translate-x-full opacity-0'}`
            : 'sticky top-[72px] z-20 shrink-0'
        }`}
      >
        <PainelEspacos
          {...props}
          acaoTopo={
            recolhida ? (
              <button type="button" onClick={() => trocarModo('fixa')} aria-label="Fixar barra lateral" title="Fixar barra lateral" className="hover-bg" style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 0, background: 'transparent', borderRadius: 4, color: 'var(--text-2)', cursor: 'pointer' }}>
                <Ic n="push_pin" s={16} />
              </button>
            ) : (
              <button type="button" onClick={() => trocarModo('recolhida')} aria-label="Recolher barra lateral" title="Recolher barra lateral" className="hover-bg" style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 0, background: 'transparent', borderRadius: 4, color: 'var(--text-2)', cursor: 'pointer' }}>
                <Ic n="left_panel_close" s={16} />
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
