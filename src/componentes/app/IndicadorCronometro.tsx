'use client'

import { Square } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState, useTransition } from 'react'
import { pararCronometroAcao } from '@/app/(app)/tarefas/acoes'
import { avisar } from '@/componentes/tarefas/avisar'
import { formatarRelogio } from '@/dominio/formatar'
import { segundosDecorridos } from '@/dominio/tempo'
import type { CronometroAtivo } from '@/servicos/tempo'

export function IndicadorCronometro({ cronometro }: { cronometro: CronometroAtivo | null }) {
  const [agora, setAgora] = useState(() => Date.now())
  const [pendente, iniciar] = useTransition()
  const ativo = cronometro !== null
  useEffect(() => {
    if (!ativo) return
    const id = setInterval(() => setAgora(Date.now()), 1000)
    return () => clearInterval(id)
  }, [ativo])
  if (!cronometro) return null
  return (
    <div>
      <span />
      <Link href={`/tarefas/${cronometro.tarefaId}`} title={cronometro.tarefaTitulo}>
        <span>{cronometro.tarefaTitulo || 'Tarefa'}</span>
        <span>{formatarRelogio(segundosDecorridos(cronometro.inicio, agora))}</span>
      </Link>
      <button
        disabled={pendente}
        onClick={() => iniciar(async () => void avisar(await pararCronometroAcao(), true))}
        aria-label="Parar cronômetro"
        title="Parar cronômetro"
      >
        <Square />
      </button>
    </div>
  )
}
