'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Ic } from '@/componentes/app/Ic'
import type { ItemDaCaixa } from '@/servicos/caixa-de-entrada'
import { EnviarVideos } from './EnviarVideos'
import type { EspacoParaDestino } from '@/dominio/destino-caixa'
import { ListaDaCaixa } from './ListaDaCaixa'
import { PainelDrive } from './PainelDrive'

/** A caixa em si: escolher de qual cliente é o material e arrastar. O Drive é a outra entrada; ficha e Drive ficam nas configurações. */
export function AreaDeEntrada({ arvore, clientes, itens, driveConfigurado, emailDaConta }: { arvore: EspacoParaDestino[]; clientes: { id: string; nome: string }[]; itens: ItemDaCaixa[]; driveConfigurado: boolean; emailDaConta: string | null }) {
  const [clienteId, setClienteId] = useState('')
  const [aba, setAba] = useState<'computador' | 'drive'>('computador')
  const visiveis = clienteId ? itens.filter((i) => i.clienteId === clienteId) : itens
  return (
    <div>
      <section>
        <div>
          <label>
            De qual cliente é este material?
            <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} aria-label="Cliente do material">
              <option value="">Selecione o cliente…</option>
              {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </label>
          <div role="tablist">
            {([['computador', 'Do computador', 'upload_file'], ['drive', 'Do Google Drive', 'cloud']] as const).map(([k, r, ic]) => (
              <button key={k} type="button" role="tab" aria-selected={aba === k} onClick={() => setAba(k)} style={aba === k ? { background: 'var(--bg-active)', color: 'var(--text)', fontWeight: 600 } : undefined}><Ic n={ic} s={16} />{r}</button>
            ))}
          </div>
        </div>
        {aba === 'computador' ? (
          <EnviarVideos clienteId={clienteId} />
        ) : clienteId ? (
          <PainelDrive key={clienteId} clienteId={clienteId} configurado={driveConfigurado} emailDaConta={emailDaConta} />
        ) : (
          <p>Escolha o cliente acima para procurar na pasta dele no Google Drive.</p>
        )}
      </section>
      <ListaDaCaixa arvore={arvore} itens={visiveis} mostrarCliente={!clienteId} />
      <p><Link href="/caixa-de-entrada/configuracoes"><Ic n="settings" s={14} />Ficha de conteúdo e Google Drive</Link></p>
    </div>
  )
}
