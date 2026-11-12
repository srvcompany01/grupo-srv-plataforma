'use client'

import Link from 'next/link'
import { useCallback, useState } from 'react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/componentes/ui/dropdown-menu'
import { papelPodeUsarIA } from '@/ia/acesso'
import { AtalhosDialog } from './AtalhosDialog'
import { AtalhosGlobais } from './AtalhosGlobais'
import { Ic } from './Ic'
import type { PropsPainel } from './BarraLateral'
import { MenuPerfil } from './MenuPerfil'
import { EVENTO_ABRIR_IA } from './PainelIA'
import { PaletaComandos } from './PaletaComandos'

type Props = { painel: PropsPainel }

/** Atalhos à direita do topo (só os que levam a uma tela que existe). */
const ATALHOS = [
  { href: '/inicio', rotulo: 'Nova tarefa', icone: 'add_task' },
  { href: '/clientes', rotulo: 'Clientes', icone: 'work' },
  { href: '/reunioes', rotulo: 'Reuniões', icone: 'videocam' },
  { href: '/documentos', rotulo: 'Documentos', icone: 'description' },
]

/**
 * Topo de 40px: empresa à esquerda, busca ⌘K no centro, Emma + atalhos + perfil à direita.
 * No celular fica só a busca (a navegação vai para a barra de baixo).
 */
export function CabecalhoTopo({ painel }: Props) {
  const [paleta, setPaleta] = useState(false)
  const [ajuda, setAjuda] = useState(false)
  const abrirPaleta = useCallback(() => setPaleta(true), [])
  const abrirAjuda = useCallback(() => setAjuda(true), [])

  return (
    <header className="cs-topo">
      <DropdownMenu>
        <DropdownMenuTrigger className="cs-empresa" title="Grupo SRV">
          <span className="cs-empresa-s" aria-hidden="true">S</span>
          <span className="cs-empresa-nome">Grupo SRV</span>
          <Ic n="expand_more" s={16} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>Grupo SRV</DropdownMenuLabel>
          <DropdownMenuItem asChild><Link href="/home"><Ic n="home" s={16} /> Home</Link></DropdownMenuItem>
          <DropdownMenuItem asChild><Link href="/config"><Ic n="settings" s={16} /> Configurações</Link></DropdownMenuItem>
          {painel.papel === 'admin' && <DropdownMenuItem asChild><Link href="/config/usuarios"><Ic n="group" s={16} /> Gerenciar membros</Link></DropdownMenuItem>}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={abrirAjuda}><Ic n="keyboard" s={16} /> Atalhos de teclado</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <button type="button" onClick={abrirPaleta} aria-label="Buscar (⌘K)" className="cs-busca">
        <Ic n="search" s={16} />
        <span>Buscar tarefas, clientes, documentos…</span>
        <kbd>⌘K</kbd>
      </button>

      <div className="cs-topo-dir">
        {papelPodeUsarIA(painel.papel) && (
          <button type="button" className="cs-emma" onClick={() => window.dispatchEvent(new Event(EVENTO_ABRIR_IA))} title="Falar com a Emma">
            <span className="cs-emma-av" aria-hidden="true"><Ic n="auto_awesome" s={13} fill /></span>
            <span className="cs-emma-nome">Emma</span>
          </button>
        )}
        <button type="button" className="cs-ico cs-so-cel" onClick={abrirPaleta} aria-label="Buscar"><Ic n="search" s={19} /></button>
        {ATALHOS.map((a) => (
          <Link key={a.href} href={a.href} className="cs-ico cs-so-desk" title={a.rotulo} aria-label={a.rotulo}><Ic n={a.icone} s={20} w={300} /></Link>
        ))}
        <span className="cs-perfil cs-so-desk"><MenuPerfil nome={painel.nome} papel={painel.papel} lado="right" /></span>
      </div>

      <AtalhosGlobais aoAbrirPaleta={abrirPaleta} aoAbrirAjuda={abrirAjuda} />
      <PaletaComandos aberta={paleta} aoMudar={setPaleta} navegacao={painel.navegacao} papel={painel.papel} chatNaoLidas={painel.chatNaoLidas ?? 0} aoAbrirAjuda={abrirAjuda} />
      <AtalhosDialog aberto={ajuda} aoMudar={setAjuda} />
    </header>
  )
}
