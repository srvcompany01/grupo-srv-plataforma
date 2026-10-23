import { describe, expect, it } from 'vitest'
import { analisarCombinado, analisarOrganico, analisarPago, formatoDoPost, melhorDiaDaSemana, porFormato, type PostIG, type ResumoInstagram } from '@/dominio/insights'

const post = (id: string, formato: PostIG['formato'], interacoes: number, em: string): PostIG => ({ id, legenda: `Post ${id}`, formato, link: '', imagem: null, em, curtidas: interacoes, comentarios: 0, alcance: interacoes * 10, visualizacoes: 0, salvamentos: 0, compartilhamentos: 0, interacoes })
const ig = (posts: PostIG[]): ResumoInstagram => ({ usuario: 'x', seguidores: 1000, alcance: 500, visualizacoes: 900, interacoes: 50, contasEngajadas: 40, curtidas: 40, comentarios: 5, salvamentos: 2, compartilhamentos: 1, novosSeguidores: 10, cliquesPerfil: 3, alcancePorDia: [{ dia: '2026-10-01', valor: 100 }, { dia: '2026-10-02', valor: 50 }], posts })

describe('insights', () => {
  it('formato e agrupamento', () => {
    expect(formatoDoPost('VIDEO', 'REELS')).toBe('Reels')
    expect(formatoDoPost('CAROUSEL_ALBUM', 'FEED')).toBe('Carrossel')
    const ps = [post('a', 'Reels', 100, '2026-10-05T15:00:00Z'), post('b', 'Foto', 10, '2026-10-06T15:00:00Z'), post('c', 'Reels', 80, '2026-10-12T15:00:00Z')]
    expect(porFormato(ps)[0]).toMatchObject({ formato: 'Reels', posts: 2, interacoes: 90 })
    expect(melhorDiaDaSemana(ps)).toEqual({ dia: 'segunda', interacoes: 90 })
  })
  it('orgânico sem posts recomenda frequência', () => {
    const a = analisarOrganico(ig([]), 30)
    expect(a.recomendacoes[0]).toMatch(/Nenhum post/)
  })
  it('orgânico com formatos destaca o melhor', () => {
    const a = analisarOrganico(ig([post('a', 'Reels', 300, '2026-10-05T15:00:00Z'), post('b', 'Foto', 10, '2026-10-06T15:00:00Z'), post('c', 'Foto', 12, '2026-10-07T15:00:00Z')]), 7)
    expect(a.destaques.join(' ')).toMatch(/Reels é o formato que mais engaja/)
    expect(a.recomendacoes.join(' ')).toMatch(/impulsionar/)
  })
  it('pago: CTR baixo e sem conversões', () => {
    const a = analisarPago({ meta: { gasto: 100, impressoes: 10000, alcance: 5000, cliques: 50, ctr: 0.5, anuncios: 3, fracos: 1, frequenciaAlta: 0 }, google: { custo: 50, cliques: 20, conversoes: 0, ctr: 3, custoPorConversao: 0, campanhas: 1 } })
    expect(a.destaques[0]).toMatch(/R\$\s?150,00/)
    expect(a.recomendacoes.join(' ')).toMatch(/CTR abaixo de 1%/)
    expect(a.recomendacoes.join(' ')).toMatch(/sem conversões/)
    expect(analisarPago({ meta: null, google: null }).recomendacoes[0]).toMatch(/Cadastre/)
  })
  it('combinado compara dias com e sem anúncio', () => {
    const a = analisarCombinado(ig([post('a', 'Reels', 100, '2026-10-05T15:00:00Z')]), [{ dia: '2026-10-01', gasto: 10, impressoes: 100, alcance: 80, cliques: 2 }], { meta: { gasto: 10, impressoes: 100, alcance: 80, cliques: 2, ctr: 2, anuncios: 1, fracos: 0, frequenciaAlta: 0 }, google: null })
    expect(a.destaques.join(' ')).toMatch(/100% maior/)
    expect(a.recomendacoes.join(' ')).toMatch(/remarketing/)
  })
})
