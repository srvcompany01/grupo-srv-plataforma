'use client'

import Link from 'next/link'
import { useCallback, useState } from 'react'
import { sair } from '@/app/(auth)/login/acoes'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/componentes/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/componentes/ui/sheet'
import type { Aviso } from '@/servicos/avisos'
import type { AlertaSistema } from '@/servicos/alertas-sistema'
import { AlertasSistema } from './AlertasSistema'
import { AtalhosDialog } from './AtalhosDialog'
import { MenuPerfil } from './MenuPerfil'
import { AtalhosGlobais } from './AtalhosGlobais'
import { Ic } from './Ic'
import { PainelEspacos, type PropsPainel } from './BarraLateral'
import { EVENTO_ABRIR_IA } from './PainelIA'
import { papelPodeUsarIA } from '@/ia/acesso'
import { PaletaComandos } from './PaletaComandos'
import { SinoAvisos } from './SinoAvisos'

type Props = { painel: PropsPainel; avisos: Aviso[]; naoLidos: number; euId: string; alertas: AlertaSistema[] }


/**
 * Barra do topo, fixa, de 40px: logo da empresa, busca central que abre a paleta ⌘K, atalhos (Minhas tarefas, Agenda) e avisos.
 * Configurações, tema e perfil ficam no pé da faixa de ícones. No celular abre o menu lateral.
 */
