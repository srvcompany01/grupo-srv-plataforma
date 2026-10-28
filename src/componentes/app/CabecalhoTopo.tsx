'use client'

import { CalendarDays, ListChecks, Menu, Search } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useState } from 'react'
import { LogoGrupo } from '@/componentes/Marca'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/componentes/ui/sheet'
import type { Aviso } from '@/servicos/avisos'
import { AtalhosDialog } from './AtalhosDialog'
import { MenuPerfil } from './MenuPerfil'
import { AtalhosGlobais } from './AtalhosGlobais'
import { PainelEspacos, type PropsPainel } from './BarraLateral'
import { PaletaComandos } from './PaletaComandos'
import { SinoAvisos } from './SinoAvisos'

type Props = { painel: PropsPainel; avisos: Aviso[]; naoLidos: number; euId: string }

const botaoIcone = 'flex h-6 w-6 items-center justify-center rounded-md text-texto-3 transition-colors hover:bg-ink/10 hover:text-texto'

/**
 * Barra do topo, fixa, de 40px: logo da empresa, busca central que abre a paleta ⌘K, atalhos (Minhas tarefas, Agenda) e avisos.
 * Configurações, tema e perfil ficam no pé da faixa de ícones. No celular abre o menu lateral.
 */
export function CabecalhoTopo({ painel, avisos, naoLidos, euId }: Props) {
  const [paleta, setPaleta] = useState(false)
  const [ajuda, setAjuda] = useState(false)
  const abrirPaleta = useCallback(() => setPaleta(true), [])
  const abrirAjuda = useCallback(() => setAjuda(true), [])

  return (
    <header className="sticky top-0 z-30 flex h-10 shrink-0 items-center gap-2 border-b border-borda bg-white px-2 md:px-3">
      <Sheet>
        <SheetTrigger aria-label="Abrir menu" className="rounded-md p-1.5 hover:bg-hover md:hidden">
          <Menu className="h-5 w-5" aria-hidden="true" />
        </SheetTrigger>
        <SheetContent side="left" className="w-[300px] border-r border-lat-borda bg-lat-bg p-0 text-lat-fg">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <PainelEspacos {...painel} comAtalhos />
        </SheetContent>
      </Sheet>

      <Link href="/home" aria-label="Grupo SRV, ir para a Home" className="flex h-7 shrink-0 items-center rounded-md bg-ink/5 px-2 hover:bg-ink/10">
        <LogoGrupo altura="h-4" />
      </Link>

      <button
        type="button"
        onClick={abrirPaleta}
        aria-label="Pesquisar (⌘K)"
        className="controle mx-auto hidden h-7 w-full max-w-[360px] items-center gap-1 rounded-full border border-borda bg-white px-2 text-destaque font-medium text-texto-3 transition-colors hover:bg-hover sm:flex"
      >
        <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="flex-1 text-left">Pesquisar</span>
        <kbd className="text-rotulo font-medium text-texto-3/80">⌘ K</kbd>
      </button>

      <div className="ml-auto flex items-center gap-0.5 sm:ml-0">
        <button type="button" onClick={abrirPaleta} aria-label="Pesquisar" className={`${botaoIcone} sm:hidden`}><Search className="h-4 w-4" /></button>
        <Link href="/inicio" aria-label="Minhas tarefas" title="Minhas tarefas (I)" className={botaoIcone}><ListChecks className="h-4 w-4" /></Link>
        <Link href="/agenda" aria-label="Agenda" title="Agenda (A)" className={botaoIcone}><CalendarDays className="h-4 w-4" /></Link>
        <SinoAvisos avisos={avisos} naoLidos={naoLidos} euId={euId} />
        <MenuPerfil nome={painel.nome} papel={painel.papel} className="ml-1 flex items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-marca" />
      </div>

      <AtalhosGlobais aoAbrirPaleta={abrirPaleta} aoAbrirAjuda={abrirAjuda} />
      <PaletaComandos aberta={paleta} aoMudar={setPaleta} navegacao={painel.navegacao} papel={painel.papel} chatNaoLidas={painel.chatNaoLidas ?? 0} aoAbrirAjuda={abrirAjuda} />
      <AtalhosDialog aberto={ajuda} aoMudar={setAjuda} />
    </header>
  )
}
