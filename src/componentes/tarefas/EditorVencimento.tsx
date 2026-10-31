'use client'

import { useOptimistic, useState, useTransition } from 'react'
import { atualizarTarefaAcao } from '@/app/(app)/tarefas/acoes'
import { Popover, PopoverContent, PopoverTrigger } from '@/componentes/ui/popover'
import { somarDias } from '@/dominio/filtros'
import { formatarPrazo } from '@/dominio/prazo'
import { botaoFantasma, botaoSecundario, campo } from '@/lib/ui'
import { avisar } from './avisar'

/** Vencimento só para leitura: dd/mm (dia da semana), com o horário quando existe; em vermelho quando atrasado e ainda não concluída. */
export function Prazo({ prazo, horario, concluida, hoje }: { prazo: string | null; horario?: string | null; concluida: boolean; hoje: string }) {
  if (!prazo) return <span className="text-texto-3">—</span>
  const atrasada = !concluida && prazo < hoje
  return <span className={`whitespace-nowrap ${atrasada ? 'font-medium text-perigo' : 'text-texto-2'}`}>{formatarPrazo(prazo, horario)}</span>
}

/**
 * Vencimento editável em qualquer lugar (lista, quadro, subtarefas): clica, escolhe a data e fecha.
 * É o campo que manda no calendário. Atualiza na hora e desfaz se o servidor recusar.
 */
export function EditorVencimento({ tarefaId, prazo, horario = null, concluida, hoje }: { tarefaId: string; prazo: string | null; horario?: string | null; concluida: boolean; hoje: string }) {
  const [aberto, setAberto] = useState(false)
  const [exibido, definirExibido] = useOptimistic({ prazo, horario })
  const [, iniciar] = useTransition()

  const salvar = (novoPrazo: string | null, novoHorario: string | null, fechar = true) => {
    if (fechar) setAberto(false)
    iniciar(async () => {
      definirExibido({ prazo: novoPrazo, horario: novoPrazo ? novoHorario : null })
      avisar(await atualizarTarefaAcao(tarefaId, { prazo: novoPrazo, horario: novoPrazo ? novoHorario : null }))
    })
  }

  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger aria-label={exibido.prazo ? `Vencimento ${formatarPrazo(exibido.prazo, exibido.horario, { ano: true })}. Alterar` : 'Definir vencimento'} title="Alterar vencimento" className="min-w-8 rounded px-1 py-0.5 text-left tabular-nums outline-none hover:bg-hover focus-visible:ring-1 focus-visible:ring-foco">
        <Prazo prazo={exibido.prazo} horario={exibido.horario} concluida={concluida} hoje={hoje} />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 space-y-2 p-3">
        <input type="date" aria-label="Vencimento" autoFocus defaultValue={exibido.prazo ?? ''} onChange={(e) => e.target.value && salvar(e.target.value, exibido.horario, false)} className={`${campo} h-9 py-0`} />
        <label className="flex items-center gap-2 text-legenda text-texto-2">
          Horário <span className="text-texto-3">(opcional)</span>
          <input type="time" aria-label="Horário do vencimento" disabled={!exibido.prazo} value={exibido.horario ?? ''} onChange={(e) => exibido.prazo && salvar(exibido.prazo, e.target.value || null, false)} className={`${campo} h-8 w-28 py-0`} />
          {exibido.horario && <button type="button" onClick={() => exibido.prazo && salvar(exibido.prazo, null, false)} className={`${botaoFantasma} h-7 px-2 text-legenda`}>Sem horário</button>}
        </label>
        <div className="flex flex-wrap gap-1.5">
          <button type="button" onClick={() => salvar(hoje, exibido.horario)} className={`${botaoSecundario} h-7 px-2.5 text-legenda`}>Hoje</button>
          <button type="button" onClick={() => salvar(somarDias(hoje, 1), exibido.horario)} className={`${botaoSecundario} h-7 px-2.5 text-legenda`}>Amanhã</button>
          {exibido.prazo && <button type="button" onClick={() => salvar(null, null)} className={`${botaoFantasma} h-7 px-2.5 text-legenda`}>Limpar</button>}
        </div>
      </PopoverContent>
    </Popover>
  )
}
