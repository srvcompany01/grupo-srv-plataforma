'use client'

import { Check, ListFilter, Search, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/componentes/ui/dropdown-menu'
import { descreverAtividade, type NomesAtividade } from '@/dominio/atividade'
import { formatarDataAtividade } from '@/dominio/formatar'
import { filtrarLinhaDoTempo, montarLinhaDoTempo, recortarLinhaDoTempo, type FiltroLinha } from '@/dominio/linha-do-tempo'
import { segmentarTexto } from '@/dominio/mencoes'
import type { Comentario } from '@/servicos/comentarios'
import type { ItemAtividade } from '@/servicos/tarefas'
import { ItemComentario } from './ItemComentario'

const FILTROS: { valor: FiltroLinha; rotulo: string }[] = [
  { valor: 'tudo', rotulo: 'Tudo' },
  { valor: 'comentarios', rotulo: 'Comentários' },
  { valor: 'historico', rotulo: 'Histórico' },
]

/** Texto puro de um comentário (menções viram "@Nome") para a busca. */
function textoComentario(c: Comentario): string {
  const corpo = segmentarTexto(c.texto)
    .map((s) => (s.tipo === 'mencao' ? `@${s.nome}` : s.valor))
    .join('')
  return `${c.autorNome} ${corpo} ${c.anexos.map((a) => a.nome).join(' ')}`
}

export function PainelAtividade({
  atividade,
  comentarios,
  nomes,
  euId,
  rodape,
}: {
  atividade: ItemAtividade[]
  comentarios: Comentario[]
  nomes: NomesAtividade
  euId: string
  /** Caixa de comentário fixa embaixo. */
  rodape: React.ReactNode
}) {
  const [filtro, setFiltro] = useState<FiltroLinha>('tudo')
  const [busca, setBusca] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [expandido, setExpandido] = useState(false)
  const rolagem = useRef<HTMLDivElement>(null)

  const itens = useMemo(() => {
    const todos = montarLinhaDoTempo(atividade, comentarios)
    return filtrarLinhaDoTempo(todos, filtro, busca, (i) => (i.tipo === 'comentario' ? textoComentario(i.item) : descreverAtividade(i.item, nomes)))
  }, [atividade, comentarios, filtro, busca, nomes])
  const { visiveis, ocultos } = recortarLinhaDoTempo(itens, expandido)

  // Vai para o fim ao montar e quando chega comentário novo.
  useEffect(() => {
    const el = rolagem.current
    if (el) el.scrollTop = el.scrollHeight
  }, [comentarios.length])

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center gap-1 border-b border-borda px-4 py-2.5">
        <h2 className="flex-1 text-destaque font-semibold">Atividade</h2>
        <button
          onClick={() => {
            if (buscando) setBusca('')
            setBuscando(!buscando)
          }}
          aria-label="Buscar na atividade"
          className={`rounded p-1.5 hover:bg-hover ${buscando ? 'text-marca' : 'text-texto-3'}`}
        >
          {buscando ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger aria-label="Filtrar atividade" className={`rounded p-1.5 hover:bg-hover ${filtro === 'tudo' ? 'text-texto-3' : 'text-marca'}`}>
            <ListFilter className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {FILTROS.map((f) => (
              <DropdownMenuItem key={f.valor} onSelect={() => setFiltro(f.valor)}>
                <span className="flex-1">{f.rotulo}</span>
                {filtro === f.valor && <Check className="h-4 w-4 text-marca" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {buscando && (
        <div className="shrink-0 border-b border-borda px-4 py-2">
          <input autoFocus value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar na atividade…" aria-label="Buscar na atividade" className="w-full rounded-md border border-borda px-2 py-1 text-corpo outline-none focus:border-marca/40" />
        </div>
      )}

      <div ref={rolagem} className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-3">
        {itens.length === 0 && <p className="text-corpo text-texto-3">{busca || filtro !== 'tudo' ? 'Nada encontrado.' : 'Nenhuma atividade ainda.'}</p>}
        {visiveis.map((i, n) => (
          <div key={i.chave}>
            {ocultos > 0 && n === 1 && (
              <button onClick={() => setExpandido(true)} className="mb-2 w-full rounded-md py-1 text-center text-rotulo font-medium text-marca hover:bg-hover">
                Mostrar mais ({ocultos})
              </button>
            )}
            {i.tipo === 'comentario' ? (
              <ItemComentario c={i.item} meu={i.item.autorId === euId} />
            ) : (
              <div className="flex gap-2 text-rotulo text-texto-2">
                <span className="flex-1">• {descreverAtividade(i.item, nomes)}</span>
                <span className="shrink-0 text-texto-3">{formatarDataAtividade(new Date(i.em))}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="shrink-0 border-t border-borda bg-white p-3">{rodape}</div>
    </div>
  )
}
