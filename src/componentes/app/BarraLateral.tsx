'use client'

import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useDroppable, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createContext, useContext, useEffect, useMemo, useRef, useState, useTransition, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react'
import { moverItemNavegacao } from '@/app/(app)/acoes-navegacao'
import { avisar } from '@/componentes/tarefas/avisar'
import { IndicadorCronometro } from './IndicadorCronometro'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/componentes/ui/dropdown-menu'
import { Ic } from './Ic'
import { AlternarTema } from './AlternarTema'
import { ListaOrdenavel } from './ListaOrdenavel'
import { MenuPerfil } from './MenuPerfil'
import { ICONE_MS, atalhosDoInicio, estaEm, type Atalho } from './atalhos'
import { EVENTO_ABRIR_PALETA, EVENTO_ALTERNAR_BARRA } from './AtalhosGlobais'
import { DestinosMover, LinhaNavegacao, type DestinoMover, type TipoArrastavel } from './LinhaNavegacao'
import type { CronometroAtivo } from '@/servicos/tempo'
import { CriarEspacoDialog, CriarEstruturaDialog, PersonalizarItemDialog } from './CriadoresNavegacao'
import type { ItemLista, Navegacao, NoEspaco, NoPasta } from '@/dominio/arvore-espacos'
import { rotuloMes } from '@/dominio/formatar'
import { COOKIE_LARGURA_LATERAL, COOKIE_MODO_LATERAL, COOKIE_NAV_FECHADOS, COOKIE_ORDEM_INICIO, LARGURA_LATERAL, escreverFechados, limitarLargura, type ModoLateral, type ModoTema } from '@/dominio/tema-lateral'

type Opcao = { id: string; nome: string }
export type PropsPainel = { navegacao: Navegacao; /** Canais do chat (seção Canais do painel). */ canais?: { id: string; nome: string; naoLidas: number; privado: boolean }[]; /** Listas com a estrela da pessoa (seção Favoritos). */ favoritas?: { id: string; nome: string }[]; papel: string; /** Nome de quem está logado (perfil no pé da faixa de ícones). */ nome: string; /** Tema escolhido (claro é o padrão). */ tema: ModoTema; cronometro: CronometroAtivo | null; /** Espaços e pastas recolhidos (vem do cookie, para não piscar). */ fechados?: string[]; /** Ordem dos atalhos de Início escolhida pela pessoa (vem do cookie). */ ordemInicio?: string[]; /** Mensagens do chat ainda não lidas. */ chatNaoLidas?: number }
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
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col" style={{ color: 'var(--text)' }}>
      <div className="flex shrink-0 items-center" style={{ height: 40, gap: 2, padding: '0 6px 0 8px' }}>
        <span style={{ fontWeight: 600, fontSize: 14, flex: 1 }}>Início</span>
        <DropdownMenu>
          <DropdownMenuTrigger title="Criar" aria-label="Criar" className="hover-bg" style={{ height: 26, display: 'flex', alignItems: 'center', gap: 2, padding: '0 6px 0 8px', marginRight: 2, border: 0, borderRadius: 12, background: 'var(--bg-subtle)', color: 'var(--text)', cursor: 'pointer' }}><Ic n="add" s={16} /><Ic n="expand_more" s={14} style={{ color: 'var(--text-2)' }} /></DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem asChild><Link href="/inicio"><Ic n="task_alt" s={16} /> Tarefa</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link href="/agendamentos"><Ic n="add_photo_alternate" s={16} /> Post</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link href="/documentos"><Ic n="description" s={16} /> Documento</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link href="/reunioes"><Ic n="videocam" s={16} /> Reunião</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link href="/quadros"><Ic n="draw" s={16} /> Quadro</Link></DropdownMenuItem>
            {papel === 'admin' && <DropdownMenuItem asChild><Link href="/config/espacos"><Ic n="format_list_bulleted" s={16} /> Espaço, pasta ou lista</Link></DropdownMenuItem>}
          </DropdownMenuContent>
        </DropdownMenu>
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

      <div className="flex shrink-0 flex-col" style={{ padding: 6, gap: 2 }}>
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
  // Desafixada: o painel aparece ao passar o mouse na faixa de ícones e some ao sair.
  useEffect(() => {
    if (!recolhida) return
    const faixa = document.querySelector('.dock')
    if (!faixa) return
    const entrar = () => abrir()
    const sair = () => fecharComAtraso()
    faixa.addEventListener('mouseenter', entrar)
    faixa.addEventListener('mouseleave', sair)
    return () => { faixa.removeEventListener('mouseenter', entrar); faixa.removeEventListener('mouseleave', sair) }
  })
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
      {recolhida && <div aria-hidden="true" className="fixed bottom-0 left-[72px] top-10 z-30 hidden w-2 lg:block" onMouseEnter={abrir} />}
      <aside
        ref={asideRef}
        style={{ '--lat-w': `${largura}px` } as CSSProperties}
        onMouseEnter={recolhida ? abrir : undefined}
        onMouseLeave={recolhida ? fecharComAtraso : undefined}
        onFocus={recolhida ? abrir : undefined}
        onBlur={recolhida ? (evento) => !evento.currentTarget.contains(evento.relatedTarget) && fecharComAtraso() : undefined}
        className={`hidden w-[var(--lat-w)] overflow-hidden lg:flex ${
          recolhida
            ? `fixed bottom-2 left-[80px] top-12 z-40 h-auto rounded-[28px] bg-[var(--bg-elev)] shadow-[var(--shadow-pop)] transition-[translate,opacity] duration-200 ${aberta ? 'translate-x-0' : 'pointer-events-none -translate-x-full opacity-0'}`
            : 'relative z-20 h-full shrink-0'
        }`}
      >
        <PainelEspacos
          {...props}
          acaoTopo={
            <button type="button" onClick={() => trocarModo(recolhida ? 'fixa' : 'recolhida')} aria-pressed={!recolhida} aria-label={recolhida ? 'Fixar barra lateral' : 'Desafixar barra lateral'} title={recolhida ? 'Fixar barra lateral' : 'Desafixar (recolhe sozinha e aparece ao passar o mouse na faixa)'} className="hover-bg" style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 0, background: recolhida ? 'transparent' : 'var(--bg-active)', borderRadius: 8, color: recolhida ? 'var(--text-2)' : 'var(--text)', cursor: 'pointer' }}>
              <Ic n="push_pin" s={16} fill={!recolhida} />
            </button>
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
