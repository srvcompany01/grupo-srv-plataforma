'use client'

import { Check, Copy, ExternalLink, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { novoLinkAcao } from '@/app/(app)/clientes/acoes'
import { useConfirmar } from '@/componentes/ConfirmarProvider'
import { avisar } from '@/componentes/tarefas/avisar'

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
    <div>
      <div>
        <span title={url}>{url}</span>
      </div>
      <div>
        <button type="button" onClick={copiar}>{copiado ? <><Check /> Copiado</> : <><Copy /> Copiar link</>}</button>
        <a href={url} target="_blank" rel="noreferrer"><ExternalLink /> Abrir</a>
        {podeGerir && <button type="button" onClick={novo} disabled={pendente}><RefreshCw /> Gerar link novo</button>}
      </div>
    </div>
  )
}
