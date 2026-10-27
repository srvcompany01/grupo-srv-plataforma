import 'server-only'
import { mesAnterior, mesesAte } from '@/dominio/performance'
import type { MesDaBase } from '@/dominio/projecao'
import type { MesPerformance } from './performance'

/** Mês de histórico no formato da projeção: leads da Meta (formulário, conversa e site) e do Google separados. */
export const paraBase = (m: MesPerformance): MesDaBase => ({
  investidoMeta: m.investidoMeta, investidoMetaMarca: m.investidoMetaMarca, investidoGoogle: m.investidoGoogle,
  leadsMeta: m.formularios + m.conversas + m.leadsSite, leadsGoogle: Math.round(m.conversoesGoogle), leadsOrganicos: m.leadsOrganicos,
  faturamento: m.faturamento, vendas: m.vendas,
})

/** Os 3 meses fechados antes do mês atual: a base da projeção. */
export const mesesDaBase = (hoje: string) => mesesAte(mesAnterior(hoje.slice(0, 7)), 3)
