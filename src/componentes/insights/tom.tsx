import { CircleAlert, CircleCheck, Info, TriangleAlert, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Tom } from '@/dominio/insights'

/**
 * Cores de status (verde / amarelo / vermelho / cinza), sempre com ícone e texto: quem não distingue vermelho de
 * verde lê pelo ícone (✓, triângulo, círculo com !) e pelo rótulo.
 */
export const ESTILO_TOM: Record<Tom, { icone: LucideIcon; rotulo: string; acao: string; fundo: string; borda: string; texto: string; forte: string }> = {
  bom: { icone: CircleCheck, rotulo: 'Bom', acao: 'Oportunidade', fundo: 'bg-sucesso-fundo/60', borda: 'border-sucesso/30', texto: 'text-sucesso-forte', forte: 'bg-sucesso' },
  atencao: { icone: TriangleAlert, rotulo: 'Atenção', acao: 'Melhorar', fundo: 'bg-aviso-fundo/60', borda: 'border-aviso/40', texto: 'text-aviso-forte', forte: 'bg-aviso' },
  ruim: { icone: CircleAlert, rotulo: 'Crítico', acao: 'Corrigir', fundo: 'bg-perigo-fundo/60', borda: 'border-perigo/30', texto: 'text-perigo-forte', forte: 'bg-perigo' },
  neutro: { icone: Info, rotulo: 'Info', acao: 'Dica', fundo: 'bg-fundo', borda: 'border-borda', texto: 'text-texto-2', forte: 'bg-texto-3' },
}

export const ORDEM_TOM: Record<Tom, number> = { ruim: 0, atencao: 1, bom: 2, neutro: 3 }

/** Selo pequeno: ícone + rótulo na cor do tom. `rotulo` troca o texto padrão. */
export function SeloTom({ tom, rotulo }: { tom: Tom; rotulo?: ReactNode }) {
  const e = ESTILO_TOM[tom]
  const Icone = e.icone
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-micro font-semibold ${e.fundo} ${e.borda} ${e.texto}`}>
      <Icone className="h-3 w-3" aria-hidden /> {rotulo ?? e.rotulo}
    </span>
  )
}
