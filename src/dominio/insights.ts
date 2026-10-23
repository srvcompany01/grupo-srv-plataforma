/**
 * Insights e recomendações dos clientes: orgânico (Instagram), pago (Meta + Google Ads) e os dois juntos.
 * Tudo por regra, a partir dos números do período: o que se destaca (insights) e o que fazer (recomendações).
 */

export type FormatoIG = 'Reels' | 'Carrossel' | 'Foto' | 'Vídeo'

export type PostIG = {
  id: string
  legenda: string
  formato: FormatoIG
  link: string
  imagem: string | null
  em: string
  curtidas: number
  comentarios: number
  alcance: number
  visualizacoes: number
  salvamentos: number
  compartilhamentos: number
  interacoes: number
}

export type ResumoInstagram = {
  usuario: string
  seguidores: number
  alcance: number
  visualizacoes: number
  interacoes: number
  contasEngajadas: number
  curtidas: number
  comentarios: number
  salvamentos: number
  compartilhamentos: number
  novosSeguidores: number
  cliquesPerfil: number
  /** Alcance orgânico + pago da conta por dia (o Instagram não separa no total da conta). */
  alcancePorDia: { dia: string; valor: number }[]
  posts: PostIG[]
}

/** Gasto/alcance pago por dia (Meta + Google somados). */
export type PagoPorDia = { dia: string; gasto: number; impressoes: number; alcance: number; cliques: number }

export type Analise = { destaques: string[]; recomendacoes: string[] }

const pct = (n: number) => `${n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`
const num = (n: number) => Math.round(n).toLocaleString('pt-BR')
const reais = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const media = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0)
const DIAS_SEMANA = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']

export function formatoDoPost(mediaType: string | undefined, produto: string | undefined): FormatoIG {
  if (produto === 'REELS') return 'Reels'
  if (mediaType === 'CAROUSEL_ALBUM') return 'Carrossel'
  if (mediaType === 'VIDEO') return 'Vídeo'
  return 'Foto'
}

/** Taxa de engajamento: interações ÷ alcance (em %). */
export const engajamento = (interacoes: number, alcance: number) => (alcance ? (interacoes / alcance) * 100 : 0)

/** Média de interações por formato, do melhor para o pior. */
export function porFormato(posts: PostIG[]): { formato: FormatoIG; posts: number; interacoes: number; alcance: number; engajamento: number }[] {
  const grupos = new Map<FormatoIG, PostIG[]>()
  for (const p of posts) grupos.set(p.formato, [...(grupos.get(p.formato) ?? []), p])
  return [...grupos].map(([formato, ps]) => {
    const interacoes = media(ps.map((p) => p.interacoes))
    const alcance = media(ps.map((p) => p.alcance))
    return { formato, posts: ps.length, interacoes, alcance, engajamento: engajamento(interacoes, alcance) }
  }).sort((a, b) => b.interacoes - a.interacoes)
}

/** Dia da semana (Belém) com mais interações por post (só dias com 2+ posts). */
export function melhorDiaDaSemana(posts: PostIG[]): { dia: string; interacoes: number } | null {
  const grupos = new Map<number, number[]>()
  for (const p of posts) {
    const d = new Date(Date.parse(p.em) - 3 * 3_600_000).getUTCDay()
    grupos.set(d, [...(grupos.get(d) ?? []), p.interacoes])
  }
  const candidatos = [...grupos].filter(([, xs]) => xs.length >= 2).map(([d, xs]) => ({ dia: DIAS_SEMANA[d], interacoes: media(xs) }))
  return candidatos.sort((a, b) => b.interacoes - a.interacoes)[0] ?? null
}

