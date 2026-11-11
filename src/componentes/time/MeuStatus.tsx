'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { definirStatusAcao } from '@/app/(app)/time/acoes'
import { avisar } from '@/componentes/tarefas/avisar'
import { EMOJI_STATUS_TIME, ROTULO_STATUS_TIME, STATUS_TIME, type StatusTime } from '@/dominio/time'

const PRAZOS = [
  { min: 0, rotulo: 'Sem prazo' },
  { min: 15, rotulo: '15 min' },
  { min: 30, rotulo: '30 min' },
  { min: 60, rotulo: '1 hora' },
  { min: 120, rotulo: '2 horas' },
  { min: 240, rotulo: '4 horas' },
]

/** A pessoa diz o que está fazendo (intervalo, reunião, foco…); com prazo, volta sozinho a "Disponível". */
export function MeuStatus({ status, texto }: { status: StatusTime; texto: string }) {
  const router = useRouter()
  const [escolhido, setEscolhido] = useState(status)
  const [nota, setNota] = useState(texto)
  const [prazo, setPrazo] = useState(0)
  const [pendente, iniciar] = useTransition()
  const salvar = () =>
    iniciar(async () => {
      const ate = escolhido !== 'disponivel' && prazo ? new Date(Date.now() + prazo * 60_000).toISOString() : null
      if (avisar(await definirStatusAcao(escolhido, nota, ate), true)) router.refresh()
    })
  return (
    <div>
      <div>
        {STATUS_TIME.map((s) => (
          <button key={s} type="button" onClick={() => setEscolhido(s)} aria-pressed={escolhido === s}>
            {EMOJI_STATUS_TIME[s]} {ROTULO_STATUS_TIME[s]}
          </button>
        ))}
      </div>
      <div>
        <label>
          <span>Detalhe (opcional)</span>
          <input value={nota} onChange={(e) => setNota(e.target.value)} maxLength={80} placeholder="Ex.: almoço, gravação na Aurum, médico…" />
        </label>
        <label>
          <span>Volta em</span>
          <select value={prazo} onChange={(e) => setPrazo(Number(e.target.value))} disabled={escolhido === 'disponivel'}>
            {PRAZOS.map((p) => <option key={p.min} value={p.min}>{p.rotulo}</option>)}
          </select>
        </label>
        <button type="button" onClick={salvar} disabled={pendente}>Salvar status</button>
      </div>
    </div>
  )
}

/** Mantém a aba Time viva (quem está ativo, há quanto tempo) sem recarregar a página. */
export function AtualizarSozinho({ segundos = 60 }: { segundos?: number }) {
  const router = useRouter()
  useEffect(() => {
    const id = setInterval(() => { if (document.visibilityState === 'visible') router.refresh() }, segundos * 1000)
    return () => clearInterval(id)
  }, [router, segundos])
  return null
}
