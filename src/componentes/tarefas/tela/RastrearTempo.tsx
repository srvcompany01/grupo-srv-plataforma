'use client'

import { useConfirmar } from '@/componentes/ConfirmarProvider'
import { Pencil, Play, Square, Trash2 } from 'lucide-react'
import { useEffect, useState, useTransition } from 'react'
import { apagarTempoAcao, editarTempoAcao, iniciarCronometroAcao, lancarTempoAcao, pararCronometroAcao } from '@/app/(app)/tarefas/acoes'
import { Popover, PopoverContent, PopoverTrigger } from '@/componentes/ui/popover'
import { formatarDuracao, formatarRelogio } from '@/dominio/formatar'
import { segundosDecorridos, totalTempo } from '@/dominio/tempo'
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
      <li>
        <div>
          <input type="number" min={1} max={1440} value={minutos} onChange={(e) => setMinutos(e.target.value)} aria-label="Minutos" />
          <input value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Nota" aria-label="Nota" />
        </div>
        <div>
          <button
            disabled={pendente}
            onClick={() =>
              iniciar(async () => {
                if (avisar(await editarTempoAcao(r.id, Number(minutos), nota), true)) setEditando(false)
              })
            }
          >
            Salvar
          </button>
          <button onClick={() => setEditando(false)}>
            Cancelar
          </button>
        </div>
      </li>
    )
  }
  return (
    <li>
      <div>
        <p>{r.usuarioNome}</p>
        <p>
          {dataCurta(r.inicio)}
          {r.nota ? ` · ${r.nota}` : ''}
        </p>
      </div>
      <span>{rodando ? formatarRelogio(segundos) : formatarDuracao(segundos)}</span>
      {podeMexer && !rodando && (
        <span>
          <button onClick={() => setEditando(true)} aria-label="Editar registro">
            <Pencil />
          </button>
          <button
            disabled={pendente}
            onClick={async () => (await confirmar({ titulo: 'Apagar este registro de tempo?', confirmar: 'Apagar', perigo: true })) && iniciar(async () => void avisar(await apagarTempoAcao(r.id), true))}
            aria-label="Apagar registro"
          >
            <Trash2 />
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
    >
      <p>Lançar tempo</p>
      <input type="date" value={data} max={hojeLocal()} onChange={(e) => setData(e.target.value)} aria-label="Data" />
      <div>
        <input type="number" min={0} max={24} value={horas} onChange={(e) => setHoras(e.target.value)} placeholder="0" aria-label="Horas" />
        <span>h</span>
        <input type="number" min={0} max={59} value={minutos} onChange={(e) => setMinutos(e.target.value)} placeholder="0" aria-label="Minutos" />
        <span>min</span>
      </div>
      <input value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Nota (opcional)" aria-label="Nota" />
      <button disabled={pendente || total < 1 || total > 1440}>
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
    <div>
      {nestaTarefa ? (
        <button
          disabled={pendente}
          onClick={() => iniciar(async () => void avisar(await pararCronometroAcao(), true))}
          aria-label="Parar cronômetro"
        >
          <Square />
          <span>{formatarRelogio(segundosDecorridos(cronometro.inicio, agora))}</span>
        </button>
      ) : (
        <button
          disabled={pendente}
          onClick={() => iniciar(async () => void avisar(await iniciarCronometroAcao(tarefaId), true))}
        >
          <Play /> Start
        </button>
      )}
      <Popover>
        <PopoverTrigger aria-label="Ver registros de tempo">
          {total > 0 ? formatarDuracao(total) : 'Sem tempo'}
        </PopoverTrigger>
        <PopoverContent align="start">
          <FormularioLancar tarefaId={tarefaId} />
          <div>
            <p>Registros</p>
            {registros.length === 0 ? (
              <p>Nenhum registro ainda.</p>
            ) : (
              <ul>
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
