'use client'

import { useConfirmar } from '@/componentes/ConfirmarProvider'
import { Pencil, Play, Square, Trash2 } from 'lucide-react'
import { useEffect, useState, useTransition } from 'react'
import { apagarTempoAcao, editarTempoAcao, iniciarCronometroAcao, lancarTempoAcao, pararCronometroAcao } from '@/app/(app)/tarefas/acoes'
import { Popover, PopoverContent, PopoverTrigger } from '@/componentes/ui/popover'
import { formatarDuracao, formatarRelogio } from '@/dominio/formatar'
import { segundosDecorridos, totalTempo } from '@/dominio/tempo'
import { botaoFantasma, botaoPrimario, campo } from '@/lib/ui'
import type { CronometroAtivo, RegistroTempo } from '@/servicos/tempo'
import { avisar } from '../avisar'

/** `YYYY-MM-DD` no fuso do navegador. */
function hojeLocal(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

function dataCurta(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function LinhaRegistro({ r, agora, podeMexer }: { r: RegistroTempo; agora: number; podeMexer: boolean }) {
  const [editando, setEditando] = useState(false)
  const [minutos, setMinutos] = useState(String(Math.max(1, Math.round((r.segundos ?? 0) / 60))))
  const [nota, setNota] = useState(r.nota ?? '')
  const [pendente, iniciar] = useTransition()
  const confirmar = useConfirmar()
  const rodando = r.fim === null
  const segundos = r.segundos ?? segundosDecorridos(r.inicio, agora)

  if (editando) {
    return (
      <li className="space-y-1 py-2">
        <div className="flex gap-1">
          <input type="number" min={1} max={1440} value={minutos} onChange={(e) => setMinutos(e.target.value)} aria-label="Minutos" className={`${campo} w-20`} />
          <input value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Nota" aria-label="Nota" className={`${campo} min-w-0 flex-1`} />
        </div>
        <div className="flex gap-1">
          <button
            disabled={pendente}
            onClick={() =>
              iniciar(async () => {
                if (avisar(await editarTempoAcao(r.id, Number(minutos), nota), true)) setEditando(false)
              })
            }
            className={botaoPrimario}
          >
            Salvar
          </button>
          <button onClick={() => setEditando(false)} className={botaoFantasma}>
            Cancelar
          </button>
        </div>
      </li>
    )
  }
  return (
    <li className="flex items-start gap-2 py-2 text-rotulo">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{r.usuarioNome}</p>
        <p className="text-texto-3">
          {dataCurta(r.inicio)}
          {r.nota ? ` · ${r.nota}` : ''}
        </p>
      </div>
      <span className="shrink-0 font-mono tabular-nums">{rodando ? formatarRelogio(segundos) : formatarDuracao(segundos)}</span>
      {podeMexer && !rodando && (
        <span className="flex shrink-0 gap-0.5">
          <button onClick={() => setEditando(true)} aria-label="Editar registro" className="rounded p-1 text-texto-3 hover:bg-hover hover:text-texto">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            disabled={pendente}
            onClick={async () => (await confirmar({ titulo: 'Apagar este registro de tempo?', confirmar: 'Apagar', perigo: true })) && iniciar(async () => void avisar(await apagarTempoAcao(r.id), true))}
            aria-label="Apagar registro"
            className="rounded p-1 text-texto-3 hover:bg-hover hover:text-perigo"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </span>
      )}
    </li>
  )
}

function FormularioLancar({ tarefaId }: { tarefaId: string }) {
  const [data, setData] = useState(hojeLocal)
  const [horas, setHoras] = useState('')
  const [minutos, setMinutos] = useState('')
  const [nota, setNota] = useState('')
  const [pendente, iniciar] = useTransition()
  const total = (Number(horas) || 0) * 60 + (Number(minutos) || 0)
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        iniciar(async () => {
          if (avisar(await lancarTempoAcao(tarefaId, data, total, nota), true)) {
            setHoras('')
            setMinutos('')
            setNota('')
          }
        })
      }}
      className="space-y-1.5"
    >
      <p className="text-rotulo font-semibold">Lançar tempo</p>
      <input type="date" value={data} max={hojeLocal()} onChange={(e) => setData(e.target.value)} aria-label="Data" className={campo} />
      <div className="flex items-center gap-1 text-rotulo">
        <input type="number" min={0} max={24} value={horas} onChange={(e) => setHoras(e.target.value)} placeholder="0" aria-label="Horas" className={`${campo} w-16`} />
        <span>h</span>
        <input type="number" min={0} max={59} value={minutos} onChange={(e) => setMinutos(e.target.value)} placeholder="0" aria-label="Minutos" className={`${campo} w-16`} />
        <span>min</span>
      </div>
      <input value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Nota (opcional)" aria-label="Nota" className={campo} />
      <button disabled={pendente || total < 1 || total > 1440} className={botaoPrimario}>
        Lançar
      </button>
    </form>
  )
}

