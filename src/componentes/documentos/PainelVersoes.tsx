'use client'

import type { Editor, JSONContent } from '@tiptap/react'
import { RotateCcw, X } from 'lucide-react'
import { useCallback, useEffect, useState, useTransition } from 'react'
import { listarVersoesAcao, salvarVersaoAcao } from '@/app/(app)/documentos/acoes'
import { avisar } from '@/componentes/tarefas/avisar'
import { useConfirmar } from '@/componentes/ConfirmarProvider'
import type { Json } from '@/infra/supabase/tipos'

type Versao = Awaited<ReturnType<typeof listarVersoesAcao>>[number]
const data = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

/** Histórico: guarda versões (automáticas a cada ~30 min de edição ou sob demanda) e restaura uma delas como uma edição nova. */
export function PainelVersoes({ paginaId, podeEditar, editor, titulo, aoFechar, aoSalvar, ydoc }: { paginaId: string; podeEditar: boolean; editor: Editor; titulo: string; aoFechar: () => void; aoSalvar: () => Json; ydoc: () => string }) {
  const [versoes, setVersoes] = useState<Versao[]>([])
  const [, iniciar] = useTransition()
  const confirmar = useConfirmar()
  const recarregar = useCallback(() => void listarVersoesAcao(paginaId).then(setVersoes), [paginaId])
  useEffect(recarregar, [recarregar])

  const restaurar = async (v: Versao) => {
    if (!(await confirmar({ titulo: 'Restaurar esta versão?', descricao: 'O texto atual é guardado como versão antes de trocar, e todos que estão editando veem a mudança.', confirmar: 'Restaurar' }))) return
    iniciar(async () => {
      await salvarVersaoAcao(paginaId, aoSalvar(), ydoc(), titulo)
      editor.commands.setContent((v.conteudo as JSONContent | null) ?? '')
      avisar({ ok: 'Versão restaurada.' }, true)
      recarregar()
    })
  }

  return (
    <aside>
      <div>
        <h3>Histórico de versões</h3>
        <button type="button" aria-label="Fechar" onClick={aoFechar}><X /></button>
      </div>
      {podeEditar && (
        <div>
          <button type="button" onClick={() => iniciar(async () => { avisar(await salvarVersaoAcao(paginaId, aoSalvar(), ydoc(), titulo), true); recarregar() })}>Salvar versão agora</button>
        </div>
      )}
      <div>
        {versoes.length === 0 && <p>Nenhuma versão guardada ainda.</p>}
        {versoes.map((v) => (
          <div key={v.id}>
            <div>
              <p>{data.format(new Date(v.criadoEm))}</p>
              <p>{v.autor}</p>
            </div>
            {podeEditar && <button type="button" title="Restaurar" aria-label="Restaurar" onClick={() => restaurar(v)}><RotateCcw /></button>}
          </div>
        ))}
      </div>
    </aside>
  )
}
