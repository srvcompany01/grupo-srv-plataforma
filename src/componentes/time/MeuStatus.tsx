'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { definirStatusAcao } from '@/app/(app)/time/acoes'
import { avisar } from '@/componentes/tarefas/avisar'
import { EMOJI_STATUS_TIME, ROTULO_STATUS_TIME, STATUS_TIME, type StatusTime } from '@/dominio/time'
import { botaoPrimario, campo, rotulo } from '@/lib/ui'

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
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {STATUS_TIME.map((s) => (
          <button key={s} type="button" onClick={() => setEscolhido(s)} aria-pressed={escolhido === s} className={`rounded-full border px-3 py-1.5 text-rotulo ${escolhido === s ? 'border-petroleo bg-petroleo text-white' : 'border-borda bg-white text-texto hover:bg-hover'}`}>
            {EMOJI_STATUS_TIME[s]} {ROTULO_STATUS_TIME[s]}
          </button>
        ))}
      </div>
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_10rem_auto] sm:items-end">
        <label className="block space-y-1">
          <span className={rotulo}>Detalhe (opcional)</span>
          <input value={nota} onChange={(e) => setNota(e.target.value)} maxLength={80} placeholder="Ex.: almoço, gravação na Aurum, médico…" className={campo} />
        </label>
        <label className="block space-y-1">
          <span className={rotulo}>Volta em</span>
          <select value={prazo} onChange={(e) => setPrazo(Number(e.target.value))} disabled={escolhido === 'disponivel'} className={campo}>
            {PRAZOS.map((p) => <option key={p.min} value={p.min}>{p.rotulo}</option>)}
          </select>
        </label>
        <button type="button" onClick={salvar} disabled={pendente} className={botaoPrimario}>Salvar status</button>
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
