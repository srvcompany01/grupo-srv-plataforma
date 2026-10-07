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
    <div className="mb-2 flex items-center gap-2 rounded-md border border-[#e2e2e4] bg-white px-2 py-1.5 text-[11px]">
      <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-rose-500" />
      <Link href={`/tarefas/${cronometro.tarefaId}`} className="min-w-0 flex-1" title={cronometro.tarefaTitulo}>
        <span className="block truncate font-medium text-[#292a2d]">{cronometro.tarefaTitulo || 'Tarefa'}</span>
        <span className="font-mono tabular-nums text-[#65676b]">{formatarRelogio(segundosDecorridos(cronometro.inicio, agora))}</span>
      </Link>
      <button
        disabled={pendente}
        onClick={() => iniciar(async () => void avisar(await pararCronometroAcao(), true))}
        aria-label="Parar cronômetro"
        title="Parar cronômetro"
        className="rounded p-1.5 text-rose-600 hover:bg-rose-50"
      >
        <Square className="h-3.5 w-3.5 fill-current" />
      </button>
    </div>
  )
}
