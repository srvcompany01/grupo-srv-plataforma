'use client'

import { EditorContent, useEditor, type JSONContent } from '@tiptap/react'
import { extensoesBase } from './extensoes'

/** Texto do documento somente para ler (portal do cliente). */
export function LeitorDocumento({ conteudo }: { conteudo: unknown }) {
  const editor = useEditor({
    extensions: extensoesBase(),
    content: (conteudo as JSONContent | null) ?? '',
    editable: false,
    immediatelyRender: false,
    editorProps: { attributes: { class: 'documento' } },
  })
  return <EditorContent editor={editor} />
}
