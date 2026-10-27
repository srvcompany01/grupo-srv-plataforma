import { mkdirSync, writeFileSync } from 'node:fs'
import { unzipSync, strFromU8 } from 'fflate'
import { describe, expect, it } from 'vitest'
import { planilhaDoRelatorio, planilhaMensal } from '@/dominio/exportar'
import { mesDoRelatorio, type RelatorioCompartilhado } from '@/dominio/relatorio-compartilhado'
import { coluna, gerarXlsx, nomeDeAba } from '@/dominio/xlsx'

const dados: RelatorioCompartilhado = {
  versao: 4, cliente: 'Aurum Belém', de: '2026-10-01', ate: '2026-10-24', geradoEm: '2026-10-25T12:00:00Z',
  anuncios: { investido: 11449.97, conversas: 491, formularios: 0, conversoesGoogle: 68, cliques: 1, impressoes: 1, custoPorLead: 16.07,
    meta: { investido: 7970.68, leads: 491, conversas: 491, formularios: 0, leadsSite: 0, cliques: 9000, impressoes: 400000, custoPorLead: 16.2, seguidoresAnuncio: 171, captacao: { investido: 5505.79, leads: 491, conversas: 491, formularios: 0, leadsSite: 0, custoPorLead: 11.21, campanhas: 2 }, reconhecimento: { investido: 2464.89, cliquesLink: 7912, visitasPerfil: 7873, custoPorVisitaPerfil: 0.3, seguidoresAnuncio: 171, custoPorSeguidor: 14.02, custoPorClique: 0.31, campanhas: 1 } },
    google: { investido: 3479.29, leads: 68, conversas: 0, formularios: 0, leadsSite: 0, cliques: 900, impressoes: 10000, custoPorLead: 51.16 } },
  instagram: { usuario: 'aurumbelem', seguidores: 5200, novosSeguidores: 340, seguidoresGanhos: 400, seguidoresPerdidos: 60, seguidoresPagos: 171, seguidoresOrganicos: 229, alcance: 1012, alcancePosts: 1012, visualizacoes: 9000, interacoes: 1200, posts: 12, engajamentoPosts: 3.1, melhorPost: null },
  gmn: { nota: 4.9, avaliacoes: 391, saude: 88, geogrid: null },
  bio: { cliques: 100, visualizacoes: 85, pessoas: 70, toques: 64, leadsOrganicos: 50, botoes: [{ rotulo: 'WhatsApp', toques: 50 }, { rotulo: 'Localização', toques: 14 }] },
  campanhas: [{ plataforma: 'meta', nome: 'CBO / TRAF-INSTA', ativa: true, papel: 'marca', gasto: 2397.3, resultado: 7912, rotuloResultado: 'cliques no link', custoPorResultado: 0.3 }],
  destaques: ['Top 3 em 98,8% da região'],
  resultados: { mes: '2026-10', emAndamento: true, atual: mesDoRelatorio({ mes: '2026-10', investidoMeta: 7970.68, investidoGoogle: 3479.29, formularios: 0, conversas: 491, leadsSite: 0, conversoesGoogle: 68, leadsOrganicos: 50, cliquesLinkBio: 200, cliquesPerfilInstagram: null, faturamento: 80000, vendas: 20 }, true), meses: [mesDoRelatorio({ mes: '2026-09', investidoMeta: 8983.62, investidoGoogle: 696.47, formularios: 0, conversas: 440, leadsSite: 318, conversoesGoogle: 8, leadsOrganicos: 0, cliquesLinkBio: 0, cliquesPerfilInstagram: 0, faturamento: null, vendas: null }, true)] },
}

