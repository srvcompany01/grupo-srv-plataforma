'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Ic } from '@/componentes/app/Ic'
import type { ItemDaCaixa } from '@/servicos/caixa-de-entrada'
import { EnviarVideos } from './EnviarVideos'
import { ListaDaCaixa } from './ListaDaCaixa'
import { PainelDrive } from './PainelDrive'

/** A caixa em si: escolher de qual cliente é o material e arrastar. O Drive é a outra entrada; ficha e Drive ficam nas configurações. */
export function AreaDeEntrada({ clientes, itens, driveConfigurado, emailDaConta }: { clientes: { id: string; nome: string }[]; itens: ItemDaCaixa[]; driveConfigurado: boolean; emailDaConta: string | null }) {
  const [clienteId, setClienteId] = useState('')
  const [aba, setAba] = useState<'computador' | 'drive'>('computador')
  const visiveis = clienteId ? itens.filter((i) => i.clienteId === clienteId) : itens
  return (
    <div className="mx-auto max-w-[900px] space-y-4 p-3">
      <section className="overflow-hidden rounded-lg border border-borda">
        <div className="flex flex-wrap items-center gap-3 border-b border-borda-fraca px-3 py-2">
          <label className="flex items-center gap-2 text-[13px] font-semibold">
            De qual cliente é este material?
            <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} aria-label="Cliente do material" className="h-8 min-w-48 rounded-md border border-borda bg-white px-2 text-[13px] font-bold text-[var(--client)] outline-none focus:border-[var(--focus)]">
              <option value="">Selecione o cliente…</option>
              {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </label>
          <div role="tablist" className="ml-auto flex gap-1 text-[13px]">
            {([['computador', 'Do computador', 'upload_file'], ['drive', 'Do Google Drive', 'cloud']] as const).map(([k, r, ic]) => (
              <button key={k} type="button" role="tab" aria-selected={aba === k} onClick={() => setAba(k)} className="b-ghost" style={aba === k ? { background: 'var(--bg-active)', color: 'var(--text)', fontWeight: 600 } : undefined}><Ic n={ic} s={16} />{r}</button>
            ))}
          </div>
        </div>
        {aba === 'computador' ? (
          <EnviarVideos clienteId={clienteId} />
        ) : clienteId ? (
          <PainelDrive key={clienteId} clienteId={clienteId} configurado={driveConfigurado} emailDaConta={emailDaConta} />
        ) : (
          <p className="p-4 text-[13px] text-texto-3">Escolha o cliente acima para procurar na pasta dele no Google Drive.</p>
        )}
      </section>
      <ListaDaCaixa itens={visiveis} mostrarCliente={!clienteId} />
      <p className="text-center text-[12px] text-texto-3"><Link href="/caixa-de-entrada/configuracoes" className="inline-flex items-center gap-1 text-[var(--client)] hover:underline"><Ic n="settings" s={14} />Ficha de conteúdo e Google Drive</Link></p>
    </div>
  )
}
