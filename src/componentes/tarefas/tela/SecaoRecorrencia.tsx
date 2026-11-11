'use client'

import { Repeat } from 'lucide-react'
import { useState, useTransition } from 'react'
import { definirRecorrenciaAcao } from '@/app/(app)/tarefas/acoes'
import { descreverRecorrencia, FREQUENCIAS, type Frequencia, type Recorrencia } from '@/dominio/recorrencia'
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
    <div>
      <div>
        <Repeat />
        {regra ? (
          <span>
            {descreverRecorrencia(regra)}
            {!regra.ativa && <span> (pausada)</span>}
            <span> · {regra.geradas} {regra.geradas === 1 ? 'cópia criada' : 'cópias criadas'}</span>
          </span>
        ) : (
          <span>Não se repete</span>
        )}
        <button type="button" onClick={() => setAberto((a) => !a)}>{regra ? 'Editar' : 'Repetir…'}</button>
      </div>
      {aberto && (
        <div>
          <label>
            <span>A cada</span>
            <span>
              <input type="number" min={1} max={365} value={cada} onChange={(e) => setCada(Number(e.target.value))} />
              <select value={frequencia} onChange={(e) => setFrequencia(e.target.value as Frequencia)}>
                {FREQUENCIAS.map((f) => <option key={f.valor} value={f.valor}>{cada === 1 ? f.singular : f.plural}</option>)}
              </select>
            </span>
          </label>
          {!regra && (
            <label>
              <span>Primeiro vencimento</span>
              <input type="date" value={primeiroPrazo} onChange={(e) => setPrimeiroPrazo(e.target.value)} />
            </label>
          )}
          <label>
            <span>Criar com (dias de antecedência)</span>
            <input type="number" min={0} max={60} value={antecedencia} onChange={(e) => setAntecedencia(Number(e.target.value))} />
          </label>
          <button type="button" disabled={pendente} onClick={() => salvar(true)}>{regra && !regra.ativa ? 'Salvar e retomar' : 'Salvar'}</button>
          {regra?.ativa && <button type="button" disabled={pendente} onClick={() => salvar(false)}>Pausar</button>}
          {regra && <button type="button" disabled={pendente} onClick={remover}>Remover</button>}
        </div>
      )}
    </div>
  )
}
