import { describe, expect, it } from 'vitest'
import { calcularCarga } from '@/dominio/carga'
import type { TarefaResumo } from '@/dominio/tarefas'

const ana = { id: 'a', nome: 'Ana', avatar: null }
const t = (prazo: string | null, resp = [ana], concluidaEm: string | null = null) => ({ prazo, responsaveis: resp, concluidaEm }) as unknown as TarefaResumo

describe('calcularCarga', () => {
  it('separa atrasadas, dias, depois e sem data; ignora concluídas', () => {
    const [l] = calcularCarga([t('2026-10-27'), t('2026-10-28'), t('2026-10-30'), t('2026-12-01'), t(null), t('2026-10-28', [ana], 'x')], '2026-10-28')
    expect(l).toMatchObject({ atrasadas: 1, depois: 1, semData: 1, total: 5 })
    expect(l.dias[0]).toBe(1)
    expect(l.dias[2]).toBe(1)
  })
  it('sem responsável vira linha própria', () => {
    expect(calcularCarga([t('2026-10-28', [])], '2026-10-28')[0].pessoa).toBeNull()
  })
})
