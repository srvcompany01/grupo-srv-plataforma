import { CopiarTexto } from './CopiarTexto'

/** Ideia, objetivo e legenda exatamente como digitados (sem caixa alta, com quebras). */
export function TextosPost({ ideia, objetivo, legenda }: { ideia: string; objetivo: string; legenda: string }) {
  return (
    <div>
      {[
        ['Ideia', ideia],
        ['Objetivo', objetivo],
        ['Legenda', legenda],
      ].map(([titulo, texto]) => (
        <section key={titulo}>
          <div>
            <h3>{titulo}</h3>
            {titulo === 'Legenda' && texto && <CopiarTexto texto={texto} rotulo="Copiar legenda" />}
          </div>
          <p>{texto || <span>—</span>}</p>
        </section>
      ))}
    </div>
  )
}
