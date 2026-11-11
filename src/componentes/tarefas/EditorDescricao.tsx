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
        class: 'descricao',
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
    <div>
      {editor && (
        <div>
          <button type="button" aria-label="Negrito" onClick={() => editor.chain().focus().toggleBold().run()}>
            <Bold />
          </button>
          <button type="button" aria-label="Itálico" onClick={() => editor.chain().focus().toggleItalic().run()}>
            <Italic />
          </button>
          <button type="button" aria-label="Lista" onClick={() => editor.chain().focus().toggleBulletList().run()}>
            <List />
          </button>
          <button type="button" aria-label="Lista numerada" onClick={() => editor.chain().focus().toggleOrderedList().run()}>
            <ListOrdered />
          </button>
        </div>
      )}
      <EditorContent editor={editor} placeholder="Adicione uma descrição…" />
    </div>
  )
}
