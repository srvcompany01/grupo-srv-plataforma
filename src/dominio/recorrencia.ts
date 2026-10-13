export type Frequencia = 'daily' | 'weekly' | 'monthly'

export type Recorrencia = { frequencia: Frequencia; cada: number; antecedencia: number; ativa: boolean; geradas: number; primeiroPrazo: string }

export const FREQUENCIAS: { valor: Frequencia; singular: string; plural: string }[] = [
  { valor: 'daily', singular: 'dia', plural: 'dias' },
  { valor: 'weekly', singular: 'semana', plural: 'semanas' },
  { valor: 'monthly', singular: 'mês', plural: 'meses' },
]

/** "Repete todo mês" / "Repete a cada 2 semanas". */
export function descreverRecorrencia(r: Pick<Recorrencia, 'frequencia' | 'cada'>): string {
  const f = FREQUENCIAS.find((x) => x.valor === r.frequencia)!
  if (r.cada === 1) return `Repete ${r.frequencia === 'monthly' ? 'todo' : 'toda'} ${f.singular}`
  return `Repete a cada ${r.cada} ${f.plural}`
}
