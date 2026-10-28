'use client'

import { Menu, Search } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { LogoGrupo } from '@/componentes/Marca'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/componentes/ui/sheet'
import type { Aviso } from '@/servicos/avisos'
import { PainelEspacos, type PropsPainel } from './BarraLateral'
import { SinoAvisos } from './SinoAvisos'

type Props = { painel: PropsPainel; avisos: Aviso[]; naoLidos: number; euId: string }

/** Barra do topo, fixa: nome da empresa, pesquisa global de tarefas e avisos (configurações e perfil ficam no rodapé da barra lateral). No celular abre o menu lateral. */
export function CabecalhoTopo({ painel, avisos, naoLidos, euId }: Props) {
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
          <PainelEspacos {...painel} comAtalhos />
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
      </div>
    </header>
  )
}
