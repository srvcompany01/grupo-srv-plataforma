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

/**
 * Tom de cada insight, número ou recomendação: bom (verde), atenção (amarelo), ruim (vermelho), neutro (cinza).
 * Na tela a cor sempre vem com ícone e texto (nunca só a cor). Os limites ficam aqui, iguais em toda a plataforma.
 */
export type Tom = 'bom' | 'atencao' | 'ruim' | 'neutro'
export type Item = { texto: string; tom: Tom }
export type Analise = { destaques: Item[]; recomendacoes: Item[] }
const it = (tom: Tom, texto: string): Item => ({ tom, texto })

const faixa = (v: number, bom: number, atencao: number): Tom => (v >= bom ? 'bom' : v >= atencao ? 'atencao' : 'ruim')
/** Interações ÷ alcance no Instagram: 4%+ bom, 2–4% atenção, abaixo de 2% ruim. */
export const tomEngajamento = (pct: number): Tom => (pct ? faixa(pct, 4, 2) : 'neutro')
/** Alcance ÷ seguidores: 30%+ bom, 10–30% atenção, abaixo de 10% ruim. */
export const tomAlcanceBase = (alcance: number, seguidores: number): Tom => (seguidores ? faixa((alcance / seguidores) * 100, 30, 10) : 'neutro')
/** Posts por semana: 3+ bom, 1–3 atenção, menos de 1 ruim. */
export const tomFrequencia = (porSemana: number): Tom => faixa(porSemana, 3, 1)
/** CTR no Meta: 1,5%+ bom, 1–1,5% atenção, abaixo de 1% ruim. */
export const tomCtrMeta = (pct: number): Tom => (pct ? faixa(pct, 1.5, 1) : 'neutro')
/** CTR no Google Ads (pesquisa): 4%+ bom, 2–4% atenção, abaixo de 2% ruim. */
export const tomCtrGoogle = (pct: number): Tom => (pct ? faixa(pct, 4, 2) : 'neutro')
/** Variação (saldo de seguidores, diferença %): positivo bom, negativo ruim. */
export const tomVariacao = (n: number): Tom => (n > 0 ? 'bom' : n < 0 ? 'ruim' : 'neutro')

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

/** Engajamento orgânico: interações ÷ alcance dos POSTS (o alcance da conta inclui anúncios). null sem números por post. */
export function engajamentoOrganico(ig: Pick<ResumoInstagram, 'posts'>): number | null {
  const alcance = ig.posts.reduce((s, p) => s + p.alcance, 0)
  return alcance ? engajamento(ig.posts.reduce((s, p) => s + p.interacoes, 0), alcance) : null
}

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
/** Amostra mínima para recomendar: posts por formato comparado e posts no mesmo dia da semana. */
export const MINIMO_POR_FORMATO = 5
export const MINIMO_POR_DIA = 3

export function melhorDiaDaSemana(posts: PostIG[]): { dia: string; interacoes: number } | null {
  const grupos = new Map<number, number[]>()
  for (const p of posts) {
    const d = new Date(Date.parse(p.em) - 3 * 3_600_000).getUTCDay()
    grupos.set(d, [...(grupos.get(d) ?? []), p.interacoes])
  }
  const candidatos = [...grupos].filter(([, xs]) => xs.length >= MINIMO_POR_DIA).map(([d, xs]) => ({ dia: DIAS_SEMANA[d], interacoes: media(xs) }))
  return candidatos.sort((a, b) => b.interacoes - a.interacoes)[0] ?? null
}

