'use client'

import { Ellipsis, LayoutGrid, Menu, Share2, Sparkles, UserPlus } from 'lucide-react'
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
  const [pop, setPop] = useState<{ caminho: string; topo: number; tipo: 'redes' | 'mais' } | null>(null)
  const popAberto = pop?.caminho === caminho ? pop : null
  const [gavetaEm, setGavetaEm] = useState<string | null>(null)
  const emRedes = caminho === '/redes' || caminho.startsWith('/redes/')
  const dock = useRef<HTMLElement>(null)
  const ativoEm = (href: string) => estaEm(caminho, href) && !atalhos.some((a) => a.href !== href && a.href.startsWith(`${href}/`) && estaEm(caminho, a.href))
  const porId = new Map(atalhos.map((a) => [a.id, a]))
  porId.set('espacos', { id: 'espacos', href: '#espacos', rotulo: 'Espaços', curto: 'Espaços', Icone: LayoutGrid })
  const soltosTopo = NO_TOPO.map((id) => porId.get(id)).filter((a): a is Atalho => !!a)
  const agrupados = GRUPOS_FAIXA.flatMap((g) => g.itens).map((id) => porId.get(id)).filter((a): a is Atalho => !!a)
  const emEspacos = /^\/(espacos|listas|pastas)(\/|$)/.test(caminho)
  const emMais = agrupados.some((a) => ativoEm(a.href))
  useEffect(() => {
    if (!popAberto) return
    const fecha = () => setPop(null)
    const fora = (e: MouseEvent) => { if (!dock.current?.contains(e.target as Node)) fecha() }
    const esc = (e: globalThis.KeyboardEvent) => { if (e.key === 'Escape') fecha() }
    document.addEventListener('mousedown', fora)
    document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', fora); document.removeEventListener('keydown', esc) }
  }, [popAberto])
  // A faixa rola sozinha até o módulo ativo quando a tela muda.
  useEffect(() => {
    dock.current?.querySelector('.cs-faixa-modulos [aria-current="page"], .cs-faixa-modulos [data-ativo]')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [caminho])
  const abrirPop = (tipo: 'redes' | 'mais') => (e: React.MouseEvent<HTMLButtonElement>) => setPop(popAberto?.tipo === tipo ? null : { caminho, topo: e.currentTarget.getBoundingClientRect().top, tipo })

  const item = ({ id, href, rotulo, contador, Icone }: Atalho) => {
    if (id === 'espacos') return <button key={id} type="button" onClick={abrirEspacos} title={rotulo} aria-label={rotulo} data-ativo={emEspacos || undefined}><Icone /></button>
    const ativo = ativoEm(href)
    return (
      <Link key={id} href={href} title={rotulo} aria-label={rotulo} draggable={false} aria-current={ativo ? 'page' : undefined} data-ativo={ativo || undefined}>
        <Icone />
        {!!contador && <span aria-label={`${contador} não lidas`} />}
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
      <DockCelular atalhos={atalhos} ativoEm={ativoEm} caminho={caminho} papel={papel} tema={tema} nome={props.nome} avisos={avisos} naoLidos={naoLidos} euId={euId} aoEspacos={() => setGavetaEm(caminho)} />
      <nav ref={dock} aria-label="Navegação" className="dock cs-faixa">
        {/* Módulos (reordenáveis); "Mais" abre os demais. Rola sozinho até o item ativo. */}
        <div className="cs-faixa-modulos">
          <ListaOrdenavel cookie={COOKIE_ORDEM_INICIO} ordemInicial={ordemInicio} itens={soltosTopo.map((a) => ({ id: a.id, no: item(a) }))} />
          <button type="button" onClick={abrirPop('redes')} title="Redes sociais" aria-label="Redes sociais" aria-expanded={popAberto?.tipo === 'redes'} aria-haspopup="menu" data-ativo={emRedes || undefined}><Share2 /></button>
          <button type="button" onClick={abrirPop('mais')} title="Mais módulos" aria-label="Mais módulos" aria-expanded={popAberto?.tipo === 'mais'} aria-haspopup="menu" data-ativo={emMais || undefined}><Ellipsis /></button>
        </div>
        {/* Pé fixo: avisos, convidar, tema e configurações (o perfil fica no topo). */}
        <div className="cs-faixa-pe">
          <SinoAvisos avisos={avisos} naoLidos={naoLidos} euId={euId} variante="dock" />
          {papel === 'admin' && <Link href="/config/usuarios" title="Convidar" aria-label="Convidar"><UserPlus /></Link>}
          <AlternarTema inicial={tema} />
          {config && item(config)}
        </div>
        {popAberto?.tipo === 'redes' && (
          <div role="menu" aria-label="Redes sociais" className="cs-pop" style={{ top: Math.max(56, Math.min(popAberto.topo - 8, (typeof window === 'undefined' ? 700 : window.innerHeight) - 440)) }}>
            <p style={{ padding: '6px 8px 4px', fontSize: 11, fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase', color: 'var(--text-3)' }}>Redes sociais</p>
            <Link href="/redes" role="menuitem" style={{ height: 34, display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px', borderRadius: 4, fontSize: 13, fontWeight: caminho === '/redes' ? 600 : 500, background: caminho === '/redes' ? 'var(--bg-active)' : 'transparent', color: 'var(--text)', textDecoration: 'none' }}><Ic n="grid_view" s={20} style={{ color: 'var(--text-2)' }} />Visão geral</Link>
            <div style={{ height: 1, background: 'var(--border-soft)', margin: '4px 6px' }} />
            {REDES.map((r) => {
              const on = caminho === `/redes/${r.slug}`
              return (
                <Link key={r.slug} href={`/redes/${r.slug}`} role="menuitem" aria-current={on ? 'page' : undefined} style={{ height: 34, display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px', borderRadius: 4, fontSize: 13, fontWeight: on ? 600 : 400, background: on ? 'var(--bg-active)' : 'transparent', color: 'var(--text)', textDecoration: 'none' }}>
                  <LogoRede slug={r.slug} tamanho={20} />
                  <span style={{ flex: 1 }}>{r.nome}</span>
                  {!r.conectada && <span style={{ fontSize: 10, color: 'var(--text-3)' }}>em breve</span>}
                </Link>
              )
            })}
          </div>
        )}
        {popAberto?.tipo === 'mais' && (
          <div role="menu" aria-label="Mais módulos" className="cs-pop" style={{ width: 320, bottom: 16, top: 'auto' }}>
            <p style={{ padding: '6px 8px 4px', fontSize: 11, fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase', color: 'var(--text-3)' }}>Módulos</p>
            <ListaOrdenavel
              cookie={COOKIE_ORDEM_INICIO}
              ordemInicial={ordemInicio}
              itens={agrupados.map(({ id, href, rotulo, Icone }) => ({
                id,
                no: (
                  <Link href={href} draggable={false} role="menuitem" aria-current={ativoEm(href) ? 'page' : undefined} style={{ height: 32, display: 'flex', alignItems: 'center', gap: 8, padding: '0 8px', borderRadius: 8, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', background: ativoEm(href) ? 'var(--bg-active)' : 'transparent', fontWeight: ativoEm(href) ? 600 : 400, color: 'var(--text)', textDecoration: 'none' }}>
                    <Icone />{rotulo}
                  </Link>
                ),
              }))}
            />
            <p style={{ padding: '8px 8px 2px', fontSize: 11, color: 'var(--text-3)' }}>Arraste os ícones da faixa para reordenar os atalhos.</p>
          </div>
        )}
        <Sheet open={gavetaEm === caminho} onOpenChange={(aberta) => setGavetaEm(aberta ? caminho : null)}>
          <SheetContent side="left">
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
function DockCelular({ atalhos, ativoEm, caminho, papel, tema, nome, avisos, naoLidos, euId, aoEspacos }: { avisos: Aviso[]; naoLidos: number; euId: string; atalhos: Atalho[]; ativoEm: (href: string) => boolean; caminho: string; papel: string; tema: ModoTema; nome: string; aoEspacos: () => void }) {
  const [maisEm, setMaisEm] = useState<string | null>(null)
  const porId = new Map(atalhos.map((a) => [a.id, a]))
  const fixos = NA_BARRA_CEL.map((id) => porId.get(id)).filter((a): a is Atalho => !!a)
  const comIA = papelPodeUsarIA(papel)
  const botao = ({ id, href, curto, contador, Icone }: Atalho) => {
    const ativo = ativoEm(href)
    return (
      <Link key={id} href={href} aria-current={ativo ? 'page' : undefined} data-ativo={ativo || undefined}>
        <span><Icone />{!!contador && <span aria-label={`${contador} não lidas`} />}</span>
        {curto}
      </Link>
    )
  }
  const [home, tarefas, chat] = fixos
  return (
    <nav aria-label="Navegação" className="cs-dock-cel">
      {home && botao(home)}
      {tarefas && botao(tarefas)}
      {comIA && <button type="button" onClick={() => window.dispatchEvent(new Event(EVENTO_ABRIR_IA))} aria-label="Abrir a Emma, assistente" title="Emma, a assistente"><Sparkles size={26} strokeWidth={1.6} /></button>}
      {chat && botao(chat)}
      <button type="button" onClick={() => setMaisEm(caminho)} aria-label="Mais" aria-haspopup="dialog">
        <span><Menu /></span>Mais
      </button>
      <Sheet open={maisEm === caminho} onOpenChange={(aberta) => setMaisEm(aberta ? caminho : null)}>
        <SheetContent side="bottom">
          <SheetTitle>Todos os módulos</SheetTitle>
          <div className="cs-cel-grade">
            {atalhos.map(({ id, href, rotulo, Icone }) => (
              <Link key={id} href={href} data-ativo={ativoEm(href) || undefined}><Icone />{rotulo}</Link>
            ))}
            <Link href="/redes" data-ativo={caminho.startsWith('/redes') || undefined}><Share2 />Redes sociais</Link>
            <button type="button" onClick={aoEspacos}><LayoutGrid />Espaços</button>
            <AlternarTema inicial={tema} comRotulo />
          </div>
          <div className="cs-cel-pe"><SinoAvisos avisos={avisos} naoLidos={naoLidos} euId={euId} ouvir={false} /><MenuPerfil nome={nome} papel={papel} lado="top" comNome /></div>
        </SheetContent>
      </Sheet>
    </nav>
  )
}
