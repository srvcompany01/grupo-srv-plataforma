'use client'

import { LogOut, Menu, Search, Settings } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { sair } from '@/app/(auth)/login/acoes'
import { Avatar } from '@/componentes/Avatar'
import { LogoGrupo } from '@/componentes/Marca'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/componentes/ui/sheet'
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/componentes/ui/dropdown-menu'
import type { Aviso } from '@/servicos/avisos'
import { PainelEspacos, type PropsPainel } from './BarraLateral'
import { SinoAvisos } from './SinoAvisos'

type Props = { painel: PropsPainel; avisos: Aviso[]; naoLidos: number; euId: string; nome: string; papel: string }

/** Barra do topo, fixa: nome da empresa, pesquisa global de tarefas, avisos, configurações e menu do usuário. No celular abre o menu lateral. */
export function CabecalhoTopo({ painel, avisos, naoLidos, euId, nome, papel }: Props) {
  const busca = useRef<HTMLInputElement>(null)

  // Ctrl/⌘ + K foca a pesquisa.
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        busca.current?.focus()
        busca.current?.select()
      }
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [])

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-borda bg-white px-3 md:px-5">
      <Sheet>
        <SheetTrigger aria-label="Abrir menu" className="rounded-lg p-2 hover:bg-hover md:hidden">
          <Menu className="h-5 w-5" aria-hidden="true" />
        </SheetTrigger>
        <SheetContent side="left" className="w-[300px] border-r border-lat-borda bg-lat-bg p-0 text-lat-fg">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <PainelEspacos {...painel} />
        </SheetContent>
      </Sheet>

      <Link href="/inicio" aria-label="Grupo SRV, ir para o início" className="flex shrink-0 items-center">
        <LogoGrupo altura="h-4" />
      </Link>

      <form action="/painel-de-gestao" method="get" role="search" className="relative mx-auto hidden w-full max-w-md sm:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-texto-3" aria-hidden="true" />
        <input
          ref={busca}
          name="busca"
          type="search"
          autoComplete="off"
          aria-label="Pesquisar tarefas"
          placeholder="Pesquisar tarefas…"
          className="h-9 w-full rounded-lg border border-borda bg-fundo pl-9 pr-12 text-corpo outline-none transition placeholder:text-texto-3 hover:border-borda-forte focus:border-petroleo focus:bg-white focus:ring-3 focus:ring-petroleo/15"
        />
        <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 controle rounded border border-borda bg-white px-1.5 text-legenda text-texto-3">⌘ K</kbd>
      </form>

      <div className="ml-auto flex items-center gap-1 sm:ml-0">
        <SinoAvisos avisos={avisos} naoLidos={naoLidos} euId={euId} />
        {papel === 'admin' && (
          <Link href="/config" aria-label="Configurações" title="Configurações" className="hidden rounded-lg p-2 text-texto-2 transition hover:bg-hover hover:text-texto md:inline-flex">
            <Settings className="h-[18px] w-[18px]" aria-hidden="true" />
          </Link>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger aria-label={`Conta de ${nome}`} className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-petroleo/40">
            <Avatar nome={nome || '?'} tamanho="h-8 w-8 text-rotulo" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="space-y-0.5">
              <p className="truncate text-corpo font-semibold text-texto">{nome}</p>
              <p className="truncate text-legenda font-normal capitalize text-texto-3">{papel}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <form action={sair}>
              <button className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-corpo text-texto-2 outline-none transition hover:bg-hover hover:text-texto focus-visible:bg-hover">
                <LogOut className="h-4 w-4" aria-hidden="true" /> Sair
              </button>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
