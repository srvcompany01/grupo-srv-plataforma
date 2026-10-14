'use client'

import { Repeat } from 'lucide-react'
import { useState, useTransition } from 'react'
import { definirRecorrenciaAcao } from '@/app/(app)/tarefas/acoes'
import { descreverRecorrencia, FREQUENCIAS, type Frequencia, type Recorrencia } from '@/dominio/recorrencia'
import { botaoFantasma, botaoSecundario, campo } from '@/lib/ui'
import { avisar } from '../avisar'

/** "Repetir": a tarefa vira modelo e o sistema cria uma cópia a cada período (cron diário). */
export function SecaoRecorrencia({ tarefaId, prazo, hoje, regra }: { tarefaId: string; prazo: string | null; hoje: string; regra: Recorrencia | null }) {
  const [aberto, setAberto] = useState(false)
  const [frequencia, setFrequencia] = useState<Frequencia>(regra?.frequencia ?? 'weekly')
  const [cada, setCada] = useState(regra?.cada ?? 1)
  const [antecedencia, setAntecedencia] = useState(regra?.antecedencia ?? 0)
  const [primeiroPrazo, setPrimeiroPrazo] = useState(regra?.primeiroPrazo ?? prazo ?? hoje)
  const [pendente, iniciar] = useTransition()

  const salvar = (ativa: boolean) =>
    iniciar(async () => {
      if (avisar(await definirRecorrenciaAcao(tarefaId, { frequencia, cada, antecedencia, ativa, primeiroPrazo }), true)) setAberto(false)
    })
  const remover = () =>
    iniciar(async () => {
      if (avisar(await definirRecorrenciaAcao(tarefaId, null), true)) setAberto(false)
    })

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2 text-corpo">
        <Repeat className="h-4 w-4 text-texto-3" />
        {regra ? (
          <span>
            {descreverRecorrencia(regra)}
            {!regra.ativa && <span className="text-texto-3"> (pausada)</span>}
            <span className="text-texto-3"> · {regra.geradas} {regra.geradas === 1 ? 'cópia criada' : 'cópias criadas'}</span>
          </span>
        ) : (
          <span className="text-texto-3">Não se repete</span>
        )}
        <button type="button" className={botaoFantasma} onClick={() => setAberto((a) => !a)}>{regra ? 'Editar' : 'Repetir…'}</button>
      </div>
      {aberto && (
        <div className="flex flex-wrap items-end gap-3 rounded-lg border border-borda p-3 text-corpo">
          <label className="space-y-1">
            <span className="block text-texto-2">A cada</span>
            <span className="flex items-center gap-1.5">
              <input type="number" min={1} max={365} value={cada} onChange={(e) => setCada(Number(e.target.value))} className={`${campo} h-8 w-16 py-0`} />
              <select value={frequencia} onChange={(e) => setFrequencia(e.target.value as Frequencia)} className={`${campo} h-8 w-28 py-0`}>
                {FREQUENCIAS.map((f) => <option key={f.valor} value={f.valor}>{cada === 1 ? f.singular : f.plural}</option>)}
              </select>
            </span>
          </label>
          {!regra && (
            <label className="space-y-1">
              <span className="block text-texto-2">Primeiro vencimento</span>
              <input type="date" value={primeiroPrazo} onChange={(e) => setPrimeiroPrazo(e.target.value)} className={`${campo} h-8 w-36 py-0`} />
            </label>
          )}
          <label className="space-y-1">
            <span className="block text-texto-2">Criar com (dias de antecedência)</span>
            <input type="number" min={0} max={60} value={antecedencia} onChange={(e) => setAntecedencia(Number(e.target.value))} className={`${campo} h-8 w-20 py-0`} />
          </label>
          <button type="button" disabled={pendente} className={botaoSecundario} onClick={() => salvar(true)}>{regra && !regra.ativa ? 'Salvar e retomar' : 'Salvar'}</button>
          {regra?.ativa && <button type="button" disabled={pendente} className={botaoFantasma} onClick={() => salvar(false)}>Pausar</button>}
          {regra && <button type="button" disabled={pendente} className={botaoFantasma} onClick={remover}>Remover</button>}
        </div>
      )}
    </div>
  )
}
