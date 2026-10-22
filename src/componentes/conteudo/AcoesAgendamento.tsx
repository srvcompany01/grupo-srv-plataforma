'use client'

import { CalendarClock, ExternalLink, MoreHorizontal, RotateCcw, XCircle, Zap } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { agendarPostAcao, cancelarAgendamentoAcao, publicarAgoraAcao } from '@/app/(app)/conteudo/acoes'
import { useConfirmar } from '@/componentes/ConfirmarProvider'
import { avisar } from '@/componentes/tarefas/avisar'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/componentes/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/componentes/ui/dropdown-menu'
import { dataLocal, horaLocal } from '@/dominio/agenda'
import { ROTULO_ALVO, type Alvo, type ModoPublicacao, type StatusPublicacao } from '@/dominio/publicacao'
import { botaoFantasma, botaoPrimario, campo, rotulo } from '@/lib/ui'

type Props = { id: string; em: string | null; alvos: Alvo[]; modo: ModoPublicacao; status: StatusPublicacao; hoje: string }

/** Menu de cada post na fila: reagendar, publicar agora, tentar de novo e cancelar. */
export function AcoesAgendamento({ id, em, alvos, modo, status, hoje }: Props) {
  const router = useRouter()
  const confirmar = useConfirmar()
  const [pendente, iniciar] = useTransition()
  const [reagendar, setReagendar] = useState(false)
  const [data, setData] = useState(em ? dataLocal(em) : hoje)
  const [hora, setHora] = useState(em ? horaLocal(em) : '18:00')
  const [redes, setRedes] = useState<Alvo[]>(alvos.length ? alvos : ['instagram'])
  const publicado = status === 'publicado'

  const rodar = (fn: () => Promise<{ ok?: string; erro?: string } | null>, depois?: () => void) =>
    iniciar(async () => {
      if (avisar(await fn(), true)) {
        depois?.()
        router.refresh()
      }
    })
  const salvarHorario = () => rodar(() => agendarPostAcao(id, { data, hora, alvos: redes, modo }), () => setReagendar(false))
  const tentarDeNovo = () => {
    const quando = em && Date.parse(em) > Date.now() ? new Date(em) : new Date(Date.now() + 60_000)
    rodar(() => agendarPostAcao(id, { data: dataLocal(quando.toISOString()), hora: horaLocal(quando.toISOString()), alvos: redes, modo }))
  }
  const agora = async () => {
    if (!(await confirmar({ titulo: 'Publicar agora?', descricao: `Sai já em ${redes.map((a) => ROTULO_ALVO[a]).join(' e ')}, sem esperar o horário nem a aprovação do cliente.`, confirmar: 'Publicar agora' }))) return
    rodar(() => publicarAgoraAcao(id, redes))
  }
  const cancelar = async () => {
    if (!(await confirmar({ titulo: 'Cancelar este agendamento?', descricao: 'O post continua salvo; ele só sai da fila de publicação.', confirmar: 'Cancelar agendamento', perigo: true }))) return
    rodar(() => cancelarAgendamentoAcao(id))
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger aria-label="Ações do post" disabled={pendente} className="rounded-md p-1.5 text-texto-3 hover:bg-hover hover:text-texto disabled:opacity-50">
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem asChild><Link href={`/tarefas/${id}`}><ExternalLink className="h-4 w-4" /> Abrir post</Link></DropdownMenuItem>
          {!publicado && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setReagendar(true)}><CalendarClock className="h-4 w-4" /> Reagendar</DropdownMenuItem>
              {status === 'falhou' && <DropdownMenuItem onSelect={tentarDeNovo}><RotateCcw className="h-4 w-4" /> Tentar de novo</DropdownMenuItem>}
              <DropdownMenuItem onSelect={() => void agora()}><Zap className="h-4 w-4" /> Publicar agora</DropdownMenuItem>
              {status !== 'nao_agendado' && status !== 'publicando' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => void cancelar()} className="text-perigo"><XCircle className="h-4 w-4" /> Cancelar agendamento</DropdownMenuItem>
                </>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={reagendar} onOpenChange={setReagendar}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Reagendar</DialogTitle>
            <DialogDescription>{modo === 'aprovacao' ? 'Continua esperando a aprovação do cliente (se ainda não aprovou).' : 'Publica no novo horário, sem aprovação.'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <label className="space-y-1"><span className={rotulo}>Dia</span><input type="date" className={`${campo} h-9`} value={data} onChange={(e) => setData(e.target.value)} /></label>
              <label className="space-y-1"><span className={rotulo}>Hora</span><input type="time" className={`${campo} h-9`} value={hora} onChange={(e) => setHora(e.target.value)} /></label>
            </div>
            <div className="flex gap-4">
              {(['instagram', 'facebook'] as const).map((a) => (
                <label key={a} className="flex items-center gap-1.5 text-rotulo"><input type="checkbox" checked={redes.includes(a)} onChange={() => setRedes((v) => (v.includes(a) ? v.filter((x) => x !== a) : [...v, a]))} /> {ROTULO_ALVO[a]}</label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className={botaoFantasma} onClick={() => setReagendar(false)}>Voltar</button>
            <button type="button" className={botaoPrimario} disabled={pendente || !redes.length} onClick={salvarHorario}>Salvar novo horário</button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
