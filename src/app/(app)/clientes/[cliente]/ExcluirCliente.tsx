'use client'

import { Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { useConfirmar } from '@/componentes/ConfirmarProvider'
import { Modulo } from '@/componentes/Modulo'
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
    <Modulo icone={Trash2} titulo="Zona de perigo" descricao="Exclusão definitiva. Para só pausar, mude o status no cadastro." perigo>
      <button type="button" disabled={pendente} onClick={excluir}>
        <Trash2 /> Excluir cliente
      </button>
    </Modulo>
  )
}
