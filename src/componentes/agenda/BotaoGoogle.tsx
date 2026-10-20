'use client'

import { CalendarCheck2, CalendarPlus } from 'lucide-react'
import { useTransition } from 'react'
import { desconectarGoogleAcao } from '@/app/(app)/agenda/acoes'
import { useConfirmar } from '@/componentes/ConfirmarProvider'
import { avisar } from '@/componentes/tarefas/avisar'
import { botaoSecundario } from '@/lib/ui'

/** Conectar (OAuth em /api/google/conectar) ou desconectar o Google Agenda da pessoa logada. */
export function BotaoGoogle({ email }: { email: string | null }) {
  const [pendente, iniciar] = useTransition()
  const confirmar = useConfirmar()
  if (email === null) {
    // <a> comum, não <Link>: a rota redireciona para fora do app (consentimento do Google).
    // eslint-disable-next-line @next/next/no-html-link-for-pages
    return <a href="/api/google/conectar" className={botaoSecundario}><CalendarPlus className="h-3.5 w-3.5" /> Conectar Google Agenda</a>
  }
  // Confirma ANTES da transição (dentro dela o diálogo de confirmação não chega a aparecer).
  const desconectar = async () => {
    if (!(await confirmar({ titulo: 'Desconectar o Google Agenda?', descricao: 'Os compromissos da plataforma saem do seu Google e os eventos do Google deixam de aparecer aqui.', confirmar: 'Desconectar', perigo: true }))) return
    iniciar(async () => void avisar(await desconectarGoogleAcao(), true))
  }
  return (
    <button type="button" onClick={desconectar} disabled={pendente} className={botaoSecundario} title="Clique para desconectar">
      <CalendarCheck2 className="h-3.5 w-3.5 text-sucesso" /> <span className="max-w-44 truncate">{email || 'Google conectado'}</span>
    </button>
  )
}
