import type { VisaoTarefas } from '@/dominio/filtros'

/** Cor de cada tipo de visualização: lista amarela, quadro azul, calendário laranja, painel verde. */
export const COR_VISAO: Record<VisaoTarefas, string> = { lista: '#f2b01e', kanban: '#3e78b8', calendario: '#f76808', painel: '#22865d', documentos: '#7c5cd6' }

/** Ícones preenchidos (não só linhas). O desenho é branco sobre um quadrado arredondado colorido. */
export function IconeVisao({ visao, className = 'h-4 w-4' }: { visao: VisaoTarefas; className?: string }) {
  const cor = COR_VISAO[visao]
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <rect x="2" y="2" width="20" height="20" rx="5" fill={cor} />
      {visao === 'lista' && <path d="M7 8.5h10M7 12h10M7 15.5h6.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" />}
      {visao === 'kanban' && (
        <g fill="#fff">
          <rect x="6" y="6.5" width="3.4" height="11" rx="1.2" />
          <rect x="10.3" y="6.5" width="3.4" height="7.5" rx="1.2" />
          <rect x="14.6" y="6.5" width="3.4" height="9.5" rx="1.2" />
        </g>
      )}
      {visao === 'documentos' && (
        <g fill="#fff">
          <path d="M7.5 5h6l3.5 3.5V17a2 2 0 0 1-2 2H7.5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
          <path d="M9 12.5h6M9 15.5h4" stroke={cor} strokeWidth="1.4" strokeLinecap="round" fill="none" />
        </g>
      )}
      {visao === 'painel' && (
        <g fill="#fff">
          <rect x="6" y="12" width="3" height="6" rx="1" />
          <rect x="10.5" y="7" width="3" height="11" rx="1" />
          <rect x="15" y="9.5" width="3" height="8.5" rx="1" />
        </g>
      )}
      {visao === 'calendario' && (
        <g fill="#fff">
          <rect x="6" y="5" width="2.2" height="3.4" rx="1" />
          <rect x="15.8" y="5" width="2.2" height="3.4" rx="1" />
          <rect x="6" y="9.5" width="12" height="8.5" rx="2" />
        </g>
      )}
    </svg>
  )
}
