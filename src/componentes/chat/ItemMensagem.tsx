'use client'

import { CheckSquare, FileText, MessageSquareReply, Pencil, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useState, useTransition } from 'react'
import { editarMensagemAcao, excluirMensagemAcao } from '@/app/(app)/chat/acoes'
import { Avatar } from '@/componentes/Avatar'
import { useConfirmar } from '@/componentes/ConfirmarProvider'
import { avisar } from '@/componentes/tarefas/avisar'
import { ListaAnexos } from '@/componentes/tarefas/tela/ListaAnexos'
import { trechosDoTexto } from '@/dominio/chat'
import { mencoesDaEdicao, mencoesParaEdicao, segmentarTexto } from '@/dominio/mencoes'
import type { Mensagem } from '@/servicos/chat'

const hora = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Belem' })
const quando = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'America/Belem' })

/** Texto com @menções destacadas, links clicáveis e links de tarefa/documento como cartõezinhos com o título. */
export function TextoMensagem({ texto, titulos }: { texto: string; titulos: Record<string, string>; euId?: string }) {
  return (
    <p>
      {segmentarTexto(texto).map((s, i) =>
        s.tipo === 'mencao' ? (
          <span key={i}>@{s.nome}</span>
        ) : (
          trechosDoTexto(s.valor).map((t, j) =>
            t.tipo === 'texto' ? (
              <span key={`${i}-${j}`}>{t.valor}</span>
            ) : t.tipo === 'link' ? (
              <a key={`${i}-${j}`} href={t.url} target="_blank" rel="noreferrer">{t.url}</a>
            ) : (
              <Link key={`${i}-${j}`} href={`/${t.recurso === 'tarefa' ? 'tarefas' : 'documentos'}/${t.id}`}>
                {t.recurso === 'tarefa' ? <CheckSquare /> : <FileText />}
                <span>{titulos[t.id] ?? (t.recurso === 'tarefa' ? 'Tarefa' : 'Documento')}</span>
              </Link>
            ),
          )
        ),
      )}
    </p>
  )
}

/**
 * Uma mensagem do chat. `continuacao` = mesma pessoa logo em seguida (sem repetir foto e nome).
 * `hrefFio` aparece nas mensagens principais (abre o tópico); nas respostas fica vazio.
 */
export function ItemMensagem({ m, euId, admin, continuacao, titulos, hrefFio, pessoas }: { m: Mensagem; euId: string; admin: boolean; continuacao: boolean; titulos: Record<string, string>; hrefFio?: string; pessoas: { id: string; nome: string }[] }) {
  const [editando, setEditando] = useState(false)
  const [texto, setTexto] = useState(() => mencoesParaEdicao(m.texto))
  const [pendente, iniciar] = useTransition()
  const confirmar = useConfirmar()
  const meu = m.autorId === euId

  const salvar = () =>
    iniciar(async () => {
      if (avisar(await editarMensagemAcao(m.id, mencoesDaEdicao(texto, pessoas)))) setEditando(false)
    })
  const excluir = async () => {
    if (!(await confirmar({ titulo: 'Excluir esta mensagem?', descricao: hrefFio && m.respostas.total ? 'As respostas do tópico também somem.' : undefined, confirmar: 'Excluir', perigo: true }))) return
    iniciar(async () => void avisar(await excluirMensagemAcao(m.id), true))
  }

  return (
    <div>
      <div>
        {continuacao ? (
          <span>{hora.format(new Date(m.criadoEm))}</span>
        ) : (
          <Avatar nome={m.autorNome || '?'} tamanho="h-8 w-8 text-legenda" />
        )}
      </div>
      <div>
        {!continuacao && (
          <div>
            <span>{m.autorNome || 'Alguém'}</span>
            <span title={quando.format(new Date(m.criadoEm))}>{hora.format(new Date(m.criadoEm))}</span>
          </div>
        )}
        {editando ? (
          <div>
            <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={3} autoFocus onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); salvar() } if (e.key === 'Escape') setEditando(false) }} />
            <div>
              <button disabled={pendente} onClick={salvar}>Salvar</button>
              <button onClick={() => { setTexto(mencoesParaEdicao(m.texto)); setEditando(false) }}>Cancelar</button>
            </div>
          </div>
        ) : (
          <>
            {m.texto && <TextoMensagem texto={m.texto} titulos={titulos} euId={euId} />}
            {m.editadoEm && <span>(editada)</span>}
          </>
        )}
        <ListaAnexos anexos={m.anexos} />
        {hrefFio && m.respostas.total > 0 && (
          <Link href={hrefFio} scroll={false}>
            <span>{m.respostas.autores.slice(0, 3).map((a) => <Avatar key={a.nome} nome={a.nome || '?'} tamanho="h-5 w-5 text-[9px] ring-2 ring-claro" />)}</span>
            <span>{m.respostas.total} {m.respostas.total === 1 ? 'resposta' : 'respostas'}</span>
            {m.respostas.ultima && <span>última {quando.format(new Date(m.respostas.ultima))}</span>}
          </Link>
        )}
      </div>
      {!editando && (
        <div className="hidden">
          {hrefFio && <Link href={hrefFio} scroll={false} title="Responder em tópico" aria-label="Responder em tópico"><MessageSquareReply /></Link>}
          {meu && <button type="button" onClick={() => setEditando(true)} title="Editar" aria-label="Editar mensagem"><Pencil /></button>}
          {(meu || admin) && <button type="button" onClick={excluir} disabled={pendente} title="Excluir" aria-label="Excluir mensagem"><Trash2 /></button>}
        </div>
      )}
    </div>
  )
}