export function analisarOrganico(ig: ResumoInstagram, dias: number): Analise {
  const destaques: string[] = []
  const recomendacoes: string[] = []
  const posts = ig.posts
  const taxa = engajamento(ig.interacoes, ig.alcance)
  const porSemana = (posts.length / Math.max(1, dias)) * 7
  destaques.push(`${num(ig.alcance)} contas alcançadas e ${num(ig.interacoes)} interações no período (engajamento de ${pct(taxa)} sobre o alcance).`)
  if (ig.seguidores) destaques.push(`Alcance equivalente a ${pct((ig.alcance / ig.seguidores) * 100)} da base de ${num(ig.seguidores)} seguidores.`)
  if (ig.novosSeguidores) destaques.push(`${ig.novosSeguidores > 0 ? '+' : ''}${num(ig.novosSeguidores)} seguidores no período.`)

  if (!posts.length) {
    recomendacoes.push('Nenhum post no período: retome a frequência (no mínimo 3 posts por semana) para o perfil voltar a ser entregue.')
    return { destaques, recomendacoes }
  }
  destaques.push(`${posts.length} posts (${porSemana.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} por semana).`)
  const formatos = porFormato(posts)
  if (formatos.length > 1) {
    const [melhor, pior] = [formatos[0], formatos[formatos.length - 1]]
    destaques.push(`${melhor.formato} é o formato que mais engaja: ${num(melhor.interacoes)} interações por post, contra ${num(pior.interacoes)} em ${pior.formato}.`)
    recomendacoes.push(`Aumente a proporção de ${melhor.formato} no calendário e teste o tema dos melhores ${melhor.formato} em outros formatos.`)
  }
  const top = [...posts].sort((a, b) => b.interacoes - a.interacoes)[0]
  const mediaInteracoes = media(posts.map((p) => p.interacoes))
  if (top && top.interacoes > mediaInteracoes * 1.5) {
    destaques.push(`O melhor post teve ${num(top.interacoes)} interações, ${(top.interacoes / Math.max(1, mediaInteracoes)).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}x a média: "${top.legenda.slice(0, 60)}${top.legenda.length > 60 ? '…' : ''}".`)
    recomendacoes.push('Transforme o melhor post em anúncio (impulsionar ou usar o criativo numa campanha): conteúdo que já engaja no orgânico costuma baratear o resultado pago.')
  }
  const dia = melhorDiaDaSemana(posts)
  if (dia) recomendacoes.push(`Concentre os posts mais importantes na ${dia.dia}, o dia com mais interações por post.`)
  if (porSemana < 3) recomendacoes.push('Frequência baixa: suba para pelo menos 3 posts por semana para ganhar constância de entrega.')
  const salvar = ig.interacoes ? ((ig.salvamentos + ig.compartilhamentos) / ig.interacoes) * 100 : 0
  if (ig.interacoes && salvar < 10) recomendacoes.push('Poucos salvamentos e compartilhamentos: inclua conteúdos úteis (dicas, listas, antes e depois) que dão motivo para salvar e enviar.')
  if (taxa && taxa < 2) recomendacoes.push('Engajamento abaixo de 2% do alcance: use ganchos nos 3 primeiros segundos e chamadas para comentar.')
  if (ig.seguidores && ig.alcance < ig.seguidores * 0.3) recomendacoes.push('O alcance está abaixo de 30% da base: priorize Reels e colaborações (collab) para chegar a quem ainda não segue.')
  return { destaques, recomendacoes }
}

export type ResumoPago = {
  meta: { gasto: number; impressoes: number; alcance: number; cliques: number; ctr: number; anuncios: number; fracos: number; frequenciaAlta: number } | null
  google: { custo: number; cliques: number; conversoes: number; ctr: number; custoPorConversao: number; campanhas: number } | null
}

export function analisarPago(p: ResumoPago): Analise {
  const destaques: string[] = []
  const recomendacoes: string[] = []
  const total = (p.meta?.gasto ?? 0) + (p.google?.custo ?? 0)
  if (!p.meta && !p.google) return { destaques: ['Nenhuma conta de anúncios com dados no período.'], recomendacoes: ['Cadastre a conta do Meta e/ou do Google Ads do cliente para acompanhar o tráfego pago aqui.'] }
  destaques.push(`${reais(total)} investidos no período${p.meta && p.google ? ` (${pct((p.meta.gasto / Math.max(total, 0.01)) * 100)} no Meta, ${pct((p.google.custo / Math.max(total, 0.01)) * 100)} no Google)` : ''}.`)
  if (p.meta) {
    const cpm = p.meta.impressoes ? (p.meta.gasto / p.meta.impressoes) * 1000 : 0
    destaques.push(`Meta: ${p.meta.anuncios} anúncios ativos, ${num(p.meta.impressoes)} impressões, CTR de ${pct(p.meta.ctr)} e CPM de ${reais(cpm)}.`)
    if (p.meta.ctr && p.meta.ctr < 1) recomendacoes.push('Meta: CTR abaixo de 1%. Renove os criativos (gancho mais forte, prova social, oferta clara) e teste novos públicos.')
    if (p.meta.fracos) recomendacoes.push(`Meta: ${p.meta.fracos} anúncio(s) com desempenho fraco. Pause ou troque o criativo e realoque a verba nos que estão bem.`)
    if (p.meta.frequenciaAlta) recomendacoes.push(`Meta: ${p.meta.frequenciaAlta} anúncio(s) com frequência alta (3,5+). O público já viu demais: amplie o público ou troque o criativo.`)
    if (p.meta.gasto > 0 && !p.meta.cliques) recomendacoes.push('Meta: investimento sem cliques. Confira o objetivo da campanha e o link de destino.')
  }
  if (p.google) {
    destaques.push(`Google Ads: ${p.google.campanhas} campanhas, ${num(p.google.cliques)} cliques, CTR de ${pct(p.google.ctr)} e ${p.google.conversoes.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} conversões${p.google.conversoes ? ` (${reais(p.google.custoPorConversao)} cada)` : ''}.`)
    if (p.google.custo > 0 && !p.google.conversoes) recomendacoes.push('Google Ads: há investimento sem conversões registradas. Confira se a conversão está configurada (formulário, WhatsApp, ligação) antes de aumentar a verba.')
    if (p.google.ctr && p.google.ctr < 2) recomendacoes.push('Google Ads: CTR abaixo de 2% na pesquisa costuma indicar anúncio pouco relevante. Revise palavras-chave negativas e os títulos.')
  }
  if (!recomendacoes.length) recomendacoes.push('Os indicadores estão saudáveis: teste aumentar a verba aos poucos (até 20% por semana) nos anúncios e campanhas que mais convertem.')
  return { destaques, recomendacoes }
}

