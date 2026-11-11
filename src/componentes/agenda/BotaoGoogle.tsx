'use client'

import { CalendarCheck2, CalendarPlus } from 'lucide-react'
import { useTransition } from 'react'
import { desconectarGoogleAcao } from '@/app/(app)/agenda/acoes'
import { useConfirmar } from '@/componentes/ConfirmarProvider'
import { avisar } from '@/componentes/tarefas/avisar'

/** Conectar (OAuth em /api/google/conectar) ou desconectar o Google Agenda da pessoa logada. */
export function BotaoGoogle({ email }: { email: string | null }) {
  const [pendente, iniciar] = useTransition()
  const confirmar = useConfirmar()
  if (email === null) {
    // <a> comum, não <Link>: a rota redireciona para fora do app (consentimento do Google).
    // eslint-disable-next-line @next/next/no-html-link-for-pages
    return <a href="/api/google/conectar"><CalendarPlus /> Conectar Google Agenda</a>
  }
  // Confirma ANTES da transição (dentro dela o diálogo de confirmação não chega a aparecer).
  const desconectar = async () => {
    if (!(await confirmar({ titulo: 'Desconectar o Google Agenda?', descricao: 'Os compromissos da plataforma saem do seu Google e os eventos do Google deixam de aparecer aqui.', confirmar: 'Desconectar', perigo: true }))) return
    iniciar(async () => void avisar(await desconectarGoogleAcao(), true))
  }
  return (
    <button type="button" onClick={desconectar} disabled={pendente} title="Clique para desconectar">
      <CalendarCheck2 /> <span>{email || 'Google conectado'}</span>
    </button>
  )
}