export function analisarOrganico(ig: ResumoInstagram, dias: number): Analise {
  const destaques: Item[] = []
  const recomendacoes: Item[] = []
  const posts = ig.posts
  // O alcance da CONTA soma orgânico e anúncios (o Instagram não separa): o engajamento orgânico sai dos posts.
  const alcancePosts = posts.reduce((x, p) => x + p.alcance, 0)
  const taxa = alcancePosts ? engajamento(posts.reduce((x, p) => x + p.interacoes, 0), alcancePosts) : 0
  const porSemana = (posts.length / Math.max(1, dias)) * 7
  const pagoDomina = ig.alcance > 0 && alcancePosts < ig.alcance * 0.3
  destaques.push(it('neutro', `${num(ig.alcance)} contas alcançadas pela conta no período (orgânico + anúncios) e ${num(ig.interacoes)} interações.`))
  if (pagoDomina) destaques.push(it('atencao', `Os posts do período alcançaram ${num(alcancePosts)} contas: a maior parte do alcance da conta veio de anúncios${posts.length ? '' : ' e Stories'}.`))
  if (ig.seguidores && alcancePosts) destaques.push(it(tomAlcanceBase(alcancePosts / Math.max(1, posts.length), ig.seguidores), `Cada post alcançou em média ${num(alcancePosts / posts.length)} contas, ${pct((alcancePosts / posts.length / ig.seguidores) * 100)} da base de ${num(ig.seguidores)} seguidores.`))
  if (ig.novosSeguidores) destaques.push(it(ig.novosSeguidores > 0 ? 'bom' : 'ruim', `${ig.novosSeguidores > 0 ? '+' : ''}${num(ig.novosSeguidores)} seguidores no período.`))

  if (!posts.length) {
    recomendacoes.push(it('ruim', 'Nenhum post no feed nem Reels no período (Stories não entram nesta conta): retome a frequência, no mínimo 3 posts por semana, para o perfil voltar a ser entregue.'))
    return { destaques, recomendacoes }
  }
  destaques.push(it(tomEngajamento(taxa), `Engajamento orgânico de ${pct(taxa)} sobre o alcance dos posts.`))
  destaques.push(it(tomFrequencia(porSemana), `${posts.length} posts (${porSemana.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} por semana).`))
  const formatos = porFormato(posts).filter((f) => f.posts >= MINIMO_POR_FORMATO)
  if (porFormato(posts).length > 1 && formatos.length < 2) destaques.push(it('neutro', `Ainda há poucos posts para comparar formatos (mínimo ${MINIMO_POR_FORMATO} de cada): continue variando antes de concluir.`))
  if (formatos.length > 1) {
    const [melhor, pior] = [formatos[0], formatos[formatos.length - 1]]
    destaques.push(it('bom', `${melhor.formato} é o formato que mais engaja: ${num(melhor.interacoes)} interações por post, contra ${num(pior.interacoes)} em ${pior.formato}.`))
    recomendacoes.push(it('bom', `Aumente a proporção de ${melhor.formato} no calendário e teste o tema dos melhores ${melhor.formato} em outros formatos.`))
  }
  const top = [...posts].sort((a, b) => b.interacoes - a.interacoes)[0]
  const mediaInteracoes = media(posts.map((p) => p.interacoes))
  if (top && top.interacoes > mediaInteracoes * 1.5) {
    destaques.push(it('bom', `O melhor post teve ${num(top.interacoes)} interações, ${(top.interacoes / Math.max(1, mediaInteracoes)).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}x a média: "${top.legenda.slice(0, 60)}${top.legenda.length > 60 ? '…' : ''}".`))
    recomendacoes.push(it('bom', 'Transforme o melhor post em anúncio (impulsionar ou usar o criativo numa campanha): conteúdo que já engaja no orgânico costuma baratear o resultado pago.'))
  }
  const dia = melhorDiaDaSemana(posts)
  if (dia) recomendacoes.push(it('neutro', `Concentre os posts mais importantes ${['domingo', 'sábado'].includes(dia.dia) ? 'no' : 'na'} ${dia.dia}, o dia com mais interações por post.`))
  if (porSemana < 3) recomendacoes.push(it(porSemana < 1 ? 'ruim' : 'atencao', 'Frequência baixa: suba para pelo menos 3 posts por semana para ganhar constância de entrega.'))
  const salvar = ig.interacoes ? ((ig.salvamentos + ig.compartilhamentos) / ig.interacoes) * 100 : 0
  if (ig.interacoes && salvar < 10) recomendacoes.push(it('atencao', 'Poucos salvamentos e compartilhamentos: inclua conteúdos úteis (dicas, listas, antes e depois) que dão motivo para salvar e enviar.'))
  if (taxa && taxa < 2) recomendacoes.push(it('ruim', 'Engajamento abaixo de 2% do alcance: use ganchos nos 3 primeiros segundos e chamadas para comentar.'))
  if (ig.seguidores && alcancePosts / posts.length < ig.seguidores * 0.3) recomendacoes.push(it('atencao', 'O alcance por post está abaixo de 30% da base: use colaborações (collab) e o formato que mais alcança no perfil para chegar a quem ainda não segue.'))
  return { destaques, recomendacoes }
}

