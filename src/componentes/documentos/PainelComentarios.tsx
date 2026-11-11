'use client'

import { Check, Trash2, X } from 'lucide-react'
import { useCallback, useEffect, useState, useTransition } from 'react'
import { comentarAcao, excluirComentarioAcao, listarComentariosAcao, resolverComentarioAcao } from '@/app/(app)/documentos/acoes'
import { avisar } from '@/componentes/tarefas/avisar'

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
    <aside>
      <div>
        <h3>Comentários</h3>
        <button type="button" aria-label="Fechar" onClick={aoFechar}><X /></button>
      </div>
      <div>
        {itens.length === 0 && <p>Nenhum comentário ainda.</p>}
        {itens.map((c) => (
          <div key={c.id}>
            {c.trecho && <p>{c.trecho}</p>}
            <p>{c.autor}</p>
            <p>{c.texto}</p>
            <div>
              <button type="button" onClick={() => iniciar(async () => { avisar(await resolverComentarioAcao(c.id, !c.resolvidoEm)); recarregar() })}><Check /> {c.resolvidoEm ? 'Reabrir' : 'Resolver'}</button>
              {c.autorId === eu && <button type="button" aria-label="Excluir" onClick={() => iniciar(async () => { avisar(await excluirComentarioAcao(c.id)); recarregar() })}><Trash2 /></button>}
            </div>
          </div>
        ))}
      </div>
      <div>
        {trecho && <p>{trecho}</p>}
        <textarea value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Escreva um comentário…" />
        <button type="button" disabled={!texto.trim()} onClick={enviar}>Comentar</button>
      </div>
    </aside>
  )
}
