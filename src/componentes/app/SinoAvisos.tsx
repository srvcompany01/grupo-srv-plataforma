'use client'

import { Bell } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useId, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { marcarAvisoLidoAcao, marcarTodosAvisosLidosAcao } from '@/app/(app)/acoes-avisos'
import { avisar } from '@/componentes/tarefas/avisar'
import { Popover, PopoverContent, PopoverTrigger } from '@/componentes/ui/popover'
import { rotuloContagem, tempoRelativo } from '@/dominio/formatar'
import { criarClienteNavegador } from '@/infra/supabase/navegador'
import type { Aviso } from '@/servicos/avisos'

export function SinoAvisos({ avisos, naoLidos, euId }: { avisos: Aviso[]; naoLidos: number; euId: string }) {
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const [agora, setAgora] = useState(() => Date.now())
  const [pendente, iniciar] = useTransition()
  const idCanal = useId()
  const selo = rotuloContagem(naoLidos)

  // Novo aviso para esta pessoa: atualiza o layout e avisa na hora.
  useEffect(() => {
    const sb = criarClienteNavegador()
    const canal = sb
      .channel(`avisos-${euId}-${idCanal}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${euId}` }, async (evento) => {
        router.refresh()
        const atorId = (evento.new as { actor_id?: string | null }).actor_id
        let nome = 'Alguém'
        if (atorId) {
          const { data } = await sb.from('profiles').select('full_name').eq('id', atorId).maybeSingle()
          if (data?.full_name) nome = data.full_name
        }
        toast(`${nome} mencionou você`)
      })
      .subscribe()
    return () => {
      void sb.removeChannel(canal)
    }
  }, [euId, idCanal, router])

  function abrir(a: Aviso) {
    setAberto(false)
    iniciar(async () => {
      if (!a.lido) avisar(await marcarAvisoLidoAcao(a.id))
      router.push(`/tarefas/${a.tarefaId}`)
    })
  }

  return (
    <Popover
      open={aberto}
      onOpenChange={(v) => {
        setAberto(v)
        if (v) setAgora(Date.now())
      }}
    >
      <PopoverTrigger aria-label={selo ? `Avisos (${naoLidos} não lidos)` : 'Avisos'} className="relative rounded-md p-1.5 text-lat-2 hover:bg-lat-hover hover:text-lat-fg">
        <Bell className="h-4 w-4" />
        {selo && <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-perigo px-1 text-legenda font-semibold text-white">{selo}</span>}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 gap-0 p-0">
        <p className="border-b border-borda px-3 py-2 text-corpo font-semibold">Avisos</p>
        {avisos.length === 0 ? (
          <p className="px-3 py-4 text-rotulo text-texto-3">Nenhum aviso por enquanto.</p>
        ) : (
          <ul className="max-h-80 divide-y divide-borda overflow-y-auto">
            {avisos.map((a) => (
              <li key={a.id}>
                <button disabled={pendente} onClick={() => abrir(a)} className={`block w-full px-3 py-2 text-left text-rotulo hover:bg-hover ${a.lido ? 'text-texto-2' : 'font-bold text-texto'}`}>
                  <span className="block">
                    {a.atorNome || 'Alguém'} mencionou você em {a.tarefaTitulo || 'uma tarefa'}
                  </span>
                  <span className="block text-legenda font-normal text-texto-3">{tempoRelativo(a.criadoEm, agora)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <button
          disabled={pendente || naoLidos === 0}
          onClick={() => iniciar(async () => void avisar(await marcarTodosAvisosLidosAcao()))}
          className="border-t border-borda px-3 py-2 text-left text-rotulo font-medium text-marca hover:bg-hover disabled:opacity-40"
        >
          Marcar todos como lidos
        </button>
      </PopoverContent>
    </Popover>
  )
}
