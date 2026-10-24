import { describe, expect, it } from 'vitest'
import { classificarPost, lerAnalise, referenciaDe, type MetricasPost } from '@/dominio/insights-post'

const post = (visualizacoes: number, interacoes: number, extra: Partial<MetricasPost> = {}): MetricasPost => ({ visualizacoes, alcance: visualizacoes * 0.8, curtidas: interacoes, comentarios: 0, salvamentos: 0, compartilhamentos: 0, interacoes, ...extra })

describe('insight do post', () => {
  const base = [post(1000, 30), post(1200, 40), post(800, 25), post(1100, 35)]

  it('compara com a mediana do perfil', () => {
    const ref = referenciaDe(base)
    expect(ref.visualizacoes).toBe(1050)
    expect(classificarPost(post(3000, 150, { compartilhamentos: 20 }), ref).nota).toBe('bom')
    expect(classificarPost(post(1050, 35), ref).nota).toBe('mediano')
    expect(classificarPost(post(300, 3), ref).nota).toBe('ruim')
  })

  it('sem base, usa a taxa de engajamento', () => {
    const ref = referenciaDe([post(100, 1)])
    expect(classificarPost(post(1000, 50), ref).nota).toBe('bom')
    expect(classificarPost(post(1000, 10), ref).nota).toBe('ruim')
  })

  it('lê a análise da IA e recusa resposta vazia', () => {
    expect(lerAnalise('```json\n{"tipo":"tutorial","resumo":"Foi bem.","deuCerto":["Gancho forte",""],"replicar":["Mais tutoriais"]}\n```')).toEqual({ tipo: 'tutorial', resumo: 'Foi bem.', deuCerto: ['Gancho forte'], naoDeuCerto: [], replicar: ['Mais tutoriais'], evitar: [] })
    expect(lerAnalise('{"resumo":""}')).toBeNull()
    expect(lerAnalise('não é json')).toBeNull()
  })
})
