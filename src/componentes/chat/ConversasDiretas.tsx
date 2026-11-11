'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { abrirConversaAcao } from '@/app/(app)/chat/acoes'
import { avisar } from '@/componentes/tarefas/avisar'

export type PessoaConversa = { id: string; nome: string; situacao: 'ativo' | 'ocioso' | 'offline'; canal?: string; naoLidas: number; aberta: boolean }


/** Mensagens diretas: toda a equipe com bolinha de presença. Clicar abre (ou cria) a conversa privada de duas pessoas. */
export function ConversasDiretas({ pessoas }: { pessoas: PessoaConversa[] }) {
  const router = useRouter()
  const [pendente, iniciar] = useTransition()
  const abrir = (p: PessoaConversa) => {
    if (p.canal) return router.push(`/chat/${p.canal}`)
    iniciar(async () => {
      const r = await abrirConversaAcao(p.id)
      if (avisar(r, true) && r?.nome) router.push(`/chat/${r.nome}`)
    })
  }
  return (
    <div>
      {pessoas.map((p) => (
        <button key={p.id} type="button" disabled={pendente} onClick={() => abrir(p)}>
          <span>
            {p.nome.slice(0, 1).toUpperCase()}
            <span aria-label={p.situacao === 'ativo' ? 'online' : p.situacao === 'ocioso' ? 'ausente' : 'offline'} />
          </span>
          <span>{p.nome}</span>
          {p.naoLidas > 0 && !p.aberta && <span>{p.naoLidas > 99 ? '99+' : p.naoLidas}</span>}
        </button>
      ))}
    </div>
  )
}
