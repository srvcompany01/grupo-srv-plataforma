'use client'

import { Check, Copy, ExternalLink, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { novoLinkAcao } from '@/app/(app)/clientes/acoes'
import { useConfirmar } from '@/componentes/ConfirmarProvider'
import { avisar } from '@/componentes/tarefas/avisar'
import { botaoFantasma, botaoSecundario } from '@/lib/ui'

/** Link do cliente (sem login) para mandar a ele: copiar, abrir e gerar um novo (o anterior para de funcionar). */
export function LinkDoCliente({ clienteId, url, podeGerir }: { clienteId: string; url: string; podeGerir: boolean }) {
  const router = useRouter()
  const confirmar = useConfirmar()
  const [copiado, setCopiado] = useState(false)
  const [pendente, iniciar] = useTransition()
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      avisar({ erro: 'Não consegui copiar; selecione o link e copie.' })
    }
  }
  const novo = async () => {
    if (!(await confirmar({ titulo: 'Gerar um link novo?', descricao: 'O link atual para de funcionar na hora. Use se ele foi parar com quem não devia.', confirmar: 'Gerar link novo', perigo: true }))) return
    iniciar(async () => { if (avisar(await novoLinkAcao(clienteId), true)) router.refresh() })
  }
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 rounded-lg border border-borda bg-fundo/60 px-3 py-2">
        <span className="min-w-0 flex-1 truncate font-mono text-rotulo text-texto" title={url}>{url}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={copiar} className={botaoSecundario}>{copiado ? <><Check className="h-3.5 w-3.5 text-sucesso" /> Copiado</> : <><Copy className="h-3.5 w-3.5" /> Copiar link</>}</button>
        <a href={url} target="_blank" rel="noreferrer" className={botaoFantasma}><ExternalLink className="h-3.5 w-3.5" /> Abrir</a>
        {podeGerir && <button type="button" onClick={novo} disabled={pendente} className={botaoFantasma}><RefreshCw className="h-3.5 w-3.5" /> Gerar link novo</button>}
      </div>
    </div>
  )
}
