import type { RelatorioCompartilhado } from './relatorio-compartilhado'
import type { AbaPlanilha, Celula } from './xlsx'

/** Monta as abas da planilha a partir dos MESMOS números do panorama e do relatório do cliente (uma conta só). */

const moeda = (v: number | null | undefined): Celula => (v == null ? null : { v, f: 'moeda' })
const inteiro = (v: number | null | undefined): Celula => (v == null ? null : { v, f: 'inteiro' })
const dec = (v: number | null | undefined): Celula => (v == null ? null : { v, f: 'decimal' })
const pct = (v: number | null | undefined): Celula => (v == null ? null : { v, f: 'pct' })

type Linha = [string, Celula]
const aba = (nome: string, linhas: Linha[], cabecalho: [string, string] = ['Indicador', 'Valor']): AbaPlanilha => ({ nome, linhas: [[...cabecalho], ...linhas.filter(([, v]) => v !== null)], larguras: [44, 22] })
const data = (d: string) => d.split('-').reverse().join('/')

export function planilhaDoRelatorio(d: RelatorioCompartilhado, avisos: string[]): AbaPlanilha[] {
  const meta = d.anuncios?.meta ?? null
  const google = d.anuncios?.google ?? null
  const ig = d.instagram
  const bio = d.bio
  const investidoTotal = (meta?.investido ?? 0) + (google?.investido ?? 0)
  const abas: AbaPlanilha[] = []

  abas.push(aba('Resumo', [
    ['Cliente', d.cliente],
    ['Período', `${data(d.de)} a ${data(d.ate)}`],
    ['Investido total (Meta + Google)', meta || google ? moeda(investidoTotal) : null],
    ['Investido na Meta', moeda(meta?.investido)],
    ['Investido no Google Ads', moeda(google?.investido)],
    ['Leads da Meta (captação)', meta ? inteiro(meta.captacao?.leads ?? meta.leads) : null],
    ['Custo por lead da Meta (captação)', moeda(meta?.captacao?.custoPorLead ?? meta?.custoPorLead)],
    ['Conversões do Google Ads', google ? dec(google.leads) : null],
    ['Custo por conversão do Google', moeda(google?.custoPorLead)],
    ['Seguidores ganhos', ig?.seguidoresGanhos != null ? inteiro(ig.seguidoresGanhos) : null],
    ['  pelos anúncios', ig?.seguidoresPagos != null ? inteiro(ig.seguidoresPagos) : null],
    ['  orgânicos', ig?.seguidoresOrganicos != null ? inteiro(ig.seguidoresOrganicos) : null],
    ['Deixaram de seguir', ig?.seguidoresPerdidos != null ? inteiro(ig.seguidoresPerdidos) : null],
    ['Cliques no link da bio', bio ? inteiro(bio.cliques ?? bio.visitas ?? 0) : null],
    ['Visualizações da página da bio', bio?.visualizacoes != null ? inteiro(bio.visualizacoes) : null],
    ['Leads orgânicos (WhatsApp da bio)', bio?.leadsOrganicos != null ? inteiro(bio.leadsOrganicos) : null],
    ['Nota no Google', d.gmn?.nota != null ? dec(d.gmn.nota) : null],
    ['Avaliações no Google', d.gmn ? inteiro(d.gmn.avaliacoes) : null],
  ]))

  if (meta) {
    abas.push(aba('Meta Ads', [
      ['Investido total', moeda(meta.investido)],
      ['Captação · investido', moeda(meta.captacao?.investido)],
      ['Captação · leads', inteiro(meta.captacao?.leads)],
      ['  conversas (WhatsApp/Direct)', inteiro(meta.captacao?.conversas)],
      ['  formulários', inteiro(meta.captacao?.formularios)],
      ['  site', inteiro(meta.captacao?.leadsSite)],
      ['Captação · custo por lead', moeda(meta.captacao?.custoPorLead)],
      ['Reconhecimento / tráfego · investido', moeda(meta.reconhecimento?.investido)],
      ['  visitas ao perfil', inteiro(meta.reconhecimento?.visitasPerfil)],
      ['  custo por visita ao perfil', moeda(meta.reconhecimento?.custoPorVisitaPerfil)],
      ['  cliques no link', inteiro(meta.reconhecimento?.cliquesLink)],
      ['  custo por clique', moeda(meta.reconhecimento?.custoPorClique)],
      ['Seguidores pelos anúncios (todas as campanhas)', inteiro(meta.seguidoresAnuncio)],
      ['  custo por seguidor (campanhas de perfil)', moeda(meta.reconhecimento?.custoPorSeguidor)],
      ['Cliques', inteiro(meta.cliques)],
      ['Impressões', inteiro(meta.impressoes)],
    ]))
  }
  if (google) {
    abas.push(aba('Google Ads', [
      ['Investido', moeda(google.investido)],
      ['Conversões', dec(google.leads)],
      ['Custo por conversão', moeda(google.custoPorLead)],
      ['Cliques', inteiro(google.cliques)],
      ['Impressões', inteiro(google.impressoes)],
    ]))
  }
  if (ig) {
    abas.push(aba('Instagram', [
      ['Perfil', `@${ig.usuario}`],
      ['Seguidores (total)', inteiro(ig.seguidores)],
      ['Seguidores ganhos', inteiro(ig.seguidoresGanhos)],
      ['  pelos anúncios', inteiro(ig.seguidoresPagos)],
      ['  orgânicos', inteiro(ig.seguidoresOrganicos)],
      ['Deixaram de seguir', inteiro(ig.seguidoresPerdidos)],
      ['Saldo do período', inteiro(ig.novosSeguidores)],
      ['Alcance dos posts (orgânico)', inteiro(ig.alcancePosts ?? ig.alcance)],
      ['Visualizações dos posts', inteiro(ig.visualizacoes)],
      ['Interações', inteiro(ig.interacoes)],
      ['Posts', inteiro(ig.posts)],
      ['Engajamento dos posts', pct(ig.engajamentoPosts)],
    ]))
  }
  if (d.gmn || d.meuNegocio) {
    const n = d.meuNegocio
    abas.push(aba('Google Meu Negócio', [
      ['Nota', d.gmn?.nota != null ? dec(d.gmn.nota) : null],
      ['Avaliações', d.gmn ? inteiro(d.gmn.avaliacoes) : null],
      ['Saúde do perfil (0 a 100)', d.gmn ? inteiro(d.gmn.saude) : null],
      ['Geogrid · top 3', d.gmn?.geogrid ? pct(d.gmn.geogrid.metricas.top3) : null],
      ['Geogrid · 1º lugar', d.gmn?.geogrid?.primeiro != null ? pct(d.gmn.geogrid.primeiro) : null],
      ['Visualizações do perfil', inteiro(n?.visualizacoes)],
      ['  na Busca', inteiro(n?.buscas)],
      ['  no Maps', inteiro(n?.mapas)],
      ['Ligações', inteiro(n?.ligacoes)],
      ['Pedidos de rota', inteiro(n?.rotas)],
      ['Cliques no site', inteiro(n?.site)],
      ['Avaliações novas no período', inteiro(n?.avaliacoes?.novas)],
    ]))
  }
  if (bio) {
    const linhas: Celula[][] = [['Botão', 'Toques'], ...bio.botoes.map((b): Celula[] => [b.rotulo, inteiro(b.toques)])]
    abas.push({
      nome: 'Link da bio',
      larguras: [44, 22],
      linhas: [
        ['Indicador', 'Valor'],
        ['Cliques no link da bio', inteiro(bio.cliques ?? bio.visitas ?? 0)],
        ['Visualizações da página', inteiro(bio.visualizacoes)],
        ['Pessoas distintas por dia (somadas)', inteiro(bio.pessoas)],
        ['Toques nos botões', inteiro(bio.toques)],
        ['Leads orgânicos (toques no WhatsApp)', inteiro(bio.leadsOrganicos)],
        [],
        ...linhas,
      ],
    })
  }
  if (d.campanhas?.length) {
    abas.push({
      nome: 'Campanhas',
      larguras: [12, 52, 10, 10, 16, 14, 18, 20],
      linhas: [
        ['Plataforma', 'Campanha', 'Ativa', 'Papel', 'Investido', 'Resultado', 'Tipo de resultado', 'Custo por resultado'],
        ...d.campanhas.map((c): Celula[] => [c.plataforma === 'meta' ? 'Meta' : 'Google', c.nome, c.ativa ? 'sim' : 'não', c.papel === 'lead' ? 'captação' : 'marca', moeda(c.gasto), dec(c.resultado), c.rotuloResultado, moeda(c.custoPorResultado)]),
      ],
    })
  }
  const notas: Celula[][] = [['Tipo', 'Texto'], ...d.destaques.map((t): Celula[] => ['Destaque', t]), ...avisos.map((t): Celula[] => ['Ponto de atenção (equipe)', t])]
  if (notas.length > 1) abas.push({ nome: 'Destaques e avisos', linhas: notas, larguras: [26, 110] })
  return abas
}

