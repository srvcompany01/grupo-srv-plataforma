'use client'

import { useOptimistic, useState, useTransition } from 'react'
import { atualizarTarefaAcao } from '@/app/(app)/tarefas/acoes'
import { Popover, PopoverContent, PopoverTrigger } from '@/componentes/ui/popover'
import { somarDias } from '@/dominio/filtros'
import { formatarData } from '@/dominio/formatar'
import { botaoFantasma, botaoSecundario, campo } from '@/lib/ui'
import { avisar } from './avisar'

/** Vencimento só para leitura: dd/mm, em vermelho quando atrasado e ainda não concluída. */
export function Prazo({ prazo, concluida, hoje }: { prazo: string | null; concluida: boolean; hoje: string }) {
  if (!prazo) return <span className="text-texto-3">—</span>
  const atrasada = !concluida && prazo < hoje
  return <span className={atrasada ? 'font-medium text-perigo' : 'text-texto-2'}>{formatarData(prazo).slice(0, 5)}</span>
}

/**
 * Vencimento editável em qualquer lugar (lista, quadro, subtarefas): clica, escolhe a data e fecha.
 * É o campo que manda no calendário. Atualiza na hora e desfaz se o servidor recusar.
 */
export function EditorVencimento({ tarefaId, prazo, concluida, hoje }: { tarefaId: string; prazo: string | null; concluida: boolean; hoje: string }) {
  const [aberto, setAberto] = useState(false)
  const [exibido, definirExibido] = useOptimistic(prazo)
  const [, iniciar] = useTransition()

  const salvar = (novo: string | null) => {
    setAberto(false)
    iniciar(async () => {
      definirExibido(novo)
      avisar(await atualizarTarefaAcao(tarefaId, { prazo: novo }))
    })
  }

  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger aria-label={exibido ? `Vencimento ${formatarData(exibido)}. Alterar` : 'Definir vencimento'} title="Alterar vencimento" className="min-w-8 rounded px-1 py-0.5 text-left tabular-nums outline-none hover:bg-hover focus-visible:ring-2 focus-visible:ring-marca/30">
        <Prazo prazo={exibido} concluida={concluida} hoje={hoje} />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-60 space-y-2 p-3">
        <input type="date" aria-label="Vencimento" autoFocus defaultValue={exibido ?? ''} onChange={(e) => e.target.value && salvar(e.target.value)} className={`${campo} h-9 py-0`} />
        <div className="flex flex-wrap gap-1.5">
          <button type="button" onClick={() => salvar(hoje)} className={`${botaoSecundario} h-7 px-2.5 text-legenda`}>Hoje</button>
          <button type="button" onClick={() => salvar(somarDias(hoje, 1))} className={`${botaoSecundario} h-7 px-2.5 text-legenda`}>Amanhã</button>
          {exibido && <button type="button" onClick={() => salvar(null)} className={`${botaoFantasma} h-7 px-2.5 text-legenda`}>Limpar</button>}
        </div>
      </PopoverContent>
    </Popover>
  )
}
