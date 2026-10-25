import { describe, expect, it } from 'vitest'
import { analisarCombinado, analisarOrganico, analisarPago, formatoDoPost, melhorDiaDaSemana, metricasOrganicas, porFormato, type PostIG, type ResumoInstagram } from '@/dominio/insights'

const post = (id: string, formato: PostIG['formato'], interacoes: number, em: string): PostIG => ({ id, legenda: `Post ${id}`, formato, link: '', imagem: null, em, curtidas: interacoes, comentarios: 0, alcance: interacoes * 10, visualizacoes: 0, salvamentos: 0, compartilhamentos: 0, interacoes })
const ig = (posts: PostIG[]): ResumoInstagram => ({ usuario: 'x', seguidores: 1000, alcance: 500, visualizacoes: 900, interacoes: 50, contasEngajadas: 40, curtidas: 40, comentarios: 5, salvamentos: 2, compartilhamentos: 1, novosSeguidores: 10, cliquesPerfil: 3, alcancePorDia: [{ dia: '2026-10-01', valor: 100 }, { dia: '2026-10-02', valor: 50 }], posts })

describe('insights', () => {
  it('formato e agrupamento', () => {
    expect(formatoDoPost('VIDEO', 'REELS')).toBe('Reels')
    expect(formatoDoPost('CAROUSEL_ALBUM', 'FEED')).toBe('Carrossel')
    const ps = [post('a', 'Reels', 100, '2026-10-05T15:00:00Z'), post('b', 'Foto', 10, '2026-10-06T15:00:00Z'), post('c', 'Reels', 80, '2026-10-12T15:00:00Z')]
    expect(porFormato(ps)[0]).toMatchObject({ formato: 'Reels', posts: 2, interacoes: 90 })
    expect(melhorDiaDaSemana(ps)).toBeNull() // só 2 segundas: abaixo do mínimo de 3
    expect(melhorDiaDaSemana([...ps, post('d', 'Foto', 90, '2026-10-19T15:00:00Z')])).toEqual({ dia: 'segunda', interacoes: 90 })
  })
  it('orgânico sem posts recomenda frequência', () => {
    const a = analisarOrganico(ig([]), 30)
    expect(a.recomendacoes[0]).toEqual({ tom: 'ruim', texto: expect.stringMatching(/Nenhum post/) })
    expect(a.destaques.map((d) => d.texto).join(' ')).not.toMatch(/anúncios|alcance da conta/)
    expect(a.destaques.map((d) => d.texto).join(' ')).not.toMatch(/Engajamento orgânico/)
  })
  it('orgânico usa só os posts e ignora completamente os totais da conta', () => {
    const conta = { ...ig([post('a', 'Reels', 10, '2026-10-05T15:00:00Z')]), alcance: 100_000, interacoes: 500 }
    const a = analisarOrganico(conta, 7)
    expect(a.destaques).toContainEqual({ tom: 'bom', texto: expect.stringMatching(/Engajamento orgânico de 10%/) })
    expect(a.destaques.map((d) => d.texto).join(' ')).not.toMatch(/100\.000|500|anúncios/)
    expect(metricasOrganicas(conta)).toMatchObject({ posts: 1, alcance: 100, interacoes: 10 })
  })
  it('orgânico com formatos destaca o melhor', () => {
    const cinco = (formato: PostIG['formato'], interacoes: number, dia: number) => Array.from({ length: 5 }, (_, i) => post(`${formato}${i}`, formato, interacoes, `2026-10-${String(dia + i).padStart(2, '0')}T15:00:00Z`))
    const a = analisarOrganico(ig([...cinco('Reels', 300, 1), ...cinco('Foto', 10, 10)]), 30)
    expect(a.destaques).toContainEqual({ tom: 'bom', texto: expect.stringMatching(/Reels é o formato que mais engaja/) })
    expect(a.recomendacoes.map((r) => r.texto).join(' ')).toMatch(/impulsionar/)
  })
  it('pago: CTR baixo e sem conversões', () => {
    const a = analisarPago({ meta: { gasto: 100, impressoes: 10000, alcance: 5000, cliques: 50, ctr: 0.5, anuncios: 3, fracos: 1, frequenciaAlta: 0 }, google: { custo: 50, cliques: 20, conversoes: 0, ctr: 3, custoPorConversao: 0, campanhas: 1 } })
    expect(a.destaques[0].texto).toMatch(/R\$\s?150,00/)
    expect(a.destaques[1].tom).toBe('ruim') // CTR 0,5% no Meta
    expect(a.recomendacoes).toContainEqual({ tom: 'ruim', texto: expect.stringMatching(/CTR abaixo de 1%/) })
    expect(a.recomendacoes.map((r) => r.texto).join(' ')).toMatch(/sem conversões/)
    expect(analisarPago({ meta: null, google: null }).recomendacoes[0].texto).toMatch(/Cadastre/)
  })
  it('combinado compara dias com e sem anúncio', () => {
    const a = analisarCombinado(ig([post('a', 'Reels', 100, '2026-10-05T15:00:00Z')]), [{ dia: '2026-10-01', gasto: 10, impressoes: 100, alcance: 80, cliques: 2 }], { meta: { gasto: 10, impressoes: 100, alcance: 80, cliques: 2, ctr: 2, anuncios: 1, fracos: 0, frequenciaAlta: 0 }, google: null })
    expect(a.destaques).toContainEqual({ tom: 'neutro', texto: expect.stringMatching(/Alcance pago.*posts orgânicos/) })
    expect(a.recomendacoes.map((r) => r.texto).join(' ')).toMatch(/remarketing/)
  })
})

