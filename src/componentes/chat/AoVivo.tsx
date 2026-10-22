'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useId, useRef, type ReactNode } from 'react'
import { marcarCanalLidoAcao } from '@/app/(app)/chat/acoes'
import { criarClienteNavegador } from '@/infra/supabase/navegador'

/**
 * Mantém o canal ao vivo: qualquer mensagem nova, editada ou apagada atualiza a tela, e o canal fica como lido.
 * Envolve a lista de mensagens e rola até o fim ao abrir e quando chega mensagem (se a pessoa estava no fim).
 */
export function AoVivo({ canalId, total, children, className }: { canalId: string; total: number; children: ReactNode; className?: string }) {
  const router = useRouter()
  const id = useId()
  const caixa = useRef<HTMLDivElement>(null)
  const noFim = useRef(true)

  useEffect(() => {
    void marcarCanalLidoAcao(canalId)
    const sb = criarClienteNavegador()
    const canal = sb
      .channel(`chat-${canalId}-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages', filter: `channel_id=eq.${canalId}` }, () => {
        router.refresh()
        void marcarCanalLidoAcao(canalId)
      })
      .subscribe()
    return () => {
      void sb.removeChannel(canal)
    }
  }, [canalId, id, router])

  // Ao abrir e a cada mensagem nova: vai para o fim, a não ser que a pessoa tenha subido para ler o histórico.
  useEffect(() => {
    const el = caixa.current
    if (el && noFim.current) el.scrollTop = el.scrollHeight
  }, [total])

  return (
    <div ref={caixa} className={className} onScroll={(e) => { const el = e.currentTarget; noFim.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120 }}>
      {children}
    </div>
  )
}
