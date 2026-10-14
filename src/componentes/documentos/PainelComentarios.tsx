'use client'

import { Check, Trash2, X } from 'lucide-react'
import { useCallback, useEffect, useState, useTransition } from 'react'
import { comentarAcao, excluirComentarioAcao, listarComentariosAcao, resolverComentarioAcao } from '@/app/(app)/documentos/acoes'
import { avisar } from '@/componentes/tarefas/avisar'
import { botaoPrimario, campo } from '@/lib/ui'

type Comentario = Awaited<ReturnType<typeof listarComentariosAcao>>[number]

/** Comentários da página (só equipe). "trecho" é o texto que estava selecionado ao comentar. */
export function PainelComentarios({ paginaId, eu, trechoInicial, aoFechar }: { paginaId: string; eu: string; trechoInicial: string | null; aoFechar: () => void }) {
  const [itens, setItens] = useState<Comentario[]>([])
  const [texto, setTexto] = useState('')
  const [trecho, setTrecho] = useState(trechoInicial)
  const [, iniciar] = useTransition()
  const recarregar = useCallback(() => void listarComentariosAcao(paginaId).then(setItens), [paginaId])
  useEffect(recarregar, [recarregar])

  const enviar = () =>
    iniciar(async () => {
      if (!avisar(await comentarAcao(paginaId, texto, trecho))) return
      setTexto('')
      setTrecho(null)
      recarregar()
    })

  return (
    <aside className="flex w-80 shrink-0 flex-col border-l border-borda bg-white">
      <div className="flex items-center justify-between border-b border-borda px-3 py-2">
        <h3 className="text-rotulo font-bold text-texto">Comentários</h3>
        <button type="button" aria-label="Fechar" onClick={aoFechar} className="rounded p-1 text-texto-3 hover:bg-hover"><X className="h-4 w-4" /></button>
      </div>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {itens.length === 0 && <p className="text-legenda text-texto-3">Nenhum comentário ainda.</p>}
        {itens.map((c) => (
          <div key={c.id} className={`rounded-lg border border-borda p-2 text-corpo ${c.resolvidoEm ? 'opacity-60' : ''}`}>
            {c.trecho && <p className="mb-1 border-l-2 border-aviso pl-2 text-legenda italic text-texto-3">{c.trecho}</p>}
            <p className="text-legenda font-semibold text-texto-2">{c.autor}</p>
            <p className="whitespace-pre-wrap">{c.texto}</p>
            <div className="mt-1 flex gap-1">
              <button type="button" onClick={() => iniciar(async () => { avisar(await resolverComentarioAcao(c.id, !c.resolvidoEm)); recarregar() })} className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-legenda text-texto-3 hover:bg-hover"><Check className="h-3 w-3" /> {c.resolvidoEm ? 'Reabrir' : 'Resolver'}</button>
              {c.autorId === eu && <button type="button" aria-label="Excluir" onClick={() => iniciar(async () => { avisar(await excluirComentarioAcao(c.id)); recarregar() })} className="rounded px-1.5 py-0.5 text-texto-3 hover:bg-hover"><Trash2 className="h-3 w-3" /></button>}
            </div>
          </div>
        ))}
      </div>
      <div className="space-y-2 border-t border-borda p-3">
        {trecho && <p className="border-l-2 border-aviso pl-2 text-legenda italic text-texto-3">{trecho}</p>}
        <textarea className={`${campo} min-h-16 py-2 text-corpo`} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Escreva um comentário…" />
        <button type="button" disabled={!texto.trim()} onClick={enviar} className={`${botaoPrimario} w-full`}>Comentar</button>
      </div>
    </aside>
  )
}
