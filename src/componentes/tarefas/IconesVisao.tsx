import { Ic } from '@/componentes/app/Ic'
import type { VisaoTarefas } from '@/dominio/filtros'

/** Cor de cada tipo de visualização (protótipo do redesign). */
export const COR_VISAO: Record<VisaoTarefas | 'canal', string> = {
  canal: '#6d3fe0',
  lista: '#52525b',
  calendario: '#e0620d',
  kanban: '#7c3aed',
  tabela: '#0d9488',
  galeria: '#db2777',
  cronograma: '#b45309',
  carga: '#16a34a',
  atividade: '#71717a',
  painel: '#d80d12',
  documentos: '#1d6fe0',
}

/** Glifo Material Symbols de cada visualização. */
export const GLIFO_VISAO: Record<VisaoTarefas | 'canal', string> = {
  canal: 'tag',
  lista: 'format_list_bulleted',
  calendario: 'calendar_month',
  kanban: 'view_kanban',
  tabela: 'table_chart',
  galeria: 'photo_library',
  cronograma: 'timeline',
  carga: 'stacked_bar_chart',
  atividade: 'history',
  painel: 'dashboard',
  documentos: 'article',
}

/** Quadradinho colorido 16×16 (raio 4) com o glifo branco preenchido de 12px. */
export function IconeVisao({ visao, className }: { visao: VisaoTarefas | 'canal'; className?: string }) {
  return (
    <span className={className} style={{ width: 16, height: 16, flex: 'none', borderRadius: 4, background: COR_VISAO[visao], color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <Ic n={GLIFO_VISAO[visao]} s={12} fill w={500} />
    </span>
  )
}
