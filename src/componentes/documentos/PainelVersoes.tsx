'use client'

import type { Editor, JSONContent } from '@tiptap/react'
import { RotateCcw, X } from 'lucide-react'
import { useCallback, useEffect, useState, useTransition } from 'react'
import { listarVersoesAcao, salvarVersaoAcao } from '@/app/(app)/documentos/acoes'
import { avisar } from '@/componentes/tarefas/avisar'
import { useConfirmar } from '@/componentes/ConfirmarProvider'
import type { Json } from '@/infra/supabase/tipos'
import { botaoSecundario } from '@/lib/ui'

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
    <aside className="flex w-80 shrink-0 flex-col border-l border-borda bg-white">
      <div className="flex items-center justify-between border-b border-borda px-3 py-2">
        <h3 className="text-rotulo font-bold text-texto">Histórico de versões</h3>
        <button type="button" aria-label="Fechar" onClick={aoFechar} className="rounded p-1 text-texto-3 hover:bg-hover"><X className="h-4 w-4" /></button>
      </div>
      {podeEditar && (
        <div className="border-b border-borda p-3">
          <button type="button" className={`${botaoSecundario} w-full`} onClick={() => iniciar(async () => { avisar(await salvarVersaoAcao(paginaId, aoSalvar(), ydoc(), titulo), true); recarregar() })}>Salvar versão agora</button>
        </div>
      )}
      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
        {versoes.length === 0 && <p className="p-2 text-legenda text-texto-3">Nenhuma versão guardada ainda.</p>}
        {versoes.map((v) => (
          <div key={v.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-hover">
            <div className="min-w-0 flex-1">
              <p className="text-rotulo font-medium text-texto">{data.format(new Date(v.criadoEm))}</p>
              <p className="truncate text-legenda text-texto-3">{v.autor}</p>
            </div>
            {podeEditar && <button type="button" title="Restaurar" aria-label="Restaurar" onClick={() => restaurar(v)} className="rounded p-1 text-texto-3 hover:bg-white"><RotateCcw className="h-3.5 w-3.5" /></button>}
          </div>
        ))}
      </div>
    </aside>
  )
}
