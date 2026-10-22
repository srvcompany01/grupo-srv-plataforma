'use client'

import { Check, PencilLine } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { responderPostAcao } from '@/app/portal/acoes-conteudo'
import { useConfirmar } from '@/componentes/ConfirmarProvider'
import { avisar } from '@/componentes/tarefas/avisar'
import { botaoFantasma, botaoPrimario, campo } from '@/lib/ui'

/** Aprovar ou pedir ajuste (com o que mudar). */
export function RespostaPost({ tarefaId, quando }: { tarefaId: string; quando: string | null }) {
  const router = useRouter()
  const confirmar = useConfirmar()
  const [ajuste, setAjuste] = useState(false)
  const [texto, setTexto] = useState('')
  const [pendente, iniciar] = useTransition()
  const responder = (decisao: 'aprovado' | 'ajuste') => iniciar(async () => { if (avisar(await responderPostAcao(tarefaId, decisao, texto), true)) router.refresh() })
  const aprovar = async () => {
    if (!(await confirmar({ titulo: 'Aprovar este post?', descricao: quando ? `Ele será publicado ${quando}.` : 'A equipe vai publicar no dia combinado.', confirmar: 'Aprovar' }))) return
    responder('aprovado')
  }

  if (ajuste) {
    return (
      <div className="space-y-2">
        <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={4} autoFocus placeholder="O que você quer mudar? (texto, imagem, horário…)" className={campo} maxLength={2000} />
        <div className="flex gap-2">
          <button type="button" className={botaoPrimario} disabled={pendente || !texto.trim()} onClick={() => responder('ajuste')}><PencilLine className="h-4 w-4" /> Enviar pedido de ajuste</button>
          <button type="button" className={botaoFantasma} onClick={() => setAjuste(false)}>Voltar</button>
        </div>
      </div>
    )
  }
  return (
    <div className="grid grid-cols-2 gap-2">
      <button type="button" disabled={pendente} onClick={aprovar} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-sucesso px-4 text-corpo font-semibold text-white hover:bg-sucesso-forte disabled:opacity-50"><Check className="h-4 w-4" /> Aprovar</button>
      <button type="button" disabled={pendente} onClick={() => setAjuste(true)} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-borda bg-white px-4 text-corpo font-semibold text-texto hover:bg-hover disabled:opacity-50"><PencilLine className="h-4 w-4" /> Pedir ajuste</button>
    </div>
  )
}
