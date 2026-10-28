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
import { botaoFantasma, botaoPrimario } from '@/lib/ui'
import type { Mensagem } from '@/servicos/chat'

const hora = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Belem' })
const quando = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'America/Belem' })

/** Texto com @menções destacadas, links clicáveis e links de tarefa/documento como cartõezinhos com o título. */
export function TextoMensagem({ texto, titulos, euId }: { texto: string; titulos: Record<string, string>; euId: string }) {
  return (
    <p className="whitespace-pre-wrap break-words text-corpo text-texto">
      {segmentarTexto(texto).map((s, i) =>
        s.tipo === 'mencao' ? (
          <span key={i} className={`rounded-[3px] bg-[var(--client-soft)] px-[3px] font-semibold text-[var(--client)]`}>@{s.nome}</span>
        ) : (
          trechosDoTexto(s.valor).map((t, j) =>
            t.tipo === 'texto' ? (
              <span key={`${i}-${j}`}>{t.valor}</span>
            ) : t.tipo === 'link' ? (
              <a key={`${i}-${j}`} href={t.url} target="_blank" rel="noreferrer" className="text-marca underline underline-offset-2 hover:text-marca/80">{t.url}</a>
            ) : (
              <Link key={`${i}-${j}`} href={`/${t.recurso === 'tarefa' ? 'tarefas' : 'documentos'}/${t.id}`} className="mx-0.5 inline-flex max-w-full items-center gap-1 rounded-md border border-borda bg-fundo px-1.5 py-0.5 align-middle text-rotulo font-medium text-texto hover:border-borda-forte">
                {t.recurso === 'tarefa' ? <CheckSquare className="h-3.5 w-3.5 shrink-0 text-sucesso" /> : <FileText className="h-3.5 w-3.5 shrink-0 text-petroleo" />}
                <span className="truncate">{titulos[t.id] ?? (t.recurso === 'tarefa' ? 'Tarefa' : 'Documento')}</span>
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
    <div className={`group relative flex gap-2.5 rounded-md px-3 hover:bg-hover ${continuacao ? 'py-0.5' : 'mt-2 pt-1.5 pb-0.5'}`}>
      <div className="w-8 shrink-0">
        {continuacao ? (
          <span className="invisible block pt-1 text-right text-micro tabular-nums text-texto-3 group-hover:visible">{hora.format(new Date(m.criadoEm))}</span>
        ) : (
          <Avatar nome={m.autorNome || '?'} tamanho="h-8 w-8 text-legenda" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        {!continuacao && (
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-corpo font-semibold text-texto">{m.autorNome || 'Alguém'}</span>
            <span className="text-legenda tabular-nums text-texto-3" title={quando.format(new Date(m.criadoEm))}>{hora.format(new Date(m.criadoEm))}</span>
          </div>
        )}
        {editando ? (
          <div className="mt-1 space-y-1">
            <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={3} autoFocus className="w-full rounded-md border border-borda p-2 text-corpo" onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); salvar() } if (e.key === 'Escape') setEditando(false) }} />
            <div className="flex gap-1">
              <button disabled={pendente} onClick={salvar} className={botaoPrimario}>Salvar</button>
              <button onClick={() => { setTexto(mencoesParaEdicao(m.texto)); setEditando(false) }} className={botaoFantasma}>Cancelar</button>
            </div>
          </div>
        ) : (
          <>
            {m.texto && <TextoMensagem texto={m.texto} titulos={titulos} euId={euId} />}
            {m.editadoEm && <span className="text-micro text-texto-3">(editada)</span>}
          </>
        )}
        <ListaAnexos anexos={m.anexos} />
        {hrefFio && m.respostas.total > 0 && (
          <Link href={hrefFio} scroll={false} className="mt-1 inline-flex items-center gap-2 rounded-md px-1.5 py-1 text-rotulo hover:bg-white">
            <span className="flex -space-x-1.5">{m.respostas.autores.slice(0, 3).map((a) => <Avatar key={a.nome} nome={a.nome || '?'} tamanho="h-5 w-5 text-[9px] ring-2 ring-claro" />)}</span>
            <span className="font-semibold text-[var(--client)]">{m.respostas.total} {m.respostas.total === 1 ? 'resposta' : 'respostas'}</span>
            {m.respostas.ultima && <span className="text-legenda text-texto-3">última {quando.format(new Date(m.respostas.ultima))}</span>}
          </Link>
        )}
      </div>
      {!editando && (
        <div className="absolute -top-3 right-3 hidden items-center gap-0.5 rounded-md border border-borda bg-white p-0.5 shadow-sm group-hover:flex">
          {hrefFio && <Link href={hrefFio} scroll={false} title="Responder em tópico" aria-label="Responder em tópico" className="rounded p-1 text-texto-3 hover:bg-hover hover:text-texto"><MessageSquareReply className="h-3.5 w-3.5" /></Link>}
          {meu && <button type="button" onClick={() => setEditando(true)} title="Editar" aria-label="Editar mensagem" className="rounded p-1 text-texto-3 hover:bg-hover hover:text-texto"><Pencil className="h-3.5 w-3.5" /></button>}
          {(meu || admin) && <button type="button" onClick={excluir} disabled={pendente} title="Excluir" aria-label="Excluir mensagem" className="rounded p-1 text-texto-3 hover:bg-hover hover:text-perigo"><Trash2 className="h-3.5 w-3.5" /></button>}
        </div>
      )}
    </div>
  )
}
