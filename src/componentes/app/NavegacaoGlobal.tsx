'use client'

import { ChevronDown, LayoutGrid, Menu, Share2, Sparkles, UserPlus } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { LogoRede } from '@/componentes/redes/LogoRede'
import { Sheet, SheetContent, SheetTitle } from '@/componentes/ui/sheet'
import { papelPodeUsarIA } from '@/ia/acesso'
import { REDES } from '@/dominio/redes-sociais'
import type { ModoTema } from '@/dominio/tema-lateral'
import { COOKIE_ORDEM_INICIO } from '@/dominio/tema-lateral'
import type { Aviso } from '@/servicos/avisos'
import { AlternarTema } from './AlternarTema'
import { EVENTO_ALTERNAR_BARRA } from './AtalhosGlobais'
import { GRUPOS_FAIXA, NO_TOPO, atalhosDoInicio, estaEm, type Atalho } from './atalhos'
import { PainelEspacos, type PropsPainel } from './BarraLateral'
import { Ic } from './Ic'
import { ListaOrdenavel } from './ListaOrdenavel'
import { MenuPerfil } from './MenuPerfil'
import { EVENTO_ABRIR_IA } from './PainelIA'
import { SinoAvisos } from './SinoAvisos'

export type PropsNavegacao = PropsPainel & { avisos: Aviso[]; naoLidos: number; euId: string }

/**
 * Navegação global em três blocos flutuantes de vidro (só ícones): logo · módulos (reordenáveis, "Mais" expande o resto) ·
 * avisos, perfil, convidar, tema e configurações. Celular: a mesma navegação vira a barra de baixo (DockCelular).
 * O painel de espaços fica ao lado (BarraLateral) e, no tablet e no celular, abre numa gaveta pelo botão de Espaços.
 */
