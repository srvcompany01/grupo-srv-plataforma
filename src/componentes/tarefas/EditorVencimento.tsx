'use client'

import { useOptimistic, useState, useTransition } from 'react'
import { atualizarTarefaAcao } from '@/app/(app)/tarefas/acoes'
import { Popover, PopoverContent, PopoverTrigger } from '@/componentes/ui/popover'
import { somarDias } from '@/dominio/filtros'
import { formatarPrazo } from '@/dominio/prazo'
import { avisar } from './avisar'

/** Vencimento só para leitura: dd/mm (dia da semana), com o horário quando existe; em vermelho quando atrasado e ainda não concluída. */
export function Prazo({ prazo, horario, concluida, hoje }: { prazo: string | null; horario?: string | null; concluida: boolean; hoje: string }) {
  if (!prazo) return <span>—</span>
  const atrasada = !concluida && prazo < hoje
  return <span>{formatarPrazo(prazo, horario)}</span>
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
      <PopoverTrigger aria-label={exibido.prazo ? `Vencimento ${formatarPrazo(exibido.prazo, exibido.horario, { ano: true })}. Alterar` : 'Definir vencimento'} title="Alterar vencimento">
        <Prazo prazo={exibido.prazo} horario={exibido.horario} concluida={concluida} hoje={hoje} />
      </PopoverTrigger>
      <PopoverContent align="start">
        <input type="date" aria-label="Vencimento" autoFocus defaultValue={exibido.prazo ?? ''} onChange={(e) => e.target.value && salvar(e.target.value, exibido.horario, false)} />
        <label>
          Horário <span>(opcional)</span>
          <input type="time" aria-label="Horário do vencimento" disabled={!exibido.prazo} value={exibido.horario ?? ''} onChange={(e) => exibido.prazo && salvar(exibido.prazo, e.target.value || null, false)} />
          {exibido.horario && <button type="button" onClick={() => exibido.prazo && salvar(exibido.prazo, null, false)}>Sem horário</button>}
        </label>
        <div>
          <button type="button" onClick={() => salvar(hoje, exibido.horario)}>Hoje</button>
          <button type="button" onClick={() => salvar(somarDias(hoje, 1), exibido.horario)}>Amanhã</button>
          {exibido.prazo && <button type="button" onClick={() => salvar(null, null)}>Limpar</button>}
        </div>
      </PopoverContent>
    </Popover>
  )
}
