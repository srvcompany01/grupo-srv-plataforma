'use client'

import { EditorContent, useEditor, type JSONContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Bold, Italic, List, ListOrdered } from 'lucide-react'
import { useTransition } from 'react'
import { atualizarTarefaAcao } from '@/app/(app)/tarefas/acoes'
import { avisar } from './avisar'

/** Texto formatado salvo como JSON do Tiptap ao sair do campo. */
export function EditorDescricao({ tarefaId, inicial }: { tarefaId: string; inicial: unknown }) {
  const [, iniciar] = useTransition()
  const editor = useEditor({
    extensions: [StarterKit],
    content: (inicial as JSONContent) ?? '',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose-sm min-h-24 rounded-md px-2 py-1.5 text-[13px] outline-none focus:bg-hover [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5',
      },
    },
    onBlur: ({ editor: e }) => {
      const json = e.isEmpty ? null : e.getJSON()
      if (JSON.stringify(json) === JSON.stringify(inicial ?? null)) return
      iniciar(async () => void avisar(await atualizarTarefaAcao(tarefaId, { descricao: json })))
    },
  })
  const botao = (ativo: boolean) => `rounded p-1 ${ativo ? 'bg-marca-fundo text-marca' : 'text-texto-3 hover:bg-hover'}`
  return (
    <div className="rounded-md border border-borda">
      {editor && (
        <div className="flex gap-0.5 border-b border-borda px-1 py-0.5">
          <button type="button" aria-label="Negrito" onClick={() => editor.chain().focus().toggleBold().run()} className={botao(editor.isActive('bold'))}>
            <Bold className="h-3.5 w-3.5" />
          </button>
          <button type="button" aria-label="Itálico" onClick={() => editor.chain().focus().toggleItalic().run()} className={botao(editor.isActive('italic'))}>
            <Italic className="h-3.5 w-3.5" />
          </button>
          <button type="button" aria-label="Lista" onClick={() => editor.chain().focus().toggleBulletList().run()} className={botao(editor.isActive('bulletList'))}>
            <List className="h-3.5 w-3.5" />
          </button>
          <button type="button" aria-label="Lista numerada" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={botao(editor.isActive('orderedList'))}>
            <ListOrdered className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      <EditorContent editor={editor} placeholder="Adicione uma descrição…" />
    </div>
  )
}
