import { TaskItem, TaskList } from '@tiptap/extension-list'
import Highlight from '@tiptap/extension-highlight'
import Image from '@tiptap/extension-image'
import Mention from '@tiptap/extension-mention'
import { Table, TableCell, TableHeader, TableRow } from '@tiptap/extension-table'
import StarterKit from '@tiptap/starter-kit'
import type { AnyExtension } from '@tiptap/core'

/** Nome do campo Yjs onde o texto mora (o mesmo no navegador e no servidor). */
export const CAMPO_YJS = 'default'

/**
 * Nós e marcas do documento. É a MESMA lista no navegador (editor) e no servidor (gerar o estado inicial a partir do JSON):
 * se divergir, o texto salvo deixa de abrir. Desfazer/refazer fica com o Yjs (undoRedo desligado).
 */
export function extensoesBase(mencao: AnyExtension = Mention.configure({ HTMLAttributes: { class: 'mencao' } })) {
  return [
    StarterKit.configure({ undoRedo: false, link: { openOnClick: false, autolink: true } }),
    TaskList,
    TaskItem.configure({ nested: true }),
    Table.configure({ resizable: false }),
    TableRow,
    TableHeader,
    TableCell,
    Image,
    Highlight,
    mencao,
  ]
}
