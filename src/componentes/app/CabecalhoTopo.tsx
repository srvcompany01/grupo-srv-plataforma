'use client'

import { useCallback, useState } from 'react'
import { AtalhosDialog } from './AtalhosDialog'
import { AtalhosGlobais } from './AtalhosGlobais'
import { Ic } from './Ic'
import type { PropsPainel } from './BarraLateral'
import { PaletaComandos } from './PaletaComandos'

type Props = { painel: PropsPainel }


/**
 * Barra do topo, fixa, de 40px: só a busca central, que abre a paleta ⌘K (no celular, o ícone de busca à direita).
 * Configurações, tema e perfil ficam no pé da faixa de ícones. 
 */
export function CabecalhoTopo({ painel }: Props) {
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
      </div>

      <AtalhosGlobais aoAbrirPaleta={abrirPaleta} aoAbrirAjuda={abrirAjuda} />
      <PaletaComandos aberta={paleta} aoMudar={setPaleta} navegacao={painel.navegacao} papel={painel.papel} chatNaoLidas={painel.chatNaoLidas ?? 0} aoAbrirAjuda={abrirAjuda} />
      <AtalhosDialog aberto={ajuda} aoMudar={setAjuda} />
    </header>
  )
}