describe('planilha .xlsx', () => {
  it('colunas e nomes de aba válidos', () => {
    expect([0, 25, 26, 27, 701, 702].map(coluna)).toEqual(['A', 'Z', 'AA', 'AB', 'ZZ', 'AAA'])
    const usados = new Set<string>()
    expect(nomeDeAba('Meta [Ads]: tudo/mais?', usados)).toBe('Meta  Ads   tudo mais')
    expect(nomeDeAba('Meta [Ads]: tudo/mais?', usados)).toBe('Meta  Ads   tudo mais 2')
    expect(nomeDeAba('x'.repeat(50), usados)).toHaveLength(31)
  })

  it('o arquivo tem as partes do formato, com texto escapado e números formatados', () => {
    const bytes = gerarXlsx([{ nome: 'Resumo', linhas: [['Indicador', 'Valor'], ['A & B <c>', { v: 1234.5, f: 'moeda' }], ['Vazio', null], ['Inteiro', { v: 7, f: 'inteiro' }]] }, { nome: 'Outra', linhas: [['x']] }])
    const z = unzipSync(bytes)
    expect(Object.keys(z).sort()).toEqual(['[Content_Types].xml', '_rels/.rels', 'xl/_rels/workbook.xml.rels', 'xl/styles.xml', 'xl/workbook.xml', 'xl/worksheets/sheet1.xml', 'xl/worksheets/sheet2.xml'])
    const aba = strFromU8(z['xl/worksheets/sheet1.xml'])
    expect(aba).toContain('A &amp; B &lt;c&gt;')
    expect(aba).toContain('<c r="B2" s="2"><v>1234.5</v></c>')
    expect(aba).toContain('<c r="B1" t="inlineStr" s="1">')
    expect(aba).not.toContain('r="B3"')
    expect(strFromU8(z['xl/workbook.xml'])).toContain('<sheet name="Outra" sheetId="2" r:id="rId2"/>')
    // Deixa o arquivo na pasta de rascunho para abrir no Excel/Planilhas e conferir à mão.
    if (process.env.XLSX_SAIDA) {
      mkdirSync(process.env.XLSX_SAIDA, { recursive: true })
      writeFileSync(`${process.env.XLSX_SAIDA}/teste.xlsx`, bytes)
    }
  })

  it('o relatório do cliente vira abas com os mesmos números (Meta e Google separados)', () => {
    const abas = planilhaDoRelatorio(dados, ['Cliente sem WhatsApp'])
    expect(abas.map((a) => a.nome)).toEqual(['Resumo', 'Resultado do mês', 'Mês a mês', 'Meta Ads', 'Google Ads', 'Instagram', 'Google Meu Negócio', 'Link da bio', 'Campanhas', 'Destaques e avisos'])
    const resumo = Object.fromEntries(abas[0].linhas.slice(1).map((l) => [l[0] as string, l[1]]))
    expect(resumo['Investido na Meta']).toEqual({ v: 7970.68, f: 'moeda' })
    expect(resumo['Investido no Google Ads']).toEqual({ v: 3479.29, f: 'moeda' })
    expect(resumo['Leads orgânicos (quiz da bio)']).toEqual({ v: 50, f: 'inteiro' })
    expect(resumo['  orgânicos']).toEqual({ v: 229, f: 'inteiro' })
    const res = Object.fromEntries(abas.find((a) => a.nome === 'Resultado do mês')!.linhas.slice(1).map((l) => [l[0] as string, l[1]]))
    expect(res['Faturamento']).toEqual({ v: 80000, f: 'moeda' })
    expect(res['Vendas']).toEqual({ v: 20, f: 'inteiro' })
    expect(res['ROAS']).toMatchObject({ f: 'decimal' })
    expect(abas.find((a) => a.nome === 'Mês a mês')!.linhas).toHaveLength(2)
    const bio = abas.find((a) => a.nome === 'Link da bio')!
    expect(bio.linhas.some((l) => l[0] === 'WhatsApp' && (l[1] as { v: number }).v === 50)).toBe(true)
    const camps = abas.find((a) => a.nome === 'Campanhas')!
    expect(camps.linhas[1].slice(0, 4)).toEqual(['Meta', 'CBO / TRAF-INSTA', 'sim', 'marca'])
  })

  it('tabela mensal de clientes: total, leads, CPL e ROAS por linha', () => {
    const [aba] = planilhaMensal('outubro de 2026', [{ rotulo: 'Aurum', m: { investidoMeta: 1000, investidoGoogle: 500, formularios: 0, conversas: 100, leadsSite: 0, conversoesGoogle: 20, leadsOrganicos: 30, cliquesLinkBio: 200, cliquesPerfilInstagram: null, faturamento: 15000, vendas: null } }])
    expect(aba.linhas[0][1]).toBe('Investido total')
    expect(aba.linhas[1]).toEqual(['Aurum', { v: 1500, f: 'moeda' }, { v: 1000, f: 'moeda' }, { v: 500, f: 'moeda' }, { v: 120, f: 'inteiro' }, { v: 30, f: 'inteiro' }, { v: 12.5, f: 'moeda' }, { v: 200, f: 'inteiro' }, null, { v: 15000, f: 'moeda' }, null, { v: 10, f: 'decimal' }])
  })
})
