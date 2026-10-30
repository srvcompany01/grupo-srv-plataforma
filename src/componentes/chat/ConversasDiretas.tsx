'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { abrirConversaAcao } from '@/app/(app)/chat/acoes'
import { avisar } from '@/componentes/tarefas/avisar'

export type PessoaConversa = { id: string; nome: string; situacao: 'ativo' | 'ocioso' | 'offline'; canal?: string; naoLidas: number; aberta: boolean }

const COR = { ativo: 'bg-[#16a34a]', ocioso: 'bg-[#e08a00]', offline: 'bg-[var(--border-strong)]' } as const

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
    <div className="space-y-0.5">
      {pessoas.map((p) => (
        <button key={p.id} type="button" disabled={pendente} onClick={() => abrir(p)} className={`flex w-full items-center gap-2 rounded px-2 py-1 text-left text-corpo hover:bg-hover ${p.aberta ? 'bg-[var(--bg-active)] font-semibold text-texto' : p.naoLidas ? 'font-semibold text-texto' : 'text-texto-2'}`}>
          <span className="relative flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--bg-active)] text-[10px] font-semibold text-texto-2">
            {p.nome.slice(0, 1).toUpperCase()}
            <span className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full ring-2 ring-[var(--bg-subtle)] ${COR[p.situacao]}`} aria-label={p.situacao === 'ativo' ? 'online' : p.situacao === 'ocioso' ? 'ausente' : 'offline'} />
          </span>
          <span className="min-w-0 flex-1 truncate">{p.nome}</span>
          {p.naoLidas > 0 && !p.aberta && <span className="rounded-md bg-[#d80d12] px-1.5 text-micro font-bold text-white">{p.naoLidas > 99 ? '99+' : p.naoLidas}</span>}
        </button>
      ))}
    </div>
  )
}
