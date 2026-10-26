'use client'

import { useState, useTransition } from 'react'
import { avisar } from '@/componentes/tarefas/avisar'
import { botaoPrimario, campo, rotulo } from '@/lib/ui'
import type { Horario } from '@/dominio/atendimento'
import { salvarHorarioAcao } from './acoes'

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const emHora = (min: number) => `${String(Math.floor(min / 60) % 24).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`
const emMinutos = (h: string) => { const [a, b] = h.split(':').map(Number); return a * 60 + b }

/** Expediente do cliente: o tempo de resposta e os avisos contam só dentro dele. */
export function HorarioAtendimento({ clienteId, horario, podeEditar }: { clienteId: string; horario: Horario; podeEditar: boolean }) {
  const [abre, setAbre] = useState(emHora(horario.abre))
  const [fecha, setFecha] = useState(horario.fecha >= 1440 ? '23:59' : emHora(horario.fecha))
  const [dias, setDias] = useState(horario.dias)
  const [pendente, iniciar] = useTransition()
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        iniciar(async () => { avisar(await salvarHorarioAcao(clienteId, { abre: emMinutos(abre), fecha: emMinutos(fecha), dias }), true) })
      }}
    >
      <div className="flex flex-wrap items-end gap-3">
        <label className="space-y-1"><span className={rotulo}>Abre</span><input type="time" required disabled={!podeEditar} className={campo} value={abre} onChange={(e) => setAbre(e.target.value)} /></label>
        <label className="space-y-1"><span className={rotulo}>Fecha</span><input type="time" required disabled={!podeEditar} className={campo} value={fecha} onChange={(e) => setFecha(e.target.value)} /></label>
        <div className="flex flex-wrap gap-1.5">
          {DIAS.map((d, i) => (
            <label key={d} className={`cursor-pointer rounded-lg border px-2.5 py-1.5 text-rotulo ${dias.includes(i) ? 'border-petroleo bg-hover font-semibold' : 'border-borda text-texto-3'}`}>
              <input type="checkbox" className="sr-only" disabled={!podeEditar} checked={dias.includes(i)} onChange={() => setDias(dias.includes(i) ? dias.filter((x) => x !== i) : [...dias, i])} />{d}
            </label>
          ))}
        </div>
        {podeEditar && <button type="submit" disabled={pendente} className={botaoPrimario}>Salvar horário</button>}
      </div>
    </form>
  )
}
