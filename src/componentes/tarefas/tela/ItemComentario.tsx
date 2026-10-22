'use client'

import { useConfirmar } from '@/componentes/ConfirmarProvider'
import { useState, useTransition } from 'react'
import { apagarComentarioAcao, editarComentarioAcao } from '@/app/(app)/tarefas/acoes'
import { Avatar } from '@/componentes/Avatar'
import { formatarDataAtividade } from '@/dominio/formatar'
import { mencoesDaEdicao, mencoesParaEdicao, segmentarTexto } from '@/dominio/mencoes'
import { botaoFantasma, botaoPrimario } from '@/lib/ui'
import type { Comentario } from '@/servicos/comentarios'
import { avisar } from '../avisar'
import { ListaAnexos } from './ListaAnexos'

export function ItemComentario({ c, meu }: { c: Comentario; meu: boolean }) {
  const [editando, setEditando] = useState(false)
  const [texto, setTexto] = useState(() => mencoesParaEdicao(c.texto))
  const [pendente, iniciar] = useTransition()
  const confirmar = useConfirmar()
  return (
    <div className="flex gap-2 rounded-lg border border-borda bg-white p-3">
      <Avatar nome={c.autorNome || '?'} tamanho="h-7 w-7 text-legenda" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 text-rotulo">
          <span className="font-medium">{c.autorNome}</span>
          <span className="text-texto-3">{formatarDataAtividade(new Date(c.criadoEm))}</span>
          {c.editadoEm && <span className="text-texto-3">(editado)</span>}
          {!c.interno && <span className="rounded bg-sucesso-fundo px-1.5 text-legenda text-sucesso-forte">visível ao cliente</span>}
        </div>
        {editando ? (
          <div className="mt-1 space-y-1">
            <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={3} className="w-full rounded-md border border-borda p-2 text-corpo" />
            <div className="flex gap-1">
              <button
                disabled={pendente}
                onClick={() =>
                  iniciar(async () => {
                    if (avisar(await editarComentarioAcao(c.id, mencoesDaEdicao(texto, segmentarTexto(c.texto).flatMap((x) => (x.tipo === 'mencao' ? [{ id: x.id, nome: x.nome }] : [])))))) setEditando(false)
                  })
                }
                className={botaoPrimario}
              >
                Salvar
              </button>
              <button
                onClick={() => {
                  setTexto(mencoesParaEdicao(c.texto))
                  setEditando(false)
                }}
                className={botaoFantasma}
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          c.texto && (
            <p className="mt-0.5 whitespace-pre-wrap break-words text-corpo">
              {segmentarTexto(c.texto).map((s, i) =>
                s.tipo === 'mencao' ? (
                  <span key={i} className="font-semibold text-[#1d6fe0]">
                    @{s.nome}
                  </span>
                ) : (
                  <span key={i}>{s.valor}</span>
                ),
              )}
            </p>
          )
        )}
        <ListaAnexos anexos={c.anexos} />
        {meu && !editando && (
          <div className="mt-1 flex gap-2 text-rotulo text-texto-3">
            <button onClick={() => setEditando(true)} className="hover:text-texto">
              Editar
            </button>
            <button
              disabled={pendente}
              onClick={async () => (await confirmar({ titulo: 'Apagar este comentário?', confirmar: 'Apagar', perigo: true })) && iniciar(async () => void avisar(await apagarComentarioAcao(c.id)))}
              className="hover:text-perigo"
            >
              Apagar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
