'use client'

import { useState, useTransition } from 'react'
import { Avatar } from '@/componentes/Avatar'
import { formatarDataHora } from '@/dominio/formatar'
import { botaoFantasma, botaoPrimario } from '@/lib/ui'
import type { Comentario } from '@/servicos/comentarios'
import { apagarComentarioAcao, comentarAcao, editarComentarioAcao } from '@/app/(app)/tarefas/acoes'
import { avisar } from './avisar'

function Item({ c, meu }: { c: Comentario; meu: boolean }) {
  const [editando, setEditando] = useState(false)
  const [texto, setTexto] = useState(c.texto)
  const [pendente, iniciar] = useTransition()
  return (
    <div className="flex gap-2">
      <Avatar nome={c.autorNome || '?'} tamanho="h-7 w-7 text-[10px]" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 text-[12px]">
          <span className="font-medium">{c.autorNome}</span>
          <span className="text-texto-3">{formatarDataHora(new Date(c.criadoEm))}</span>
          {c.editadoEm && <span className="text-texto-3">(editado)</span>}
          {!c.interno && <span className="rounded bg-emerald-50 px-1.5 text-[11px] text-emerald-700">visível ao cliente</span>}
        </div>
        {editando ? (
          <div className="mt-1 space-y-1">
            <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={3} className="w-full rounded-md border border-borda p-2 text-[13px]" />
            <div className="flex gap-1">
              <button
                disabled={pendente}
                onClick={() =>
                  iniciar(async () => {
                    if (avisar(await editarComentarioAcao(c.id, texto))) setEditando(false)
                  })
                }
                className={botaoPrimario}
              >
                Salvar
              </button>
              <button onClick={() => setEditando(false)} className={botaoFantasma}>
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-0.5 whitespace-pre-wrap text-[13px]">{c.texto}</p>
        )}
        {meu && !editando && (
          <div className="mt-0.5 flex gap-2 text-[12px] text-texto-3">
            <button onClick={() => setEditando(true)} className="hover:text-texto">
              Editar
            </button>
            <button
              disabled={pendente}
              onClick={() => confirm('Apagar este comentário?') && iniciar(async () => void avisar(await apagarComentarioAcao(c.id)))}
              className="hover:text-rose-600"
            >
              Apagar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/** Caixa mínima de comentário (provisória até a Task 9 trazer menções e anexos). */
export function FormularioComentario({ tarefaId }: { tarefaId: string }) {
  const [texto, setTexto] = useState('')
  const [interno, setInterno] = useState(true)
  const [pendente, iniciar] = useTransition()
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        iniciar(async () => {
          if (avisar(await comentarAcao(tarefaId, texto, interno))) setTexto('')
        })
      }}
      className="space-y-2 rounded-md border border-borda p-2"
    >
      <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={2} placeholder="Escreva um comentário…" className="w-full resize-none text-[13px] outline-none" />
      <div className="flex items-center justify-between gap-2">
        <div className="flex rounded-md bg-hover p-0.5 text-[12px]">
          <button type="button" onClick={() => setInterno(true)} className={`rounded px-2 py-0.5 ${interno ? 'bg-white shadow-sm' : 'text-texto-2'}`}>
            Interno
          </button>
          <button type="button" onClick={() => setInterno(false)} className={`rounded px-2 py-0.5 ${!interno ? 'bg-white text-emerald-700 shadow-sm' : 'text-texto-2'}`}>
            Externo
          </button>
        </div>
        <button disabled={pendente || !texto.trim()} className={botaoPrimario}>
          Comentar
        </button>
      </div>
    </form>
  )
}

export function Comentarios({ tarefaId, comentarios, euId }: { tarefaId: string; comentarios: Comentario[]; euId: string }) {
  return (
    <div className="space-y-4">
      {comentarios.length === 0 && <p className="text-[13px] text-texto-3">Nenhum comentário ainda.</p>}
      {comentarios.map((c) => (
        <Item key={c.id} c={c} meu={c.autorId === euId} />
      ))}
      <FormularioComentario tarefaId={tarefaId} />
    </div>
  )
}
