import { ROTULO_PRIORIDADE, type Prioridade } from '@/dominio/tarefas'

// Cores da especificação de design. Normal usa o estilo "Média". O rótulo escrito garante que a cor não é o único sinal.
const ESTILO: Record<Prioridade, { fundo: string; texto: string }> = {
  urgente: { fundo: '#f8d6d3', texto: '#a92727' },
  alta: { fundo: '#f9dedc', texto: '#b93b3b' },
  normal: { fundo: '#fbe9b9', texto: '#8c6417' },
  baixa: { fundo: '#dcefe3', texto: '#216d4d' },
}

export function SeloPrioridade({ prioridade }: { prioridade: Prioridade }) {
  const e = ESTILO[prioridade]
  return (
    <span className="inline-flex items-center rounded-md px-2 py-0.5 text-legenda font-semibold" style={{ background: e.fundo, color: e.texto }}>
      {ROTULO_PRIORIDADE[prioridade]}
    </span>
  )
}