describe('tons (limites iguais em toda a plataforma)', () => {
  it('engajamento, CTR e variação', async () => {
    const { tomEngajamento, tomCtrMeta, tomCtrGoogle, tomVariacao, tomFrequencia } = await import('@/dominio/insights')
    expect([tomEngajamento(5), tomEngajamento(3), tomEngajamento(1), tomEngajamento(0)]).toEqual(['bom', 'atencao', 'ruim', 'neutro'])
    expect([tomCtrMeta(1.5), tomCtrMeta(1.2), tomCtrMeta(0.4)]).toEqual(['bom', 'atencao', 'ruim'])
    expect([tomCtrGoogle(4), tomCtrGoogle(2.5), tomCtrGoogle(1)]).toEqual(['bom', 'atencao', 'ruim'])
    expect([tomVariacao(3), tomVariacao(0), tomVariacao(-2)]).toEqual(['bom', 'neutro', 'ruim'])
    expect([tomFrequencia(4), tomFrequencia(2), tomFrequencia(0.5)]).toEqual(['bom', 'atencao', 'ruim'])
  })
})

describe('P1-5: amostra mínima e sem contradição', () => {
  const p = (id: string, formato: PostIG['formato'], interacoes: number, em: string): PostIG => ({ id, legenda: id, formato, link: '', imagem: null, em, curtidas: interacoes, comentarios: 0, alcance: 50, visualizacoes: 0, salvamentos: 0, compartilhamentos: 0, interacoes })
  const poucos = { usuario: 'x', seguidores: 1000, alcance: 500, visualizacoes: 900, interacoes: 50, contasEngajadas: 40, curtidas: 40, comentarios: 5, salvamentos: 2, compartilhamentos: 1, novosSeguidores: 0, cliquesPerfil: 0, alcancePorDia: [], posts: [p('a', 'Foto', 30, '2026-10-07T15:00:00Z'), p('b', 'Foto', 28, '2026-10-14T15:00:00Z'), p('c', 'Reels', 3, '2026-10-08T15:00:00Z'), p('d', 'Reels', 2, '2026-10-09T15:00:00Z')] }

  it('com menos de 5 posts por formato não recomenda formato, nem dia com menos de 3 posts', () => {
    const a = analisarOrganico(poucos, 14)
    const recs = a.recomendacoes.map((r) => r.texto).join(' | ')
    expect(recs).not.toMatch(/Aumente a proporção/)
    expect(recs).not.toMatch(/Concentre os posts/)
    expect(a.destaques.map((d) => d.texto).join(' ')).toMatch(/poucos posts para comparar formatos/)
  })

  it('não manda priorizar um formato que contradiga o melhor formato', () => {
    const recs = analisarOrganico(poucos, 14).recomendacoes.map((r) => r.texto).join(' | ')
    expect(recs).not.toMatch(/priorize Reels/)
  })
})
