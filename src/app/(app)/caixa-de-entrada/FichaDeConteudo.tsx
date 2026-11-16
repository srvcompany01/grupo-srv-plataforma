'use client'

import { useState, useTransition } from 'react'
import { avisar } from '@/componentes/tarefas/avisar'
import { botaoPrimario, campo, rotulo } from '@/lib/ui'
import type { FichaDeConteudo as Ficha } from '@/servicos/caixa-de-entrada'
import { salvarFichaAcao } from './acoes'

/** Ficha do cliente que a IA lê antes de escrever legendas: pasta do Drive, tom de voz, hashtags e chamada para ação. */
export function FichaDeConteudo({ clienteId, clienteNome, ficha }: { clienteId: string; clienteNome: string; ficha: Ficha }) {
  const [f, setF] = useState({ pastaDrive: ficha.pastaDrive ? `https://drive.google.com/drive/folders/${ficha.pastaDrive}` : '', tom: ficha.tom, hashtags: ficha.hashtags, chamada: ficha.chamada, observacoes: ficha.observacoes })
  const [pendente, iniciar] = useTransition()
  const mudar = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((x) => ({ ...x, [k]: e.target.value }))
  return (
    <aside className="h-fit overflow-hidden rounded-lg border border-borda">
      <div className="flex h-10 items-center border-b border-borda-fraca px-3"><h2 className="text-[13px] font-semibold">Ficha de conteúdo · <span className="font-bold text-[var(--client)]">{clienteNome}</span></h2></div>
      <form className="space-y-3 p-3" onSubmit={(e) => { e.preventDefault(); iniciar(async () => void avisar(await salvarFichaAcao({ clienteId, ...f }), true)) }}>
        <label className="block space-y-1"><span className={rotulo}>Pasta do Google Drive do cliente</span><input className={campo} value={f.pastaDrive} onChange={mudar('pastaDrive')} placeholder="Cole o link da pasta" /></label>
        <label className="block space-y-1"><span className={rotulo}>Tom de voz</span><textarea className={`${campo} min-h-16 py-2`} value={f.tom} onChange={mudar('tom')} maxLength={2000} placeholder="Ex.: próximo, direto, sem gírias, usa emojis com moderação" /></label>
        <label className="block space-y-1"><span className={rotulo}>Hashtags fixas</span><textarea className={`${campo} min-h-16 py-2`} value={f.hashtags} onChange={mudar('hashtags')} maxLength={2000} placeholder="#marca #cidade #nicho" /></label>
        <label className="block space-y-1"><span className={rotulo}>Chamada para ação</span><input className={campo} value={f.chamada} onChange={mudar('chamada')} maxLength={500} placeholder="Ex.: Chame no WhatsApp pelo link da bio" /></label>
        <label className="block space-y-1"><span className={rotulo}>Observações para a IA</span><textarea className={`${campo} min-h-16 py-2`} value={f.observacoes} onChange={mudar('observacoes')} maxLength={4000} placeholder="O que nunca falar, palavras proibidas, produtos em destaque…" /></label>
        <button disabled={pendente} className={botaoPrimario}>{pendente ? 'Salvando…' : 'Salvar ficha'}</button>
      </form>
    </aside>
  )
}
