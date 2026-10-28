'use client'

import { CalendarDays, ChevronDown, FileText, ListChecks, LogOut, Menu, Mic, Plus, Search, Settings, UsersRound } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useState } from 'react'
import { sair } from '@/app/(auth)/login/acoes'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/componentes/ui/dropdown-menu'
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
    <header className="sticky top-0 z-30 flex h-10 shrink-0 items-center gap-2 bg-[var(--bg-frame)] px-2 md:px-3">
      <Sheet>
        <SheetTrigger aria-label="Abrir menu" className="rounded-md p-1.5 hover:bg-hover md:hidden">
          <Menu className="h-5 w-5" aria-hidden="true" />
        </SheetTrigger>
        <SheetContent side="left" className="w-[300px] border-r border-lat-borda bg-lat-bg p-0 text-lat-fg">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <PainelEspacos {...painel} comAtalhos />
        </SheetContent>
      </Sheet>

      <DropdownMenu>
        <DropdownMenuTrigger aria-label="Espaço de trabalho Grupo SRV" className="flex h-7 shrink-0 items-center gap-1.5 rounded-md px-1.5 text-corpo font-semibold text-texto hover:bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca">
          <span className="flex h-5 w-5 items-center justify-center rounded bg-[#d80d12] text-[11px] font-extrabold text-white">S</span>
          <span className="hidden sm:inline">Grupo SRV</span>
          <ChevronDown className="h-3.5 w-3.5 text-texto-3" aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Grupo SRV</DropdownMenuLabel>
          <DropdownMenuItem asChild><Link href="/home">Ir para a Home</Link></DropdownMenuItem>
          {painel.papel === 'admin' && <DropdownMenuItem asChild><Link href="/config"><Settings className="h-4 w-4" /> Configurações</Link></DropdownMenuItem>}
          {painel.papel === 'admin' && <DropdownMenuItem asChild><Link href="/config/usuarios"><UsersRound className="h-4 w-4" /> Gerenciar membros</Link></DropdownMenuItem>}
          <DropdownMenuSeparator />
          <form action={sair}><button className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-corpo text-texto-2 outline-none hover:bg-hover hover:text-texto focus-visible:bg-hover"><LogOut className="h-4 w-4" aria-hidden="true" /> Sair</button></form>
        </DropdownMenuContent>
      </DropdownMenu>
      <Link href="/agenda" aria-label="Agenda" title="Agenda (A)" className={`${botaoIcone} hidden sm:flex`}><CalendarDays className="h-4 w-4" /></Link>

      <button
        type="button"
        onClick={abrirPaleta}
        aria-label="Pesquisar (⌘K)"
        className="controle mx-auto hidden h-7 w-full max-w-[360px] items-center gap-1 rounded-full border border-borda bg-white px-2.5 text-corpo font-normal text-texto-3 transition-colors hover:bg-hover sm:flex"
      >
        <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="flex-1 text-left">Buscar tarefas, clientes, documentos…</span>
        <kbd className="rounded border border-borda px-1 text-legenda font-medium text-texto-3">⌘K</kbd>
      </button>

      <div className="ml-auto flex items-center gap-0.5 sm:ml-0">
        <button type="button" onClick={abrirPaleta} aria-label="Pesquisar" className={`${botaoIcone} sm:hidden`}><Search className="h-4 w-4" /></button>
        <DropdownMenu>
          <DropdownMenuTrigger aria-label="Criar" title="Criar" className="flex h-7 items-center gap-1 rounded-md bg-petroleo pl-1.5 pr-2.5 text-corpo font-semibold text-claro transition-colors hover:bg-petroleo-700"><Plus className="h-4 w-4" /><span className="hidden sm:inline">Criar</span></DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>Criar</DropdownMenuLabel>
            <DropdownMenuItem asChild><Link href="/inicio">Tarefa (em Minhas tarefas)</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link href="/documentos">Documento</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link href="/quadros">Quadro</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link href="/agendamentos">Post agendado</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link href="/reunioes">Reunião</Link></DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Link href="/inicio" aria-label="Minhas tarefas" title="Minhas tarefas (I)" className={botaoIcone}><ListChecks className="h-4 w-4" /></Link>
        <Link href="/reunioes" aria-label="Reuniões" title="Reuniões" className={botaoIcone}><Mic className="h-4 w-4" /></Link>
        <Link href="/documentos" aria-label="Documentos" title="Documentos (D)" className={botaoIcone}><FileText className="h-4 w-4" /></Link>
        <SinoAvisos avisos={avisos} naoLidos={naoLidos} euId={euId} />
        <MenuPerfil nome={painel.nome} papel={painel.papel} className="ml-1 flex items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-marca" />
      </div>

      <AtalhosGlobais aoAbrirPaleta={abrirPaleta} aoAbrirAjuda={abrirAjuda} />
      <PaletaComandos aberta={paleta} aoMudar={setPaleta} navegacao={painel.navegacao} papel={painel.papel} chatNaoLidas={painel.chatNaoLidas ?? 0} aoAbrirAjuda={abrirAjuda} />
      <AtalhosDialog aberto={ajuda} aoMudar={setAjuda} />
    </header>
  )
}
