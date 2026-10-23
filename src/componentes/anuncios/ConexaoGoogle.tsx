'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { desconectarGoogleAgenciaAcao } from '@/app/(app)/anuncios/acoes'
import { useConfirmar } from '@/componentes/ConfirmarProvider'
import { avisar } from '@/componentes/tarefas/avisar'
import { botaoFantasma, botaoPrimario } from '@/lib/ui'

/** Conectar / desconectar a conta Google da agência (só admin). */
export function ConexaoGoogle({ email }: { email: string | null }) {
  const router = useRouter()
  const confirmar = useConfirmar()
  const [pendente, iniciar] = useTransition()
  const desconectar = async () => {
    if (!(await confirmar({ titulo: 'Desconectar o Google da agência?', descricao: 'Google Ads e Meu Negócio param de aparecer e os posts agendados para o Google falham até conectar de novo.', confirmar: 'Desconectar', perigo: true }))) return
    iniciar(async () => { if (avisar(await desconectarGoogleAgenciaAcao(), true)) router.refresh() })
  }
  return (
    <div className="flex flex-wrap gap-2">
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- rota de API que redireciona para o consentimento do Google */}
      <a href="/api/google/agencia" className={email ? botaoFantasma : botaoPrimario}>{email ? 'Reconectar' : 'Conectar Google da agência'}</a>
      {email && <button type="button" onClick={desconectar} disabled={pendente} className={botaoFantasma}>Desconectar</button>}
    </div>
  )
}
