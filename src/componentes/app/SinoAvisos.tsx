'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useId, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { marcarAvisoLidoAcao, marcarTodosAvisosLidosAcao } from '@/app/(app)/acoes-avisos'
import { avisar } from '@/componentes/tarefas/avisar'
import { Popover, PopoverContent, PopoverTrigger } from '@/componentes/ui/popover'
import { rotuloContagem, tempoRelativo } from '@/dominio/formatar'
import { criarClienteNavegador } from '@/infra/supabase/navegador'
import type { Aviso } from '@/servicos/avisos'
import { AtSign, TriangleAlert } from 'lucide-react'
import { Ic } from './Ic'

export function SinoAvisos({ avisos, naoLidos, euId, variante = 'topo', ouvir = true }: { /** false = só mostra a lista (a outra cópia do sino já escuta e avisa em tempo real). */ ouvir?: boolean; avisos: Aviso[]; naoLidos: number; euId: string; /** `dock` = botão da barra de navegação (painel abre ao lado). */ variante?: 'topo' | 'dock' }) {
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const [agora, setAgora] = useState(() => Date.now())
  const [pendente, iniciar] = useTransition()
  const [soNovos, setSoNovos] = useState(false)
  const lista = soNovos ? avisos.filter((a) => !a.lido) : avisos
  const idCanal = useId()
  const selo = rotuloContagem(naoLidos)

  // Novo aviso para esta pessoa: atualiza o layout e avisa na hora.
  useEffect(() => {
    if (!ouvir) return
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
  }, [euId, idCanal, router, ouvir])

  function abrir(a: Aviso) {
    setAberto(false)
    iniciar(async () => {
      if (!a.lido) avisar(await marcarAvisoLidoAcao(a.id))
      router.push(a.href)
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
      <PopoverTrigger className="cs-sino" aria-label={selo ? `Avisos (${naoLidos} não lidos)` : 'Avisos'} style={variante === 'dock' ? undefined : { padding: 0 }}>
        <Ic n="notifications" s={variante === 'dock' ? 22 : 18} />
        {selo && <span />}
      </PopoverTrigger>
      <PopoverContent side={variante === 'dock' ? 'right' : 'bottom'} align="end" className="cs-avisos">
        <div>
          <p>Alertas</p>
          <div role="tablist">
            <button type="button" role="tab" aria-selected={!soNovos} data-on={!soNovos || undefined} onClick={() => setSoNovos(false)}>Todos</button>
            <button type="button" role="tab" aria-selected={soNovos} data-on={soNovos || undefined} onClick={() => setSoNovos(true)}>Não lidos</button>
          </div>
        </div>
        {lista.length === 0 ? (
          <p>{soNovos ? 'Nenhum aviso novo.' : 'Nenhum aviso por enquanto.'}</p>
        ) : (
          <div>
            {lista.map((a) => (
              <button key={a.id} type="button" disabled={pendente} onClick={() => abrir(a)} data-nova={!a.lido || undefined}>
                <span data-erro={a.mensagem ? true : undefined}>{a.mensagem ? <TriangleAlert size={18} strokeWidth={1.6} /> : <AtSign size={18} strokeWidth={1.6} />}</span>
                <span>
                  <span>{a.mensagem ?? `${a.atorNome || 'Alguém'} mencionou você em ${a.onde}`}</span>
                </span>
                <span>{!a.lido && <span />}{tempoRelativo(a.criadoEm, agora)}</span>
              </button>
            ))}
          </div>
        )}
        <button type="button" disabled={pendente || naoLidos === 0} onClick={() => iniciar(async () => void avisar(await marcarTodosAvisosLidosAcao()))}>Marcar todos como lidos</button>
      </PopoverContent>
    </Popover>
  )
}
