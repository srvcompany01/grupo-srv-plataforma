'use client'

import { useState } from 'react'
import { comentarAcao, prepararEnvioAnexoAcao } from '@/app/(app)/tarefas/acoes'
import { CaixaMensagem } from '@/componentes/mensagens/CaixaMensagem'
import { avisar } from '../avisar'
import type { PessoaMencao } from './SeletorMencao'

/** Comentário da tarefa: a caixa de mensagem com a escolha "interno / visível ao cliente". */
export function CaixaComentario({ tarefaId, pessoas }: { tarefaId: string; pessoas: PessoaMencao[] }) {
  const [interno, setInterno] = useState(true)
  return (
    <CaixaMensagem
      pessoas={pessoas}
      preparar={(a) => prepararEnvioAnexoAcao(tarefaId, a)}
      aoEnviar={async (texto, mencoes, anexos) => avisar(await comentarAcao(tarefaId, texto, interno, mencoes, anexos))}
      placeholder="Escreva um comentário…"
      rotulo="Comentário"
      extras={
        <div>
          <button type="button" onClick={() => setInterno(true)}>
            Interno
          </button>
          <button type="button" onClick={() => setInterno(false)}>
            Visível ao cliente
          </button>
        </div>
      }
    />
  )
}
