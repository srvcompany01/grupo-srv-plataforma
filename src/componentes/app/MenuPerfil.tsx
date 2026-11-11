'use client'

import { Keyboard, LogOut } from 'lucide-react'
import { sair } from '@/app/(auth)/login/acoes'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/componentes/ui/dropdown-menu'
import { EVENTO_ABRIR_ATALHOS } from './AtalhosGlobais'

/** Perfil de quem está logado: avatar (e nome, quando cabe) que abre o menu com o cargo e o botão Sair. */
export function MenuPerfil({ nome, papel, lado = 'right', comNome = false, className = '', estilo }: { nome: string; papel: string; lado?: 'right' | 'top'; comNome?: boolean; className?: string; estilo?: React.CSSProperties }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label={`Conta de ${nome}`} style={estilo}>
        <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#d80d12', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{(nome || '?').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}</span>
        {comNome && (
          <span>
            <span>{nome}</span>
            <span>{papel}</span>
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent side={lado} align="end">
        <DropdownMenuLabel>
          <p>{nome}</p>
          <p>{papel}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => window.dispatchEvent(new Event(EVENTO_ABRIR_ATALHOS))}><Keyboard aria-hidden="true" /> Atalhos de teclado</DropdownMenuItem>
        <form action={sair}>
          <button>
            <LogOut aria-hidden="true" /> Sair
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
