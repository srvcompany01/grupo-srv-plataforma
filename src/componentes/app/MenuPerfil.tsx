'use client'

import { Keyboard, LogOut } from 'lucide-react'
import { sair } from '@/app/(auth)/login/acoes'
import { Avatar } from '@/componentes/Avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/componentes/ui/dropdown-menu'
import { EVENTO_ABRIR_ATALHOS } from './AtalhosGlobais'

/** Perfil de quem está logado: avatar (e nome, quando cabe) que abre o menu com o cargo e o botão Sair. */
export function MenuPerfil({ nome, papel, lado = 'right', comNome = false, className = '' }: { nome: string; papel: string; lado?: 'right' | 'top'; comNome?: boolean; className?: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label={`Conta de ${nome}`} className={className}>
        <Avatar nome={nome || '?'} tamanho="h-7 w-7 text-legenda" />
        {comNome && (
          <span className="min-w-0 flex-1 text-left">
            <span className="block truncate text-rotulo font-semibold text-lat-fg">{nome}</span>
            <span className="block truncate text-legenda capitalize text-lat-3">{papel}</span>
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent side={lado} align="end" className="w-56">
        <DropdownMenuLabel className="space-y-0.5">
          <p className="truncate text-corpo font-semibold text-texto">{nome}</p>
          <p className="truncate text-legenda font-normal capitalize text-texto-3">{papel}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => window.dispatchEvent(new Event(EVENTO_ABRIR_ATALHOS))}><Keyboard className="h-4 w-4" aria-hidden="true" /> Atalhos de teclado</DropdownMenuItem>
        <form action={sair}>
          <button className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-corpo text-texto-2 outline-none transition hover:bg-hover hover:text-texto focus-visible:bg-hover">
            <LogOut className="h-4 w-4" aria-hidden="true" /> Sair
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
