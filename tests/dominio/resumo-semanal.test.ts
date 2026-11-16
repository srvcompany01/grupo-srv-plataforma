import { describe, expect, it } from 'vitest'
import { resumoSemanal } from '@/dominio/resumo-semanal'

describe('resumoSemanal', () => {
  it('compara com a semana anterior', () => {
    const t = resumoSemanal('Aurum', { gasto: 1000, cliques: 500, leads: 50 }, { gasto: 1000, cliques: 400, leads: 40 })!
    expect(t).toMatch(/^Resumo da semana · Aurum: 50 leads \(▲ 25%\)/)
    expect(t).toMatch(/custo por lead R\$\s20,00 \(era R\$\s25,00\)/)
    expect(t).toMatch(/conversão de clique para lead 10% \(era 10%\)/)
  })
  it('marca Atenção quando os leads caem ou o custo sobe 25%', () => {
    expect(resumoSemanal('X', { gasto: 1000, cliques: 500, leads: 20 }, { gasto: 1000, cliques: 500, leads: 40 })).toMatch(/^Atenção · /)
    expect(resumoSemanal('X', { gasto: 1500, cliques: 500, leads: 40 }, { gasto: 1000, cliques: 500, leads: 40 })).toMatch(/^Atenção · /)
    expect(resumoSemanal('X', { gasto: 500, cliques: 100, leads: 0 }, { gasto: 500, cliques: 100, leads: 5 })).toMatch(/^Atenção · .*sem leads na semana/)
  })
  it('sem investimento não avisa; sem semana anterior não compara', () => {
    expect(resumoSemanal('X', { gasto: 0, cliques: 0, leads: 0 }, { gasto: 0, cliques: 0, leads: 0 })).toBeNull()
    expect(resumoSemanal('X', { gasto: 300, cliques: 100, leads: 10 }, { gasto: 0, cliques: 0, leads: 0 })).toMatch(/^Resumo da semana · X: 10 leads, investido/)
  })
})
