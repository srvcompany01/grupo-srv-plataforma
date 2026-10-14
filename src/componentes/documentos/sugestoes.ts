import { Extension, type Editor, type Range } from '@tiptap/core'
import Mention from '@tiptap/extension-mention'
import Suggestion, { type SuggestionKeyDownProps, type SuggestionProps } from '@tiptap/suggestion'
import type { Pessoa } from '@/dominio/tarefas'

type Item = { titulo: string; dica?: string; executar: (editor: Editor, intervalo: Range) => void }

/** Lista flutuante simples (DOM puro) usada pelo "/" e pelo "@". */
function criarMenu<T>(rotulo: (item: T) => { titulo: string; dica?: string }, escolher: (item: T, props: SuggestionProps<T>) => void) {
  let caixa: HTMLDivElement | null = null
  let itens: T[] = []
  let indice = 0
  let props: SuggestionProps<T> | null = null

  const desenhar = () => {
    if (!caixa || !props) return
    const r = props.clientRect?.()
    if (r) {
      caixa.style.left = `${Math.min(r.left, window.innerWidth - 280)}px`
      caixa.style.top = `${r.bottom + 6}px`
    }
    caixa.replaceChildren(
      ...(itens.length
        ? itens.map((item, i) => {
            const { titulo, dica } = rotulo(item)
            const linha = document.createElement('button')
            linha.type = 'button'
            linha.className = `flex w-full flex-col items-start rounded-md px-2 py-1.5 text-left ${i === indice ? 'bg-hover' : ''}`
            const t = document.createElement('span')
            t.className = 'text-rotulo font-medium text-texto'
            t.textContent = titulo
            linha.append(t)
            if (dica) {
              const d = document.createElement('span')
              d.className = 'text-legenda text-texto-3'
              d.textContent = dica
              linha.append(d)
            }
            linha.addEventListener('mousedown', (e) => {
              e.preventDefault()
              if (props) escolher(item, props)
            })
            return linha
          })
        : [Object.assign(document.createElement('div'), { className: 'px-2 py-1.5 text-legenda text-texto-3', textContent: 'Nada encontrado' })]),
    )
    caixa.children[indice]?.scrollIntoView({ block: 'nearest' })
  }

  return {
    onStart: (p: SuggestionProps<T>) => {
      props = p
      itens = p.items
      indice = 0
      caixa = document.createElement('div')
      caixa.className = 'fixed z-50 max-h-72 w-64 overflow-y-auto rounded-lg border border-borda bg-white p-1 shadow-lg'
      document.body.append(caixa)
      desenhar()
    },
    onUpdate: (p: SuggestionProps<T>) => {
      props = p
      itens = p.items
      indice = Math.min(indice, Math.max(itens.length - 1, 0))
      desenhar()
    },
    onKeyDown: ({ event }: SuggestionKeyDownProps) => {
      if (!itens.length) return false
      if (event.key === 'ArrowDown') indice = (indice + 1) % itens.length
      else if (event.key === 'ArrowUp') indice = (indice - 1 + itens.length) % itens.length
      else if (event.key === 'Enter' || event.key === 'Tab') {
        if (props) escolher(itens[indice], props)
        return true
      } else return false
      desenhar()
      return true
    },
    onExit: () => {
      caixa?.remove()
      caixa = null
    },
  }
}

const ITENS: Item[] = [
  { titulo: 'Texto', dica: 'Parágrafo comum', executar: (e, r) => e.chain().focus().deleteRange(r).setParagraph().run() },
  { titulo: 'Título 1', dica: 'Título grande', executar: (e, r) => e.chain().focus().deleteRange(r).setHeading({ level: 1 }).run() },
  { titulo: 'Título 2', dica: 'Título médio', executar: (e, r) => e.chain().focus().deleteRange(r).setHeading({ level: 2 }).run() },
  { titulo: 'Título 3', dica: 'Título pequeno', executar: (e, r) => e.chain().focus().deleteRange(r).setHeading({ level: 3 }).run() },
  { titulo: 'Lista', dica: 'Itens com marcador', executar: (e, r) => e.chain().focus().deleteRange(r).toggleBulletList().run() },
  { titulo: 'Lista numerada', dica: '1, 2, 3…', executar: (e, r) => e.chain().focus().deleteRange(r).toggleOrderedList().run() },
  { titulo: 'Lista de tarefas', dica: 'Caixas para marcar', executar: (e, r) => e.chain().focus().deleteRange(r).toggleTaskList().run() },
  { titulo: 'Citação', dica: 'Destaca um trecho', executar: (e, r) => e.chain().focus().deleteRange(r).toggleBlockquote().run() },
  { titulo: 'Bloco de código', dica: 'Texto monoespaçado', executar: (e, r) => e.chain().focus().deleteRange(r).toggleCodeBlock().run() },
  { titulo: 'Divisor', dica: 'Linha horizontal', executar: (e, r) => e.chain().focus().deleteRange(r).setHorizontalRule().run() },
  { titulo: 'Tabela', dica: '3 × 3 com cabeçalho', executar: (e, r) => e.chain().focus().deleteRange(r).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
  {
    titulo: 'Imagem',
    dica: 'Pelo endereço (URL)',
    executar: (e, r) => {
      const url = window.prompt('Endereço da imagem (https://…)')
      const chain = e.chain().focus().deleteRange(r)
      if (url && /^https?:\/\//i.test(url)) chain.setImage({ src: url }).run()
      else chain.run()
    },
  },
]

/** Digitar "/" abre o menu de blocos. */
export const ComandoBarra = Extension.create({
  name: 'comandoBarra',
  addProseMirrorPlugins() {
    return [
      Suggestion<Item>({
        editor: this.editor,
        char: '/',
        startOfLine: false,
        allowedPrefixes: [' ', '\n'],
        items: ({ query }) => ITENS.filter((i) => i.titulo.toLowerCase().includes(query.toLowerCase())),
        command: ({ editor, range, props }) => props.executar(editor, range),
        render: () => criarMenu<Item>((i) => i, (item, p) => p.command(item)),
      }),
    ]
  },
})

/** Digitar "@" sugere pessoas da equipe. */
export const mencaoDePessoas = (equipe: Pessoa[]) =>
  Mention.configure({
    HTMLAttributes: { class: 'mencao' },
    suggestion: {
      items: ({ query }) => equipe.filter((p) => p.nome.toLowerCase().includes(query.toLowerCase())).slice(0, 8).map((p) => ({ id: p.id, label: p.nome })),
      render: () => criarMenu<{ id: string; label: string }>((i) => ({ titulo: i.label }), (item, p) => p.command(item)),
    },
  })
