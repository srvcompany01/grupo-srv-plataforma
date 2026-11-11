import type { ReactNode } from 'react'
import { Ic } from '@/componentes/app/Ic'

/**
 * Padrão de tudo que abre ao clicar num campo (status, objetivo, prioridade, responsáveis…): título do campo em cinza,
 * uma linha por opção com a bolinha colorida (ou ícone) e o nome, e o visto à direita na opção marcada.
 */
export function TituloMenu({ children }: { children: ReactNode }) {
  return <p>{children}</p>
}

export function OpcaoMenu({ cor, icone, rotulo, marcado = false, desabilitado = false, aoClicar, suave = false }: {
  cor?: string
  icone?: ReactNode
  rotulo: ReactNode
  marcado?: boolean
  desabilitado?: boolean
  aoClicar: () => void
  /** Opção neutra (ex.: "Vazio"): texto em itálico e mais claro. */
  suave?: boolean
}) {
  return (
    <button type="button" disabled={desabilitado} onClick={aoClicar}>
      {cor && <span aria-hidden="true" style={{ width: 12, height: 12, borderRadius: '50%', background: cor }} />}
      {icone}
      <span>{rotulo}</span>
      {marcado && <Ic n="check" s={18} />}
    </button>
  )
}
