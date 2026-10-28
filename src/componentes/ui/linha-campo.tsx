import { ChevronRight, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Interruptor } from './interruptor'

/** Grupo de linhas de um painel lateral (como "Personalizar visualização"): legenda cinza de 12px e linhas de 28px. */
export function GrupoCampos({ legenda, children }: { legenda?: string; children: ReactNode }) {
  return (
    <fieldset className="px-2 py-1">
      {legenda && <legend className="px-3 py-2 text-rotulo text-texto-3">{legenda}</legend>}
      {children}
    </fieldset>
  )
}

const base = 'flex min-h-7 w-full items-center gap-3 rounded-[7px] px-3 py-1 text-destaque text-texto'

/** Linha com rótulo e interruptor à direita; ícone opcional à esquerda. */
export function LinhaInterruptor({ rotulo, marcado, aoMudar, Icone }: { rotulo: string; marcado: boolean; aoMudar: (v: boolean) => void; Icone?: LucideIcon }) {
  return (
    <label className={`${base} cursor-pointer hover:bg-hover`}>
      {Icone && <Icone className="h-4 w-4 shrink-0 text-texto-3" aria-hidden />}
      <span className="min-w-0 flex-1 truncate">{rotulo}</span>
      <Interruptor marcado={marcado} aoMudar={aoMudar} rotulo={rotulo} />
    </label>
  )
}

/** Linha que abre algo: ícone, rótulo, valor atual em cinza (12px) e seta à direita. */
export function LinhaBotao({ rotulo, valor, Icone, aoClicar }: { rotulo: string; valor?: string; Icone?: LucideIcon; aoClicar?: () => void }) {
  return (
    <button type="button" onClick={aoClicar} className={`${base} text-left transition-colors hover:bg-hover`}>
      {Icone && <Icone className="h-4 w-4 shrink-0 text-texto-3" aria-hidden />}
      <span className="min-w-0 flex-1 truncate">{rotulo}</span>
      {valor && <span className="shrink-0 text-rotulo text-texto-3">{valor}</span>}
      <ChevronRight className="h-4 w-4 shrink-0 text-texto-3" aria-hidden />
    </button>
  )
}
