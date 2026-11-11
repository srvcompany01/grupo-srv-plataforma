import { ChevronRight, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Interruptor } from './interruptor'

/** Grupo de linhas de um painel lateral (como "Personalizar visualização"): legenda cinza de 12px e linhas de 28px. */
export function GrupoCampos({ legenda, children }: { legenda?: string; children: ReactNode }) {
  return (
    <fieldset>
      {legenda && <legend>{legenda}</legend>}
      {children}
    </fieldset>
  )
}


/** Linha com rótulo e interruptor à direita; ícone opcional à esquerda. */
export function LinhaInterruptor({ rotulo, marcado, aoMudar, Icone }: { rotulo: string; marcado: boolean; aoMudar: (v: boolean) => void; Icone?: LucideIcon }) {
  return (
    <label>
      {Icone && <Icone aria-hidden />}
      <span>{rotulo}</span>
      <Interruptor marcado={marcado} aoMudar={aoMudar} rotulo={rotulo} />
    </label>
  )
}

/** Linha que abre algo: ícone, rótulo, valor atual em cinza (12px) e seta à direita. */
export function LinhaBotao({ rotulo, valor, Icone, aoClicar }: { rotulo: string; valor?: string; Icone?: LucideIcon; aoClicar?: () => void }) {
  return (
    <button type="button" onClick={aoClicar}>
      {Icone && <Icone aria-hidden />}
      <span>{rotulo}</span>
      {valor && <span>{valor}</span>}
      <ChevronRight aria-hidden />
    </button>
  )
}