export function RastrearTempo({
  tarefaId,
  registros,
  cronometro,
  euId,
  podeGerir,
}: {
  tarefaId: string
  registros: RegistroTempo[]
  cronometro: CronometroAtivo | null
  euId: string
  podeGerir: boolean
}) {
  const [agora, setAgora] = useState(() => Date.now())
  const [pendente, iniciar] = useTransition()
  const nestaTarefa = cronometro?.tarefaId === tarefaId
  const algumAberto = nestaTarefa || registros.some((r) => r.fim === null)

  // Relógio que anda de segundo em segundo enquanto houver cronômetro aberto; limpo ao desmontar.
  useEffect(() => {
    if (!algumAberto) return
    const id = setInterval(() => setAgora(Date.now()), 1000)
    return () => clearInterval(id)
  }, [algumAberto])

  const total = totalTempo(registros, agora)
  return (
    <div className="flex items-center gap-2">
      {nestaTarefa ? (
        <button
          disabled={pendente}
          onClick={() => iniciar(async () => void avisar(await pararCronometroAcao(), true))}
          className="inline-flex items-center gap-1.5 rounded-md bg-perigo-fundo px-2 py-1 text-rotulo font-medium text-perigo-forte hover:bg-perigo-fundo"
          aria-label="Parar cronômetro"
        >
          <Square className="h-3.5 w-3.5 fill-current" />
          <span className="font-mono tabular-nums">{formatarRelogio(segundosDecorridos(cronometro.inicio, agora))}</span>
        </button>
      ) : (
        <button
          disabled={pendente}
          onClick={() => iniciar(async () => void avisar(await iniciarCronometroAcao(tarefaId), true))}
          className="inline-flex items-center gap-1.5 rounded-md bg-hover px-2 py-1 text-rotulo font-medium hover:bg-borda"
        >
          <Play className="h-3.5 w-3.5 fill-current" /> Start
        </button>
      )}
      <Popover>
        <PopoverTrigger className="rounded-md px-1.5 py-1 text-rotulo text-texto-2 hover:bg-hover" aria-label="Ver registros de tempo">
          {total > 0 ? formatarDuracao(total) : 'Sem tempo'}
        </PopoverTrigger>
        <PopoverContent align="start" className="w-80 gap-3">
          <FormularioLancar tarefaId={tarefaId} />
          <div>
            <p className="text-rotulo font-semibold">Registros</p>
            {registros.length === 0 ? (
              <p className="py-2 text-rotulo text-texto-3">Nenhum registro ainda.</p>
            ) : (
              <ul className="max-h-60 divide-y divide-borda overflow-y-auto">
                {registros.map((r) => (
                  <LinhaRegistro key={r.id} r={r} agora={agora} podeMexer={r.usuarioId === euId || podeGerir} />
                ))}
              </ul>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
