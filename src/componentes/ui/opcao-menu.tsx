import type { ReactNode } from 'react'
import { Ic } from '@/componentes/app/Ic'

/**
 * Padrão de tudo que abre ao clicar num campo (status, objetivo, prioridade, responsáveis…): título do campo em cinza,
 * uma linha por opção com a bolinha colorida (ou ícone) e o nome, e o visto à direita na opção marcada.
 */
export function TituloMenu({ children }: { children: ReactNode }) {
  return <p className="px-2.5 pb-1.5 pt-2 text-[13px] font-semibold tracking-[0.02em] text-texto-3">{children}</p>
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
    <button type="button" disabled={desabilitado} onClick={aoClicar} className="flex min-h-[34px] w-full items-center gap-3 rounded-md px-2.5 text-left text-[14px] hover:bg-[var(--bg-hover)] disabled:opacity-60">
      {cor && <span aria-hidden="true" className="shrink-0" style={{ width: 12, height: 12, borderRadius: '50%', background: cor }} />}
      {icone}
      <span className={`min-w-0 flex-1 truncate ${suave ? 'italic text-texto-2' : ''}`}>{rotulo}</span>
      {marcado && <Ic n="check" s={18} className="text-texto-2" />}
    </button>
  )
}