export function FaixaAtalhos({ avisos, naoLidos, euId, ...props }: PropsNavegacao) {
  const { papel, chatNaoLidas = 0, ordemInicio = [], tema } = props
  const caminho = usePathname()
  const atalhos = atalhosDoInicio(papel, chatNaoLidas)
  const [redesEm, setRedesEm] = useState<{ caminho: string; topo: number } | null>(null)
  const redesAberto = redesEm?.caminho === caminho ? redesEm : null
  const [gavetaEm, setGavetaEm] = useState<string | null>(null)
  const [forcaMais, setForcaMais] = useState<{ caminho: string; aberto: boolean } | null>(null)
  const emRedes = caminho === '/redes' || caminho.startsWith('/redes/')
  const dock = useRef<HTMLElement>(null)
  const ativoEm = (href: string) => estaEm(caminho, href) && !atalhos.some((a) => a.href !== href && a.href.startsWith(`${href}/`) && estaEm(caminho, a.href))
  const porId = new Map(atalhos.map((a) => [a.id, a]))
  const soltosTopo = NO_TOPO.map((id) => porId.get(id)).filter((a): a is Atalho => !!a)
  const agrupados = GRUPOS_FAIXA.flatMap((g) => g.itens).map((id) => porId.get(id)).filter((a): a is Atalho => !!a)
  const emEspacos = /^\/(espacos|listas|pastas)(\/|$)/.test(caminho)
  const emMais = agrupados.some((a) => ativoEm(a.href))
  const maisAberto = forcaMais?.caminho === caminho ? forcaMais.aberto : emMais
  useEffect(() => {
    if (!redesAberto) return
    const fecha = () => setRedesEm(null)
    const fora = (e: MouseEvent) => { if (!dock.current?.contains(e.target as Node)) fecha() }
    const esc = (e: globalThis.KeyboardEvent) => { if (e.key === 'Escape') fecha() }
    document.addEventListener('mousedown', fora)
    document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', fora); document.removeEventListener('keydown', esc) }
  }, [redesAberto])

  const item = ({ id, href, rotulo, contador, Icone }: Atalho) => {
    const ativo = ativoEm(href)
    return (
      <Link key={id} href={href} title={rotulo} aria-label={rotulo} draggable={false} aria-current={ativo ? 'page' : undefined} data-ativo={ativo || undefined} className="dock-item">
        <Icone className="dock-ico" />
        {!!contador && <span className="dock-ponto" aria-label={`${contador} não lidas`} />}
      </Link>
    )
  }
  const config = porId.get('config')
  const abrirEspacos = () => {
    if (window.matchMedia('(min-width: 1024px)').matches) window.dispatchEvent(new Event(EVENTO_ALTERNAR_BARRA))
    else setGavetaEm(caminho)
  }

  return (
    <>
      <DockCelular atalhos={atalhos} ativoEm={ativoEm} caminho={caminho} papel={papel} tema={tema} nome={props.nome} aoEspacos={() => setGavetaEm(caminho)} />
      <nav ref={dock} aria-label="Navegação" className="dock">
        {/* Bloco 1: logo */}
        <div className="dock-pill dock-fixo">
          <Link href="/home" title="Home" aria-label="Home" className="dock-item dock-logo"><Image src="/marca/simbolo.png" alt="" width={30} height={30} priority /></Link>
        </div>
        {/* Bloco 2: módulos */}
        <div className="dock-pill">
          <ListaOrdenavel className="dock-lista" cookie={COOKIE_ORDEM_INICIO} ordemInicial={ordemInicio} itens={soltosTopo.map((a) => ({ id: a.id, no: item(a) }))} />
          <button type="button" onClick={abrirEspacos} title="Espaços" aria-label="Espaços" data-ativo={emEspacos || undefined} className="dock-item"><LayoutGrid className="dock-ico" /></button>
          <button type="button" onClick={(e) => { setRedesEm(redesAberto ? null : { caminho, topo: e.currentTarget.getBoundingClientRect().top }) }} title="Redes sociais" aria-label="Redes sociais" aria-expanded={!!redesAberto} aria-haspopup="menu" data-ativo={emRedes || undefined} className="dock-item"><Share2 className="dock-ico" /></button>
          <button type="button" onClick={() => setForcaMais({ caminho, aberto: !maisAberto })} title={maisAberto ? 'Mostrar menos' : 'Mostrar mais módulos'} aria-label={maisAberto ? 'Mostrar menos' : 'Mostrar mais módulos'} aria-expanded={maisAberto} className="dock-sep dock-mais-btn"><ChevronDown className="dock-seta" style={{ transform: maisAberto ? 'rotate(180deg)' : undefined }} /></button>
          <div className="dock-mais" data-aberto={maisAberto}>
            <ListaOrdenavel className="dock-lista" cookie={COOKIE_ORDEM_INICIO} ordemInicial={ordemInicio} itens={agrupados.map((a) => ({ id: a.id, no: item(a) }))} />
          </div>
        </div>
        <div className="dock-folga" />
        {/* Bloco 3: avisos, perfil, convidar, tema e configurações */}
        <div className="dock-pill dock-fixo">
          <SinoAvisos avisos={avisos} naoLidos={naoLidos} euId={euId} variante="dock" />
          <MenuPerfil nome={props.nome} papel={papel} lado="right" className="dock-item" />
          {papel === 'admin' && <Link href="/config/usuarios" title="Convidar" aria-label="Convidar" className="dock-item"><UserPlus className="dock-ico" /></Link>}
          <AlternarTema inicial={tema} className="dock-item" />
          {config && item(config)}
        </div>
        {redesAberto && (
          <div role="menu" aria-label="Redes sociais" className="dock-pop" style={{ top: Math.max(56, Math.min(redesAberto.topo - 8, (typeof window === 'undefined' ? 700 : window.innerHeight) - 440)) }}>
            <p style={{ padding: '6px 8px 4px', fontSize: 11, fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase', color: 'var(--text-3)' }}>Redes sociais</p>
            <Link href="/redes" role="menuitem" className="menu-item" style={{ height: 34, display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px', borderRadius: 4, fontSize: 13, fontWeight: caminho === '/redes' ? 600 : 500, background: caminho === '/redes' ? 'var(--bg-active)' : 'transparent', color: 'var(--text)', textDecoration: 'none' }}><Ic n="grid_view" s={20} style={{ color: 'var(--text-2)' }} />Visão geral</Link>
            <div style={{ height: 1, background: 'var(--border-soft)', margin: '4px 6px' }} />
            {REDES.map((r) => {
              const on = caminho === `/redes/${r.slug}`
              return (
                <Link key={r.slug} href={`/redes/${r.slug}`} role="menuitem" aria-current={on ? 'page' : undefined} className="menu-item" style={{ height: 34, display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px', borderRadius: 4, fontSize: 13, fontWeight: on ? 600 : 400, background: on ? 'var(--bg-active)' : 'transparent', color: 'var(--text)', textDecoration: 'none' }}>
                  <LogoRede slug={r.slug} tamanho={20} />
                  <span style={{ flex: 1 }}>{r.nome}</span>
                  {!r.conectada && <span style={{ fontSize: 10, color: 'var(--text-3)' }}>em breve</span>}
                </Link>
              )
            })}
          </div>
        )}
        <Sheet open={gavetaEm === caminho} onOpenChange={(aberta) => setGavetaEm(aberta ? caminho : null)}>
          <SheetContent side="left" className="w-[320px] max-w-[88vw] border-r border-lat-borda bg-lat-bg p-0 text-lat-fg">
            <SheetTitle className="sr-only">Espaços</SheetTitle>
            <PainelEspacos {...props} papel={papel} chatNaoLidas={chatNaoLidas} ordemInicio={ordemInicio} tema={tema} />
          </SheetContent>
        </Sheet>
      </nav>
    </>
  )
}

const NA_BARRA_CEL = ['home', 'tarefas', 'chat']

/** Barra de baixo do celular: Home, Tarefas, botão central da Emma (IA), Chat e Mais (todos os módulos, redes, espaços, tema e perfil). */
function DockCelular({ atalhos, ativoEm, caminho, papel, tema, nome, aoEspacos }: { atalhos: Atalho[]; ativoEm: (href: string) => boolean; caminho: string; papel: string; tema: ModoTema; nome: string; aoEspacos: () => void }) {
  const [maisEm, setMaisEm] = useState<string | null>(null)
  const porId = new Map(atalhos.map((a) => [a.id, a]))
  const fixos = NA_BARRA_CEL.map((id) => porId.get(id)).filter((a): a is Atalho => !!a)
  const comIA = papelPodeUsarIA(papel)
  const botao = ({ id, href, curto, contador, Icone }: Atalho) => {
    const ativo = ativoEm(href)
    return (
      <Link key={id} href={href} aria-current={ativo ? 'page' : undefined} data-ativo={ativo || undefined} className="dock-cel-item">
        <span className="dock-cel-ico"><Icone className="dock-ico" />{!!contador && <span className="dock-ponto" aria-label={`${contador} não lidas`} />}</span>
        {curto}
      </Link>
    )
  }
  const [home, tarefas, chat] = fixos
  return (
    <nav aria-label="Navegação" className="dock-cel">
      {home && botao(home)}
      {tarefas && botao(tarefas)}
      {comIA && <button type="button" onClick={() => window.dispatchEvent(new Event(EVENTO_ABRIR_IA))} aria-label="Abrir a Emma, assistente" title="Emma, a assistente" className="dock-cel-centro"><Sparkles size={26} strokeWidth={1.6} /></button>}
      {chat && botao(chat)}
      <button type="button" onClick={() => setMaisEm(caminho)} aria-label="Mais" className="dock-cel-item" aria-haspopup="dialog">
        <span className="dock-cel-ico"><Menu className="dock-ico" /></span>Mais
      </button>
      <Sheet open={maisEm === caminho} onOpenChange={(aberta) => setMaisEm(aberta ? caminho : null)}>
        <SheetContent side="bottom" className="max-h-[80dvh] overflow-y-auto rounded-t-3xl border-t border-lat-borda bg-lat-bg p-4 pb-8 text-lat-fg">
          <SheetTitle className="mb-3 text-base font-semibold">Todos os módulos</SheetTitle>
          <div className="dock-cel-grade">
            {atalhos.map(({ id, href, rotulo, Icone }) => (
              <Link key={id} href={href} data-ativo={ativoEm(href) || undefined}><Icone className="dock-ico" />{rotulo}</Link>
            ))}
            <Link href="/redes" data-ativo={caminho.startsWith('/redes') || undefined}><Share2 className="dock-ico" />Redes sociais</Link>
            <button type="button" onClick={aoEspacos}><LayoutGrid className="dock-ico" />Espaços</button>
            <AlternarTema inicial={tema} comRotulo />
          </div>
          <div className="mt-4 flex items-center"><MenuPerfil nome={nome} papel={papel} lado="top" comNome className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5 outline-none transition-colors hover:bg-lat-hover" /></div>
        </SheetContent>
      </Sheet>
    </nav>
  )
}
