import type { IconeStatusInfo } from '@/dominio/status-icone'

/**
 * Ícone do status (como no ClickUp): círculo tracejado vazio = a fazer; fatia que cresce a cada etapa = em andamento;
 * círculo cheio com visto = concluído. `cor` pinta o contorno e o preenchimento; `fundo` é a cor do visto.
 */
export function IconeStatus({ info, cor, fundo = '#ffffff', className = 'h-3.5 w-3.5', tracejado = true }: { info: IconeStatusInfo; cor: string; fundo?: string; className?: string; /** "A fazer" com contorno tracejado (padrão) ou liso. */ tracejado?: boolean }) {
  const { categoria, fracao } = info
  const raio = 3.4
  const ang = fracao * 2 * Math.PI
  const x = 8 + raio * Math.sin(ang)
  const y = 8 - raio * Math.cos(ang)
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={`shrink-0 ${className}`}>
      {categoria === 'done' ? (
        <>
          <circle cx="8" cy="8" r="7" fill={cor} />
          <path d="M4.9 8.2l2.2 2.2 4-4.4" fill="none" stroke={fundo} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </>
      ) : (
        <>
          <circle cx="8" cy="8" r="6.3" fill="none" stroke={cor} strokeWidth="1.5" strokeDasharray={categoria === 'todo' && tracejado ? '2.4 2' : undefined} />
          {categoria === 'in_progress' && fracao > 0 && (
            <path d={fracao >= 0.999 ? `M8 ${8 - raio}A${raio} ${raio} 0 1 1 7.99 ${8 - raio}Z` : `M8 8L8 ${8 - raio}A${raio} ${raio} 0 ${fracao > 0.5 ? 1 : 0} 1 ${x.toFixed(2)} ${y.toFixed(2)}Z`} fill={cor} />
          )}
        </>
      )}
    </svg>
  )
}