/** Mesma linha da tabela mês a mês da Performance. */
export type LinhaMes = { investidoMeta: number; investidoGoogle: number; formularios: number; conversas: number; leadsSite: number; conversoesGoogle: number; leadsOrganicos: number; cliquesLinkBio: number; cliquesPerfilInstagram: number | null; faturamento: number | null; vendas: number | null }

export function planilhaMensal(titulo: string, linhas: { rotulo: string; m: LinhaMes }[]): AbaPlanilha[] {
  const dados = linhas.map(({ rotulo, m }): Celula[] => {
    const investido = m.investidoMeta + m.investidoGoogle
    const leadsPagos = m.formularios + m.conversas + m.leadsSite + Math.round(m.conversoesGoogle)
    return [
      rotulo, moeda(investido), moeda(m.investidoMeta), moeda(m.investidoGoogle), inteiro(leadsPagos), inteiro(m.leadsOrganicos),
      investido && leadsPagos ? moeda(investido / leadsPagos) : null, inteiro(m.cliquesLinkBio), inteiro(m.cliquesPerfilInstagram),
      moeda(m.faturamento), inteiro(m.vendas), m.faturamento != null && investido ? dec(m.faturamento / investido) : null,
    ]
  })
  return [{
    nome: titulo,
    larguras: [34, 16, 16, 16, 12, 16, 14, 16, 18, 16, 10, 8],
    linhas: [['', 'Investido total', 'Meta', 'Google', 'Leads pagos', 'Leads orgânicos', 'CPL', 'Cliques na bio', 'Toques nos contatos do perfil', 'Faturamento', 'Vendas', 'ROAS'], ...dados],
  }]
}
