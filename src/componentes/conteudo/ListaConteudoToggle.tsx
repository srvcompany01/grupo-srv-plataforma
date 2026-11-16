'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { definirListaConteudoAcao } from '@/app/(app)/conteudo/acoes'
import { useConfirmar } from '@/componentes/ConfirmarProvider'
import { avisar } from '@/componentes/tarefas/avisar'

/** Liga/desliga "Subtarefas são posts" na lista (só quem gerencia a lista vê o botão). */
export function ListaConteudoToggle({ listaId, ligado }: { listaId: string; ligado: boolean }) {
  const router = useRouter()
  const confirmar = useConfirmar()
  const [pendente, iniciar] = useTransition()
  const alternar = async () => {
    const ok = await confirmar(
      ligado
        ? { titulo: 'Desligar "subtarefas são posts"?', descricao: 'As subtarefas novas voltam a ser tarefas comuns. Os posts que já existem continuam como estão.', confirmar: 'Desligar' }
        : { titulo: 'Transformar em lista de conteúdo?', descricao: 'Toda subtarefa desta lista (as que já existem e as novas) vira um post, com legenda, mídias, aprovação do cliente e agendamento. A tarefa-mãe continua tarefa comum.', confirmar: 'Ligar' },
    )
    if (!ok) return
    iniciar(async () => { if (avisar(await definirListaConteudoAcao(listaId, !ligado), true)) router.refresh() })
  }
  return (
    <label className="flex shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap text-[13px] text-texto-2">
      <button type="button" role="switch" aria-checked={ligado} onClick={alternar} disabled={pendente} title={ligado ? 'As subtarefas desta lista são posts (clique para desligar)' : 'Fazer as subtarefas desta lista virarem posts'} style={{ width: 28, height: 16, flex: 'none', borderRadius: 8, background: ligado ? 'var(--primary)' : 'var(--border-strong)', border: 0, position: 'relative', padding: 0, cursor: 'pointer', transition: 'background 150ms' }}>
        <span style={{ position: 'absolute', top: 2, left: ligado ? 14 : 2, width: 12, height: 12, borderRadius: '50%', background: 'var(--bg)', transition: 'left 150ms' }} />
      </button>
      Subtarefas são posts
    </label>
  )
}
