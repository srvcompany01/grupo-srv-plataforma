import { rotulo } from '@/lib/ui'
import { CopiarTexto } from './CopiarTexto'

/** Ideia, objetivo e legenda exatamente como digitados (sem caixa alta, com quebras). */
export function TextosPost({ ideia, objetivo, legenda }: { ideia: string; objetivo: string; legenda: string }) {
  return (
    <div className="space-y-5">
      {[
        ['Ideia', ideia],
        ['Objetivo', objetivo],
        ['Legenda', legenda],
      ].map(([titulo, texto]) => (
        <section key={titulo}>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <h3 className={rotulo}>{titulo}</h3>
            {titulo === 'Legenda' && texto && <CopiarTexto texto={texto} rotulo="Copiar legenda" />}
          </div>
          <p className="whitespace-pre-wrap break-words text-[14px] leading-relaxed text-texto">{texto || <span className="text-texto-3">—</span>}</p>
        </section>
      ))}
    </div>
  )
}