export type ResumoPago = {
  meta: { gasto: number; impressoes: number; alcance: number; cliques: number; ctr: number; anuncios: number; fracos: number; frequenciaAlta: number } | null
  google: { custo: number; cliques: number; conversoes: number; ctr: number; custoPorConversao: number; campanhas: number } | null
}

export function analisarPago(p: ResumoPago): Analise {
  const destaques: Item[] = []
  const recomendacoes: Item[] = []
  const total = (p.meta?.gasto ?? 0) + (p.google?.custo ?? 0)
  if (!p.meta && !p.google) return { destaques: [it('neutro', 'Nenhuma conta de anúncios com dados no período.')], recomendacoes: [it('atencao', 'Cadastre a conta do Meta e/ou do Google Ads do cliente para acompanhar o tráfego pago aqui.')] }
  destaques.push(it('neutro', `${reais(total)} investidos no período${p.meta && p.google ? ` (${pct((p.meta.gasto / Math.max(total, 0.01)) * 100)} no Meta, ${pct((p.google.custo / Math.max(total, 0.01)) * 100)} no Google)` : ''}.`))
  if (p.meta) {
    const cpm = p.meta.impressoes ? (p.meta.gasto / p.meta.impressoes) * 1000 : 0
    destaques.push(it(tomCtrMeta(p.meta.ctr), `Meta: ${p.meta.anuncios} anúncios ativos, ${num(p.meta.impressoes)} impressões, CTR de ${pct(p.meta.ctr)} e CPM de ${reais(cpm)}.`))
    if (p.meta.ctr && p.meta.ctr < 1) recomendacoes.push(it('ruim', 'Meta: CTR abaixo de 1%. Renove os criativos (gancho mais forte, prova social, oferta clara) e teste novos públicos.'))
    if (p.meta.fracos) recomendacoes.push(it('ruim', `Meta: ${p.meta.fracos} anúncio(s) com desempenho fraco. Pause ou troque o criativo e realoque a verba nos que estão bem.`))
    if (p.meta.frequenciaAlta) recomendacoes.push(it('atencao', `Meta: ${p.meta.frequenciaAlta} anúncio(s) com frequência alta (3,5+). O público já viu demais: amplie o público ou troque o criativo.`))
    if (p.meta.gasto > 0 && !p.meta.cliques) recomendacoes.push(it('ruim', 'Meta: investimento sem cliques. Confira o objetivo da campanha e o link de destino.'))
  }
  if (p.google) {
    destaques.push(it(tomCtrGoogle(p.google.ctr), `Google Ads: ${p.google.campanhas} campanhas, ${num(p.google.cliques)} cliques, CTR de ${pct(p.google.ctr)} e ${p.google.conversoes.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} conversões${p.google.conversoes ? ` (${reais(p.google.custoPorConversao)} cada)` : ''}.`))
    if (p.google.custo > 0 && !p.google.conversoes) recomendacoes.push(it('ruim', 'Google Ads: há investimento sem conversões registradas. Confira se a conversão está configurada (formulário, WhatsApp, ligação) antes de aumentar a verba.'))
    if (p.google.ctr && p.google.ctr < 2) recomendacoes.push(it('atencao', 'Google Ads: CTR abaixo de 2% na pesquisa costuma indicar anúncio pouco relevante. Revise palavras-chave negativas e os títulos.'))
  }
  if (!recomendacoes.length) recomendacoes.push(it('bom', 'Os indicadores estão saudáveis: teste aumentar a verba aos poucos (até 20% por semana) nos anúncios e campanhas que mais convertem.'))
  return { destaques, recomendacoes }
}

