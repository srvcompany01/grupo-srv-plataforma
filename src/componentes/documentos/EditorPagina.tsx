'use client'

import Collaboration from '@tiptap/extension-collaboration'
import Placeholder from '@tiptap/extension-placeholder'
import { Markdown } from '@tiptap/markdown'
import { EditorContent, useEditor, type Editor, type JSONContent } from '@tiptap/react'
import {
  Bold, Code, Download, Heading1, Heading2, Highlighter, History, Italic, List, ListOrdered, ListTodo, MessageSquare,
  Quote, Redo2, Strikethrough, Table, Underline, Undo2, Upload, Link as IconeLink,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as Y from 'yjs'
import { gravarEstadoAcao } from '@/app/(app)/documentos/acoes'
import { deBase64, paraBase64 } from '@/dominio/base64'
import type { Pessoa } from '@/dominio/tarefas'
import type { Json } from '@/infra/supabase/tipos'
import { avisar } from '@/componentes/tarefas/avisar'
import { conectarDocumento, type PessoaOnline, type StatusConexao } from './colaboracao'
import { PainelComentarios } from './PainelComentarios'
import { PainelVersoes } from './PainelVersoes'
import { CAMPO_YJS, extensoesBase } from './extensoes'
import { ComandoBarra, mencaoDePessoas } from './sugestoes'

export type PaginaEditavel = { id: string; titulo: string; conteudo: Json | null; ydoc: string | null; baseUpdate: number; alteracoes: { id: number; data: string }[] }

const ROTULO_STATUS: Record<StatusConexao | 'salvando', string> = { conectando: 'Conectando…', conectado: 'Conectado', 'sem-conexao': 'Sem conexão — tentando de novo', salvando: 'Salvando…' }
const PAUSA_GRAVAR_MS = 6000

function Botao({ ativo, aoClicar, titulo, children, desabilitado }: { ativo?: boolean; aoClicar: () => void; titulo: string; children: React.ReactNode; desabilitado?: boolean }) {
  return (
    <button type="button" title={titulo} aria-label={titulo} disabled={desabilitado} onMouseDown={(e) => e.preventDefault()} onClick={aoClicar}>
      {children}
    </button>
  )
}

function Barra({ editor, aoComentar, aoVersoes, aoExportar, aoImportar }: { editor: Editor; aoComentar: () => void; aoVersoes: () => void; aoExportar: () => void; aoImportar: () => void }) {
  const c = () => editor.chain().focus()
  const link = () => {
    const atual = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('Endereço do link (vazio remove)', atual ?? 'https://')
    if (url === null) return
    if (!url || url === 'https://') c().unsetLink().run()
    else if (/^(https?:\/\/|mailto:)/i.test(url)) c().extendMarkRange('link').setLink({ href: url }).run()
  }
  return (
    <div>
      <Botao titulo="Desfazer" aoClicar={() => c().undo().run()}><Undo2 /></Botao>
      <Botao titulo="Refazer" aoClicar={() => c().redo().run()}><Redo2 /></Botao>
      <span />
      <Botao titulo="Título 1" ativo={editor.isActive('heading', { level: 1 })} aoClicar={() => c().toggleHeading({ level: 1 }).run()}><Heading1 /></Botao>
      <Botao titulo="Título 2" ativo={editor.isActive('heading', { level: 2 })} aoClicar={() => c().toggleHeading({ level: 2 }).run()}><Heading2 /></Botao>
      <span />
      <Botao titulo="Negrito" ativo={editor.isActive('bold')} aoClicar={() => c().toggleBold().run()}><Bold /></Botao>
      <Botao titulo="Itálico" ativo={editor.isActive('italic')} aoClicar={() => c().toggleItalic().run()}><Italic /></Botao>
      <Botao titulo="Sublinhado" ativo={editor.isActive('underline')} aoClicar={() => c().toggleUnderline().run()}><Underline /></Botao>
      <Botao titulo="Tachado" ativo={editor.isActive('strike')} aoClicar={() => c().toggleStrike().run()}><Strikethrough /></Botao>
      <Botao titulo="Destaque" ativo={editor.isActive('highlight')} aoClicar={() => c().toggleHighlight().run()}><Highlighter /></Botao>
      <Botao titulo="Código" ativo={editor.isActive('code')} aoClicar={() => c().toggleCode().run()}><Code /></Botao>
      <Botao titulo="Link" ativo={editor.isActive('link')} aoClicar={link}><IconeLink /></Botao>
      <span />
      <Botao titulo="Lista" ativo={editor.isActive('bulletList')} aoClicar={() => c().toggleBulletList().run()}><List /></Botao>
      <Botao titulo="Lista numerada" ativo={editor.isActive('orderedList')} aoClicar={() => c().toggleOrderedList().run()}><ListOrdered /></Botao>
      <Botao titulo="Lista de tarefas" ativo={editor.isActive('taskList')} aoClicar={() => c().toggleTaskList().run()}><ListTodo /></Botao>
      <Botao titulo="Citação" ativo={editor.isActive('blockquote')} aoClicar={() => c().toggleBlockquote().run()}><Quote /></Botao>
      <Botao titulo="Tabela" aoClicar={() => c().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}><Table /></Botao>
      <span>
        <Botao titulo="Comentar" aoClicar={aoComentar}><MessageSquare /></Botao>
        <Botao titulo="Histórico de versões" aoClicar={aoVersoes}><History /></Botao>
        <Botao titulo="Importar Markdown" aoClicar={aoImportar}><Upload /></Botao>
        <Botao titulo="Exportar Markdown" aoClicar={aoExportar}><Download /></Botao>
      </span>
    </div>
  )
}

/**
 * Uma página do documento. Com `ydoc` (todo mundo da equipe), vários editores escrevem juntos:
 * as alterações trafegam pelo banco (document_updates + Realtime). Só leitura quando a pessoa não pode editar.
 */
export function EditorPagina({ pagina, podeEditar, eu, equipe, documentoTitulo }: { pagina: PaginaEditavel; podeEditar: boolean; eu: PessoaOnline; equipe: Pessoa[]; documentoTitulo: string }) {
  const colaborativo = pagina.ydoc !== null
  const [status, setStatus] = useState<StatusConexao | 'salvando'>('conectando')
  const [online, setOnline] = useState<PessoaOnline[]>([])
  const [painel, setPainel] = useState<'comentarios' | 'versoes' | null>(null)
  const [trecho, setTrecho] = useState<string | null>(null)
  const arquivo = useRef<HTMLInputElement>(null)
  const conexao = useRef<ReturnType<typeof conectarDocumento> | null>(null)
  const sujo = useRef(false)
  const pausa = useRef<ReturnType<typeof setTimeout> | null>(null)

  const ydoc = useMemo(() => {
    const d = new Y.Doc()
    if (pagina.ydoc) Y.applyUpdate(d, deBase64(pagina.ydoc), 'remoto')
    for (const a of pagina.alteracoes) Y.applyUpdate(d, deBase64(a.data), 'remoto')
    return d
    // eslint-disable-next-line react-hooks/exhaustive-deps -- o estado inicial só vale na abertura da página
  }, [pagina.id])

  const editor = useEditor({
    extensions: [
      ...extensoesBase(mencaoDePessoas(equipe)),
      ComandoBarra,
      Markdown,
      Placeholder.configure({ placeholder: "Digite '/' para ver os blocos ou '@' para mencionar alguém" }),
      ...(colaborativo ? [Collaboration.configure({ document: ydoc, field: CAMPO_YJS })] : []),
    ],
    content: colaborativo ? undefined : ((pagina.conteudo as JSONContent | null) ?? ''),
    editable: podeEditar,
    immediatelyRender: false,
    editorProps: { attributes: { class: 'documento' } },
  })

  const tituloRef = useRef(pagina.titulo)

  const gravar = useCallback(async () => {
    const c = conexao.current
    if (!editor || !c || !podeEditar || !sujo.current) return
    sujo.current = false
    setStatus('salvando')
    await c.descarregar()
    const r = await gravarEstadoAcao(pagina.id, { ydoc: paraBase64(Y.encodeStateAsUpdate(ydoc)), conteudo: editor.getJSON() as Json, ate: c.ultimoId(), titulo: tituloRef.current })
    if (r?.erro) {
      sujo.current = true
      setStatus('sem-conexao')
    } else setStatus('conectado')
  }, [editor, pagina.id, podeEditar, ydoc])

  const gravarRef = useRef(gravar)
  useEffect(() => {
    gravarRef.current = gravar
    tituloRef.current = pagina.titulo
  })

  useEffect(() => {
    if (!colaborativo) return
    const c = conectarDocumento({
      paginaId: pagina.id,
      ydoc,
      baseUpdate: pagina.alteracoes.at(-1)?.id ?? pagina.baseUpdate,
      eu,
      podeEditar,
      aoStatus: (s) => setStatus(s),
      aoPresenca: setOnline,
      aoAlterar: () => {
        sujo.current = true
        if (pausa.current) clearTimeout(pausa.current)
        pausa.current = setTimeout(() => void gravarRef.current(), PAUSA_GRAVAR_MS)
      },
    })
    conexao.current = c
    return () => {
      if (pausa.current) clearTimeout(pausa.current)
      void gravarRef.current().finally(() => c.fechar())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- liga uma vez por página
  }, [pagina.id])

  const exportar = () => {
    if (!editor) return
    const bloco = new Blob([editor.getMarkdown()], { type: 'text/markdown;charset=utf-8' })
    const link = Object.assign(document.createElement('a'), { href: URL.createObjectURL(bloco), download: `${(pagina.titulo || documentoTitulo).replace(/[^\p{L}\p{N}-]+/gu, '-')}.md` })
    link.click()
    URL.revokeObjectURL(link.href)
  }

  const importar = async (arq: File | undefined) => {
    if (!arq || !editor) return
    if (arq.size > 2_000_000) return void avisar({ erro: 'Arquivo grande demais (máximo 2 MB).' })
    editor.chain().focus('end').insertContent(await arq.text(), { contentType: 'markdown' }).run()
    avisar({ ok: 'Conteúdo importado no fim da página.' }, true)
  }

  const comentar = () => {
    if (editor) {
      const { from, to } = editor.state.selection
      setTrecho(from === to ? null : editor.state.doc.textBetween(from, to, ' ').slice(0, 300))
    }
    setPainel('comentarios')
  }

  if (!editor) return <div>Carregando editor…</div>
  return (
    <div>
      <div>
        {podeEditar ? (
          <Barra editor={editor} aoComentar={comentar} aoVersoes={() => setPainel('versoes')} aoExportar={exportar} aoImportar={() => arquivo.current?.click()} />
        ) : (
          <div>
            Somente leitura
            <button type="button" onClick={exportar}><Download /> Exportar Markdown</button>
          </div>
        )}
        <input ref={arquivo} type="file" accept=".md,.markdown,.txt,text/markdown,text/plain" hidden onChange={(e) => { void importar(e.target.files?.[0]); e.target.value = '' }} />
        <div>
          <EditorContent editor={editor} />
        </div>
        <div>
          {colaborativo && <span>{ROTULO_STATUS[status]}</span>}
          {online.length > 1 && (
            <span title={online.map((p) => p.nome).join(', ')}>
              {online.filter((p) => p.id !== eu.id).map((p) => p.nome.split(' ')[0]).join(', ')} {online.length === 2 ? 'está' : 'estão'} aqui
            </span>
          )}
        </div>
      </div>
      {painel === 'comentarios' && <PainelComentarios paginaId={pagina.id} eu={eu.id} trechoInicial={trecho} aoFechar={() => setPainel(null)} />}
      {painel === 'versoes' && <PainelVersoes paginaId={pagina.id} podeEditar={podeEditar} editor={editor} titulo={pagina.titulo || documentoTitulo} aoFechar={() => setPainel(null)} aoSalvar={() => editor.getJSON() as Json} ydoc={() => paraBase64(Y.encodeStateAsUpdate(ydoc))} />}
    </div>
  )
}
