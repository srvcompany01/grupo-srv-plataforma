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
    <div className="ta-ativ">
      <div className="ta-ativ-cab">
        <h2>Atividade</h2>
        <button
          onClick={() => {
            if (buscando) setBusca('')
            setBuscando(!buscando)
          }}
          aria-label="Buscar na atividade"
        >
          {buscando ? <X /> : <Search />}
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger aria-label="Filtrar atividade">
            <ListFilter />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {FILTROS.map((f) => (
              <DropdownMenuItem key={f.valor} onSelect={() => setFiltro(f.valor)}>
                <span>{f.rotulo}</span>
                {filtro === f.valor && <Check />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {buscando && (
        <div>
          <input autoFocus value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar na atividade…" aria-label="Buscar na atividade" />
        </div>
      )}

      <div ref={rolagem} className="ta-ativ-lista">
        {itens.length === 0 && <p>{busca || filtro !== 'tudo' ? 'Nada encontrado.' : 'Nenhuma atividade ainda.'}</p>}
        {visiveis.map((i, n) => (
          <div key={i.chave}>
            {ocultos > 0 && n === 1 && (
              <button onClick={() => setExpandido(true)}>
                Mostrar mais ({ocultos})
              </button>
            )}
            {i.tipo === 'comentario' ? (
              <ItemComentario c={i.item} meu={i.item.autorId === euId} />
            ) : (
              <div className="ta-evento">
                <span>• {descreverAtividade(i.item, nomes)}</span>
                <span>{formatarDataAtividade(new Date(i.em))}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="ta-ativ-rodape">{rodape}</div>
    </div>
  )
}
