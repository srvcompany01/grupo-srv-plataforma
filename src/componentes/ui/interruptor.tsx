'use client'


/** Interruptor 24×14 (medida do ClickUp): ligado na cor de ação do tema, desligado em cinza; bola de 10px. */
export function Interruptor({ marcado, aoMudar, desabilitado, rotulo, className }: { marcado: boolean; aoMudar: (valor: boolean) => void; desabilitado?: boolean; rotulo: string; className?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={marcado}
      aria-label={rotulo}
      disabled={desabilitado}
      onClick={() => aoMudar(!marcado)}
    >
      <span aria-hidden />
    </button>
  )
}
