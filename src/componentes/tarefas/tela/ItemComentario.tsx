'use client'

import { useConfirmar } from '@/componentes/ConfirmarProvider'
import { useState, useTransition } from 'react'
import { apagarComentarioAcao, editarComentarioAcao } from '@/app/(app)/tarefas/acoes'
import { Avatar } from '@/componentes/Avatar'
import { formatarDataAtividade } from '@/dominio/formatar'
import { mencoesDaEdicao, mencoesParaEdicao, segmentarTexto } from '@/dominio/mencoes'
import type { Comentario } from '@/servicos/comentarios'
import { avisar } from '../avisar'
import { ListaAnexos } from './ListaAnexos'

export function ItemComentario({ c, meu }: { c: Comentario; meu: boolean }) {
  const [editando, setEditando] = useState(false)
  const [texto, setTexto] = useState(() => mencoesParaEdicao(c.texto))
  const [pendente, iniciar] = useTransition()
  const confirmar = useConfirmar()
  return (
    <div>
      <Avatar nome={c.autorNome || '?'} tamanho="h-7 w-7 text-legenda" />
      <div>
        <div>
          <span>{c.autorNome}</span>
          <span>{formatarDataAtividade(new Date(c.criadoEm))}</span>
          {c.editadoEm && <span>(editado)</span>}
          {!c.interno && <span>visível ao cliente</span>}
        </div>
        {editando ? (
          <div>
            <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={3} />
            <div>
              <button
                disabled={pendente}
                onClick={() =>
                  iniciar(async () => {
                    if (avisar(await editarComentarioAcao(c.id, mencoesDaEdicao(texto, segmentarTexto(c.texto).flatMap((x) => (x.tipo === 'mencao' ? [{ id: x.id, nome: x.nome }] : [])))))) setEditando(false)
                  })
                }
              >
                Salvar
              </button>
              <button
                onClick={() => {
                  setTexto(mencoesParaEdicao(c.texto))
                  setEditando(false)
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          c.texto && (
            <p>
              {segmentarTexto(c.texto).map((s, i) =>
                s.tipo === 'mencao' ? (
                  <span key={i}>
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
          <div>
            <button onClick={() => setEditando(true)}>
              Editar
            </button>
            <button
              disabled={pendente}
              onClick={async () => (await confirmar({ titulo: 'Apagar este comentário?', confirmar: 'Apagar', perigo: true })) && iniciar(async () => void avisar(await apagarComentarioAcao(c.id)))}
            >
              Apagar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