/** Pago + orgânico: quanto do alcance diário acompanha o investimento e o que fazer para um ajudar o outro. */
export function analisarCombinado(ig: ResumoInstagram | null, pago: PagoPorDia[], p: ResumoPago): Analise {
  const destaques: string[] = []
  const recomendacoes: string[] = []
  const gasto = pago.reduce((s, d) => s + d.gasto, 0)
  const alcancePago = pago.reduce((s, d) => s + d.alcance, 0)
  if (ig && alcancePago) destaques.push(`Alcance pago (Meta) de ${num(alcancePago)} contas somadas por dia, contra ${num(ig.alcancePorDia.reduce((s, d) => s + d.valor, 0))} no Instagram da conta.`)
  if (ig && gasto) {
    const comGasto = new Set(pago.filter((d) => d.gasto > 0).map((d) => d.dia))
    const com = ig.alcancePorDia.filter((d) => comGasto.has(d.dia)).map((d) => d.valor)
    const sem = ig.alcancePorDia.filter((d) => !comGasto.has(d.dia)).map((d) => d.valor)
    if (com.length && sem.length) {
      const dif = media(sem) ? ((media(com) - media(sem)) / media(sem)) * 100 : 0
      destaques.push(`Nos dias com anúncio, o alcance do perfil foi ${dif >= 0 ? `${pct(dif)} maior` : `${pct(-dif)} menor`} que nos dias sem anúncio.`)
    }
    if (ig.novosSeguidores > 0) destaques.push(`Custo aproximado por seguidor novo: ${reais(gasto / ig.novosSeguidores)} (considerando todo o investimento do período).`)
  }
  if (ig?.posts.length && p.meta) {
    const top = [...ig.posts].sort((a, b) => b.interacoes - a.interacoes)[0]
    recomendacoes.push(`Use o post orgânico de melhor desempenho ("${top.legenda.slice(0, 40)}${top.legenda.length > 40 ? '…' : ''}") como criativo de anúncio: ele já provou que prende a atenção.`)
  }
  if (p.meta && ig) recomendacoes.push('Crie um público de remarketing com quem engajou no Instagram nos últimos 30 a 60 dias: é o público mais barato para converter.')
  if (p.google && ig) recomendacoes.push('Alinhe as palavras-chave do Google com os temas que mais engajam no Instagram: o assunto que gera interesse no orgânico costuma ter busca.')
  if (!p.meta && !p.google && ig) recomendacoes.push('O cliente não roda anúncios: impulsionar os 2 ou 3 melhores posts do mês com uma verba pequena já aumenta o alcance para não seguidores.')
  if ((p.meta || p.google) && !ig) recomendacoes.push('Ligue o Instagram do cliente (Página do Facebook no cadastro) para cruzar o orgânico com o pago.')
  if (ig && ig.posts.length < 8 && (p.meta || p.google)) recomendacoes.push('Quem clica no anúncio visita o perfil: mantenha o feed ativo (3+ posts por semana) para não perder a confiança de quem chega pelo pago.')
  return { destaques, recomendacoes }
}
