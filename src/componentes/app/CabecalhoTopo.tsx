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

  return (
    <header style={{ height: 40, display: 'flex', alignItems: 'center', gap: 8, padding: '0 8px', background: 'var(--bg-frame)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: '1 1 0', minWidth: 0 }}>
      </div>

      <button type="button" onClick={abrirPaleta} aria-label="Buscar (⌘K)" className="hidden">
        <Ic n="search" s={16} />
        <span style={{ flex: 1, textAlign: 'left', fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Buscar tarefas, clientes, documentos…</span>
        <kbd>⌘K</kbd>
      </button>

      <div style={{ flex: '1 1 0', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 6, minWidth: 0 }}>
        <button type="button" onClick={abrirPaleta} aria-label="Buscar"><Ic n="search" s={19} /></button>
      </div>

      <AtalhosGlobais aoAbrirPaleta={abrirPaleta} aoAbrirAjuda={abrirAjuda} />
      <PaletaComandos aberta={paleta} aoMudar={setPaleta} navegacao={painel.navegacao} papel={painel.papel} chatNaoLidas={painel.chatNaoLidas ?? 0} aoAbrirAjuda={abrirAjuda} />
      <AtalhosDialog aberto={ajuda} aoMudar={setAjuda} />
    </header>
  )
}