/** Pago + orgânico: quanto do alcance diário acompanha o investimento e o que fazer para um ajudar o outro. */
export function analisarCombinado(ig: ResumoInstagram | null, pago: PagoPorDia[], p: ResumoPago): Analise {
  const destaques: Item[] = []
  const recomendacoes: Item[] = []
  const gasto = pago.reduce((s, d) => s + d.gasto, 0)
  const alcancePago = pago.reduce((s, d) => s + d.alcance, 0)
  if (ig && alcancePago) destaques.push(it('neutro', `Alcance pago (Meta) de ${num(alcancePago)} contas somadas por dia, contra ${num(ig.alcancePorDia.reduce((s, d) => s + d.valor, 0))} no Instagram da conta.`))
  if (ig && gasto) {
    const comGasto = new Set(pago.filter((d) => d.gasto > 0).map((d) => d.dia))
    const com = ig.alcancePorDia.filter((d) => comGasto.has(d.dia)).map((d) => d.valor)
    const sem = ig.alcancePorDia.filter((d) => !comGasto.has(d.dia)).map((d) => d.valor)
    if (com.length && sem.length) {
      const dif = media(sem) ? ((media(com) - media(sem)) / media(sem)) * 100 : 0
      destaques.push(it(dif >= 10 ? 'bom' : dif <= -10 ? 'ruim' : 'neutro', `Nos dias com anúncio, o alcance do perfil foi ${dif >= 0 ? `${pct(dif)} maior` : `${pct(-dif)} menor`} que nos dias sem anúncio.`))
    }
    if (ig.novosSeguidores > 0) destaques.push(it('neutro', `Custo aproximado por seguidor novo: ${reais(gasto / ig.novosSeguidores)} (considerando todo o investimento do período).`))
  }
  if (ig?.posts.length && p.meta) {
    const top = [...ig.posts].sort((a, b) => b.interacoes - a.interacoes)[0]
    recomendacoes.push(it('bom', `Use o post orgânico de melhor desempenho ("${top.legenda.slice(0, 40)}${top.legenda.length > 40 ? '…' : ''}") como criativo de anúncio: ele já provou que prende a atenção.`))
  }
  if (p.meta && ig) recomendacoes.push(it('bom', 'Crie um público de remarketing com quem engajou no Instagram nos últimos 30 a 60 dias: é o público mais barato para converter.'))
  if (p.google && ig) recomendacoes.push(it('bom', 'Alinhe as palavras-chave do Google com os temas que mais engajam no Instagram: o assunto que gera interesse no orgânico costuma ter busca.'))
  if (!p.meta && !p.google && ig) recomendacoes.push(it('atencao', 'O cliente não roda anúncios: impulsionar os 2 ou 3 melhores posts do mês com uma verba pequena já aumenta o alcance para não seguidores.'))
  if ((p.meta || p.google) && !ig) recomendacoes.push(it('atencao', 'Ligue o Instagram do cliente (Página do Facebook no cadastro) para cruzar o orgânico com o pago.'))
  if (ig && ig.posts.length < 8 && (p.meta || p.google)) recomendacoes.push(it('atencao', 'Quem clica no anúncio visita o perfil: mantenha o feed ativo (3+ posts por semana) para não perder a confiança de quem chega pelo pago.'))
  return { destaques, recomendacoes }
}
