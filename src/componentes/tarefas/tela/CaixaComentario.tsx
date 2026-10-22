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
        <div className="flex rounded-md bg-hover p-0.5 text-rotulo">
          <button type="button" onClick={() => setInterno(true)} className={`rounded px-2 py-0.5 ${interno ? 'bg-white shadow-sm' : 'text-texto-2'}`}>
            Interno
          </button>
          <button type="button" onClick={() => setInterno(false)} className={`rounded px-2 py-0.5 ${!interno ? 'bg-white text-sucesso-forte shadow-sm' : 'text-texto-2'}`}>
            Visível ao cliente
          </button>
        </div>
      }
    />
  )
}
