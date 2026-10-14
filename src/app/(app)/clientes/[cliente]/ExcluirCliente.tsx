'use client'

import { Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { useConfirmar } from '@/componentes/ConfirmarProvider'
import { avisar } from '@/componentes/tarefas/avisar'
import { excluirCliente } from '../acoes'

/** Exclusão definitiva do cliente. Só aparece para administradores; o banco recusa se ainda houver itens ligados. */
export function ExcluirCliente({ clienteId, nome }: { clienteId: string; nome: string }) {
  const router = useRouter()
  const confirmar = useConfirmar()
  const [pendente, iniciar] = useTransition()

  const excluir = async () => {
    if (!(await confirmar({ titulo: `Excluir "${nome}"?`, descricao: 'Isso apaga o cliente para sempre. Só é possível se ele não tiver listas, tarefas, documentos nem usuários. Para só tirá-lo de circulação, mude o status para "encerrado".', confirmar: 'Excluir cliente', perigo: true }))) return
    iniciar(async () => {
      if (avisar(await excluirCliente(clienteId), true)) router.push('/clientes')
    })
  }

  return (
    <section className="space-y-2 border-t border-borda pt-4">
      <h2 className="text-sm font-semibold text-perigo">Zona de perigo</h2>
      <button type="button" disabled={pendente} onClick={excluir} className="inline-flex items-center gap-1.5 rounded-lg border border-perigo/40 px-3 py-1.5 text-corpo font-medium text-perigo hover:bg-perigo/10 disabled:opacity-50">
        <Trash2 className="h-4 w-4" /> Excluir cliente
      </button>
    </section>
  )
}
