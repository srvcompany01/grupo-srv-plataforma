'use client'

import { Clapperboard } from 'lucide-react'
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
    <button type="button" onClick={alternar} disabled={pendente} aria-pressed={ligado} title={ligado ? 'As subtarefas desta lista são posts (clique para desligar)' : 'Fazer as subtarefas desta lista virarem posts'} className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-rotulo font-medium transition ${ligado ? 'border-petroleo bg-petroleo/10 text-petroleo' : 'border-borda text-texto-2 hover:bg-hover'}`}>
      <Clapperboard className="h-3.5 w-3.5" /> {ligado ? 'Subtarefas são posts' : 'Lista de conteúdo'}
    </button>
  )
}