export function CabecalhoTopo({ painel, avisos, naoLidos, euId, alertas }: Props) {
  const [paleta, setPaleta] = useState(false)
  const [ajuda, setAjuda] = useState(false)
  const abrirPaleta = useCallback(() => setPaleta(true), [])
  const abrirAjuda = useCallback(() => setAjuda(true), [])

  const tb = { width: 28, height: 28, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 0, background: 'transparent', borderRadius: 6, color: 'var(--text-2)', cursor: 'pointer' } as const
  return (
    <header className="sticky top-0 z-30" style={{ height: 40, display: 'flex', alignItems: 'center', gap: 8, padding: '0 8px', background: 'var(--bg-frame)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, flex: '1 1 0', minWidth: 0 }}>
        <Sheet>
          <SheetTrigger aria-label="Abrir menu" className="md:hidden" style={{ ...tb, width: 36, height: 36, color: 'var(--text)' }}><Ic n="menu" s={20} /></SheetTrigger>
          <SheetContent side="left" className="w-[300px] border-r border-lat-borda bg-lat-bg p-0 text-lat-fg">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <PainelEspacos {...painel} comAtalhos />
          </SheetContent>
        </Sheet>
        <DropdownMenu>
          <DropdownMenuTrigger aria-label="Espaço de trabalho Grupo SRV" className="empresa-pill" style={{ height: 32, display: 'flex', alignItems: 'center', gap: 12, padding: '0 10px 0 6px', borderRadius: 8, cursor: 'pointer', minWidth: 0 }}>
            <span style={{ width: 20, height: 20, flex: 'none', borderRadius: 5, background: '#d80d12', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, letterSpacing: '-.02em' }}>S</span>
            <span style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap' }}>Grupo SRV</span>
            <Ic n="expand_more" s={16} w={300} style={{ color: 'var(--text-2)' }} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-60">
            <div className="flex items-center gap-2.5 px-2 py-2">
              <span style={{ width: 28, height: 28, borderRadius: 6, background: '#d80d12', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800 }}>S</span>
              <span className="min-w-0"><span className="block text-corpo font-semibold">Grupo SRV</span><span className="block text-rotulo text-texto-3">Belém</span></span>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild><Link href="/home"><Ic n="home" s={16} /> Home</Link></DropdownMenuItem>
            {painel.papel === 'admin' && <DropdownMenuItem asChild><Link href="/config"><Ic n="settings" s={16} /> Configurações</Link></DropdownMenuItem>}
            {painel.papel === 'admin' && <DropdownMenuItem asChild><Link href="/config/usuarios"><Ic n="group" s={16} /> Gerenciar membros</Link></DropdownMenuItem>}
            <DropdownMenuSeparator />
            <form action={sair}><button className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-corpo outline-none hover:bg-hover" style={{ color: 'var(--red)' }}><Ic n="logout" s={16} /> Sair</button></form>
          </DropdownMenuContent>
        </DropdownMenu>
        <Link href="/agenda" title="Agenda" aria-label="Agenda" className="hidden sm:flex hover-bg" style={tb}><Ic n="calendar_today" s={19} w={300} /></Link>
        <div className="hidden sm:block"><AlertasSistema alertas={alertas} /></div>
      </div>

      <button type="button" onClick={abrirPaleta} aria-label="Buscar (⌘K)" className="hidden sm:flex" style={{ flex: '0 1 360px', minWidth: 160, height: 28, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', alignItems: 'center', gap: 8, padding: '0 5px 0 10px', color: 'var(--text-3)', cursor: 'text' }}>
        <Ic n="search" s={16} />
        <span style={{ flex: 1, textAlign: 'left', fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Buscar tarefas, clientes, documentos…</span>
        <span style={{ fontSize: 11, lineHeight: 1, padding: '3px 5px', border: '1px solid var(--border)', borderRadius: 4, background: 'var(--bg-subtle)', color: 'var(--text-2)' }}>⌘K</span>
      </button>

      <div style={{ flex: '1 1 0', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 2, minWidth: 0 }}>
        <button type="button" onClick={abrirPaleta} aria-label="Buscar" className="sm:hidden" style={{ ...tb, width: 36, height: 36 }}><Ic n="search" s={19} /></button>
        {papelPodeUsarIA(painel.papel) && (
          <button type="button" onClick={() => window.dispatchEvent(new Event(EVENTO_ABRIR_IA))} title="Assistente IA (⌘J)" className="hidden xl:flex hover-bg" style={{ height: 28, flex: 'none', whiteSpace: 'nowrap', alignItems: 'center', gap: 6, padding: '0 10px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--bg)', color: 'var(--text)', fontSize: 13, cursor: 'pointer', marginRight: 4 }}>
            Assistente IA<Ic n="auto_awesome" s={15} style={{ color: '#d80d12' }} />
          </button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger aria-label="Criar" title="Criar" style={{ height: 28, display: 'flex', alignItems: 'center', gap: 4, padding: '0 10px 0 6px', border: 0, borderRadius: 6, background: 'var(--primary)', color: 'var(--on-primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginRight: 4 }}><Ic n="add" s={16} />Criar</DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem asChild><Link href="/inicio"><Ic n="task_alt" s={16} /> Tarefa <span className="ml-auto text-rotulo text-texto-3">T</span></Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link href="/agendamentos"><Ic n="photo_library" s={16} /> Post <span className="ml-auto text-rotulo text-texto-3">P</span></Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link href="/documentos"><Ic n="description" s={16} /> Documento</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link href="/reunioes"><Ic n="videocam" s={16} /> Reunião</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link href="/quadros"><Ic n="draw" s={16} /> Quadro</Link></DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Link href="/inicio" title="Minhas tarefas" aria-label="Minhas tarefas" className="hidden md:flex hover-bg" style={tb}><Ic n="task_alt" s={17} /></Link>
        <Link href="/reunioes" title="Reuniões" aria-label="Reuniões" className="hidden md:flex hover-bg" style={tb}><Ic n="videocam" s={17} /></Link>
        <Link href="/documentos" title="Documentos" aria-label="Documentos" className="hidden md:flex hover-bg" style={tb}><Ic n="description" s={17} /></Link>
        <SinoAvisos avisos={avisos} naoLidos={naoLidos} euId={euId} />
        <MenuPerfil nome={painel.nome} papel={painel.papel} className="hover-bg" estilo={{ ...tb, padding: 0 }} />
      </div>

      <AtalhosGlobais aoAbrirPaleta={abrirPaleta} aoAbrirAjuda={abrirAjuda} />
      <PaletaComandos aberta={paleta} aoMudar={setPaleta} navegacao={painel.navegacao} papel={painel.papel} chatNaoLidas={painel.chatNaoLidas ?? 0} aoAbrirAjuda={abrirAjuda} />
      <AtalhosDialog aberto={ajuda} aoMudar={setAjuda} />
    </header>
  )
}
