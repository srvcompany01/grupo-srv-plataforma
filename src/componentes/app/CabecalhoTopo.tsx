'use client'

import Link from 'next/link'
import { useCallback, useState } from 'react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/componentes/ui/dropdown-menu'
import type { Aviso } from '@/servicos/avisos'
import { AtalhosDialog } from './AtalhosDialog'
import { MenuPerfil } from './MenuPerfil'
import { AtalhosGlobais } from './AtalhosGlobais'
import { Ic } from './Ic'
import type { PropsPainel } from './BarraLateral'
import { EVENTO_ABRIR_IA } from './PainelIA'
import { papelPodeUsarIA } from '@/ia/acesso'
import { PaletaComandos } from './PaletaComandos'
import { SinoAvisos } from './SinoAvisos'

type Props = { painel: PropsPainel; avisos: Aviso[]; naoLidos: number; euId: string }


/**
 * Barra do topo, fixa, de 40px: busca central que abre a paleta ⌘K, Criar, atalhos (tarefas, reuniões, documentos), avisos e perfil.
 * Configurações, tema e perfil ficam no pé da faixa de ícones. 
 */
export function CabecalhoTopo({ painel, avisos, naoLidos, euId }: Props) {
  const [paleta, setPaleta] = useState(false)
  const [ajuda, setAjuda] = useState(false)
  const abrirPaleta = useCallback(() => setPaleta(true), [])
  const abrirAjuda = useCallback(() => setAjuda(true), [])

  const TB = 'tb flex items-center justify-center gap-1.5'
  return (
    <header className="sticky top-0 z-30" style={{ height: 40, display: 'flex', alignItems: 'center', gap: 8, padding: '0 8px', background: 'var(--bg-frame)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: '1 1 0', minWidth: 0 }}>
      </div>

      <button type="button" onClick={abrirPaleta} aria-label="Buscar (⌘K)" className="tb hidden items-center gap-2 sm:flex" style={{ flex: '0 1 360px', minWidth: 160, padding: '0 6px 0 12px', color: 'var(--text-3)', cursor: 'text' }}>
        <Ic n="search" s={16} />
        <span style={{ flex: 1, textAlign: 'left', fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Buscar tarefas, clientes, documentos…</span>
        <span style={{ fontSize: 11, lineHeight: 1, padding: '3px 5px', border: '1px solid var(--border)', borderRadius: 4, background: 'var(--bg-subtle)', color: 'var(--text-2)' }}>⌘K</span>
      </button>

      <div style={{ flex: '1 1 0', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 6, minWidth: 0 }}>
        <button type="button" onClick={abrirPaleta} aria-label="Buscar" className={`sm:hidden ${TB}`}><Ic n="search" s={19} /></button>
        {papelPodeUsarIA(painel.papel) && (
          <button type="button" onClick={() => window.dispatchEvent(new Event(EVENTO_ABRIR_IA))} title="Assistente IA (⌘J)" className="tb hidden items-center gap-1.5 xl:flex" style={{ padding: '0 12px', color: 'var(--text)' }}>
            Assistente IA<Ic n="auto_awesome" s={15} style={{ color: '#d80d12' }} />
          </button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger aria-label="Criar" title="Criar" className={`${TB} tb-pri`} style={{ padding: '0 12px 0 8px' }}><Ic n="add" s={16} />Criar</DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem asChild><Link href="/inicio"><Ic n="task_alt" s={16} /> Tarefa <span className="ml-auto text-rotulo text-texto-3">T</span></Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link href="/agendamentos"><Ic n="photo_library" s={16} /> Post <span className="ml-auto text-rotulo text-texto-3">P</span></Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link href="/documentos"><Ic n="description" s={16} /> Documento</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link href="/reunioes"><Ic n="videocam" s={16} /> Reunião</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link href="/quadros"><Ic n="draw" s={16} /> Quadro</Link></DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Link href="/inicio" title="Minhas tarefas" aria-label="Minhas tarefas" className={`hidden md:flex ${TB}`}><Ic n="task_alt" s={17} /></Link>
        <Link href="/reunioes" title="Reuniões" aria-label="Reuniões" className={`hidden md:flex ${TB}`}><Ic n="videocam" s={17} /></Link>
        <Link href="/documentos" title="Documentos" aria-label="Documentos" className={`hidden md:flex ${TB}`}><Ic n="description" s={17} /></Link>
        <SinoAvisos avisos={avisos} naoLidos={naoLidos} euId={euId} />
        <MenuPerfil nome={painel.nome} papel={painel.papel} className={TB} estilo={{ padding: 0 }} />
      </div>

      <AtalhosGlobais aoAbrirPaleta={abrirPaleta} aoAbrirAjuda={abrirAjuda} />
      <PaletaComandos aberta={paleta} aoMudar={setPaleta} navegacao={painel.navegacao} papel={painel.papel} chatNaoLidas={painel.chatNaoLidas ?? 0} aoAbrirAjuda={abrirAjuda} />
      <AtalhosDialog aberto={ajuda} aoMudar={setAjuda} />
    </header>
  )
}
