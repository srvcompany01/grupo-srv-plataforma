import { describe, expect, it } from 'vitest'
import { saudeDaConta } from '@/dominio/insights'

const post = (alcance: number, interacoes: number) => ({ id: 'x', legenda: '', formato: 'Reels' as const, link: '', imagem: null, em: '2026-11-01T12:00:00Z', curtidas: interacoes, comentarios: 0, alcance, visualizacoes: 0, salvamentos: 0, compartilhamentos: 0, interacoes })

describe('saúde da conta', () => {
  it('sem posts e sem variação não há nota', () => {
    expect(saudeDaConta({ posts: [], seguidores: 0, novosSeguidores: 0 }, 7)?.nota ?? null).toBeNull()
  })
  it('conta forte fica Boa e conta parada fica Ruim', () => {
    const forte = saudeDaConta({ posts: [post(500, 40), post(500, 40), post(500, 40)], seguidores: 1000, novosSeguidores: 20 }, 7)
    expect(forte?.tom).toBe('bom')
    const fraca = saudeDaConta({ posts: [post(10000, 10)], seguidores: 1000, novosSeguidores: -5 }, 30)
    expect(fraca?.tom).toBe('ruim')
  })
})
