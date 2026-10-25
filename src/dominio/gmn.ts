/**
 * Aba GMN com dados públicos do Google (Places API): geogrid de ranking, análise de saúde do perfil e link de
 * avaliação. Tudo aqui é cálculo puro (sem rede), para testar.
 */
import type { Tom } from './insights'

export type Ponto = { lat: number; lng: number }
export type PontoGrade = Ponto & { posicao: number | null; top: string[] }

export const GRADES = [3, 5, 7, 9] as const
export type Grade = (typeof GRADES)[number]
/** A busca devolve até 60 lugares (3 páginas de 20): abaixo disso é "fora do top 60". */
export const PROFUNDIDADE = 60

const KM_POR_GRAU = 111.32

/** n×n pontos centrados no lugar, do canto noroeste ao sudeste; o raio vai do centro até a borda. */
export function gerarGrade(centro: Ponto, n: Grade, raioKm: number): Ponto[] {
  const passo = n > 1 ? (2 * raioKm) / (n - 1) : 0
  const pontos: Ponto[] = []
  for (let l = 0; l < n; l++) {
    for (let c = 0; c < n; c++) {
      const norte = raioKm - l * passo
      const leste = -raioKm + c * passo
      pontos.push({
        lat: centro.lat + norte / KM_POR_GRAU,
        lng: centro.lng + leste / (KM_POR_GRAU * Math.cos((centro.lat * Math.PI) / 180)),
      })
    }
  }
  return pontos
}

/** Raio do viés de busca em cada ponto (metros): metade do espaço entre pontos, entre 300 m e 5 km. */
export const raioDoVies = (n: Grade, raioKm: number) => Math.round(Math.min(5000, Math.max(300, ((2 * raioKm) / Math.max(1, n - 1)) * 500)))

export type MetricasGrade = {
  /** Posição média nos pontos em que aparece. */
  posicaoMedia: number | null
  /** Posição média contando "fora" como 21 (comparável entre varreduras, como o ATRP do mercado). */
  posicaoMediaTotal: number
  /** % dos pontos no top 3 (o "share of local voice"). */
  top3: number
  top10: number
  encontrado: number
  pontos: number
}

export function metricasDaGrade(posicoes: (number | null)[]): MetricasGrade {
  const achados = posicoes.filter((p): p is number => p !== null)
  const pct = (n: number) => (posicoes.length ? Math.round((n / posicoes.length) * 1000) / 10 : 0)
  const media = (xs: number[]) => Math.round((xs.reduce((s, x) => s + x, 0) / xs.length) * 10) / 10
  return {
    posicaoMedia: achados.length ? media(achados) : null,
    posicaoMediaTotal: posicoes.length ? media(posicoes.map((p) => (p === null || p > 20 ? 21 : p))) : 21,
    top3: pct(achados.filter((p) => p <= 3).length),
    top10: pct(achados.filter((p) => p <= 10).length),
    encontrado: pct(achados.length),
    pontos: posicoes.length,
  }
}

/** Cor da bolinha: verde escuro (1–3) → verde → amarelo → laranja → vermelho (11–20) → cinza (fora do top 20). */
export function corDaPosicao(p: number | null): { fundo: string; texto: string } {
  if (p === null || p > 20) return { fundo: '#9b9a96', texto: '#ffffff' }
  if (p <= 3) return { fundo: '#1f8a4c', texto: '#ffffff' }
  if (p <= 5) return { fundo: '#5cb85c', texto: '#ffffff' }
  if (p <= 7) return { fundo: '#d9c516', texto: '#1f1f1f' }
  if (p <= 10) return { fundo: '#f08a24', texto: '#ffffff' }
  return { fundo: '#d64545', texto: '#ffffff' }
}

export const rotuloPosicao = (p: number | null) => (p === null ? '20+' : p > 20 ? '20+' : String(p))

/** Concorrentes que mais aparecem no top 3 da grade (place ids, do mais frequente ao menos). */
export function concorrentesDaGrade(pontos: PontoGrade[], clienteId: string, limite = 5): { id: string; vezes: number }[] {
  const conta = new Map<string, number>()
  for (const p of pontos) for (const id of p.top) if (id !== clienteId) conta.set(id, (conta.get(id) ?? 0) + 1)
  return [...conta].map(([id, vezes]) => ({ id, vezes })).sort((a, b) => b.vezes - a.vezes).slice(0, limite)
}

// ───────────────────────────── Análise de saúde (dados públicos) ─────────────────────────────

export type PerfilPublico = {
  status: string
  nota: number | null
  avaliacoes: number
  /** A Places API devolve no máximo 10 fotos: 10 = "10 ou mais". */
  fotos: number
  temHorario: boolean
  site: string | null
  telefone: string | null
  categoriaPrincipal: string | null
  categorias: string[]
  resumo: string | null
  /** Data da avaliação mais recente entre as que o Google devolve (as mais relevantes). */
  ultimaAvaliacaoEm: string | null
}

export type ItemSaude = { titulo: string; tom: Exclude<Tom, 'neutro'>; detalhe: string; peso: number }

const GENERICOS = new Set(['point_of_interest', 'establishment', 'store', 'food', 'health'])

/**
 * Nota de 0 a 100 pelo que qualquer pessoa vê no Google. `concorrentes`: medianas da nota e das avaliações dos que
 * mais aparecem no geogrid (quando houver), para comparar.
 */
export function analisarSaude(p: PerfilPublico, hoje: string, concorrentes?: { nota: number | null; avaliacoes: number | null } | null): { nota: number; itens: ItemSaude[] } {
  const itens: ItemSaude[] = []
  const add = (titulo: string, tom: ItemSaude['tom'], detalhe: string, peso: number) => itens.push({ titulo, tom, detalhe, peso })
  add('Perfil ativo', p.status === 'OPERATIONAL' ? 'bom' : 'ruim', p.status === 'OPERATIONAL' ? 'O Google mostra o negócio como aberto.' : `Status no Google: ${p.status || 'desconhecido'} (fechado temporária ou definitivamente?).`, 3)
  add('Nota média', p.nota === null ? 'ruim' : p.nota >= 4.5 ? 'bom' : p.nota >= 4 ? 'atencao' : 'ruim', p.nota === null ? 'Ainda sem nota.' : `${p.nota.toLocaleString('pt-BR')} estrelas${concorrentes?.nota ? ` (concorrentes: ${concorrentes.nota.toLocaleString('pt-BR')})` : ''}.`, 3)
  const refAval = concorrentes?.avaliacoes ? Math.max(30, concorrentes.avaliacoes) : 100
  add('Quantidade de avaliações', p.avaliacoes >= refAval ? 'bom' : p.avaliacoes >= refAval * 0.4 ? 'atencao' : 'ruim', `${p.avaliacoes} avaliações${concorrentes?.avaliacoes ? ` (concorrentes: ${Math.round(concorrentes.avaliacoes)})` : ' (meta: 100+)'}.`, 3)
  const dias = p.ultimaAvaliacaoEm ? Math.floor((Date.parse(`${hoje}T12:00:00Z`) - Date.parse(p.ultimaAvaliacaoEm)) / 86_400_000) : null
  add('Avaliações recentes', dias === null ? 'ruim' : dias <= 30 ? 'bom' : dias <= 90 ? 'atencao' : 'ruim', dias === null ? 'Nenhuma avaliação recente visível.' : `A mais recente entre as que o Google destaca tem ${dias} dia(s).`, 2)
  add('Fotos', p.fotos >= 10 ? 'bom' : p.fotos >= 5 ? 'atencao' : 'ruim', p.fotos >= 10 ? '10 ou mais fotos.' : `${p.fotos} foto(s): perfis com mais fotos recebem mais cliques.`, 2)
  add('Horário de funcionamento', p.temHorario ? 'bom' : 'ruim', p.temHorario ? 'Horário cadastrado.' : 'Sem horário: o Google pode esconder o perfil em buscas "aberto agora".', 2)
  add('Site', p.site ? 'bom' : 'ruim', p.site ? p.site : 'Sem site no perfil.', 2)
  add('Telefone', p.telefone ? 'bom' : 'ruim', p.telefone ? p.telefone : 'Sem telefone no perfil.', 2)
  add('Categoria principal', p.categoriaPrincipal ? 'bom' : 'ruim', p.categoriaPrincipal ?? 'Sem categoria principal clara.', 2)
  const extras = p.categorias.filter((c) => !GENERICOS.has(c) && c !== p.categoriaPrincipal).length
  add('Categorias adicionais', extras >= 2 ? 'bom' : extras === 1 ? 'atencao' : 'ruim', `${extras} categoria(s) além da principal (use todas as que se aplicam).`, 1)
  add('Resumo do Google', p.resumo ? 'bom' : 'atencao', p.resumo ? p.resumo : 'O Google ainda não gerou um resumo do negócio (perfis completos e com avaliações costumam ganhar).', 1)
  const valor = { bom: 1, atencao: 0.5, ruim: 0 } as const
  const total = itens.reduce((s, i) => s + i.peso, 0)
  return { nota: Math.round((itens.reduce((s, i) => s + valor[i.tom] * i.peso, 0) / total) * 100), itens }
}

/** Link oficial que abre direto a janela de avaliar o negócio. */
export const linkAvaliacao = (placeId: string) => `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}`

// ───────────────────────────── Mapa (tiles do OpenStreetMap, sem biblioteca) ─────────────────────────────

/** Pixel global (Web Mercator, tile de 256 px) de uma coordenada no zoom. */
export function pixel(p: Ponto, zoom: number): { x: number; y: number } {
  const escala = 256 * 2 ** zoom
  const sen = Math.sin((p.lat * Math.PI) / 180)
  return { x: ((p.lng + 180) / 360) * escala, y: (0.5 - Math.log((1 + sen) / (1 - sen)) / (4 * Math.PI)) * escala }
}

/** Maior zoom em que todos os pontos cabem num quadro de `lado` px, com margem. */
export function zoomParaCaber(pontos: Ponto[], lado: number): number {
  for (let z = 17; z > 3; z--) {
    const px = pontos.map((p) => pixel(p, z))
    const larg = Math.max(...px.map((p) => p.x)) - Math.min(...px.map((p) => p.x))
    const alt = Math.max(...px.map((p) => p.y)) - Math.min(...px.map((p) => p.y))
    if (larg <= lado * 0.85 && alt <= lado * 0.85) return z
  }
  return 3
}

/** Texto para a abordagem comercial: a nota e os pontos fracos do perfil, prontos para copiar no WhatsApp. */
export function textoProposta(nome: string, r: { nota: number; itens: ItemSaude[] }): string {
  const fracos = r.itens.filter((i) => i.tom !== 'bom').sort((a, b) => (a.tom === b.tom ? b.peso - a.peso : a.tom === 'ruim' ? -1 : 1))
  const linhas = fracos.slice(0, 6).map((i) => `• ${i.titulo}: ${i.detalhe}`)
  return [
    `Olá! Fizemos uma análise gratuita do perfil da ${nome} no Google (Google Meu Negócio).`,
    `Nota de saúde do perfil: ${r.nota}/100.`,
    ...(linhas.length ? ['', 'O que está tirando clientes de vocês no Google hoje:', ...linhas] : ['', 'O perfil está bem cuidado; dá para crescer ainda mais com postagens e avaliações constantes.']),
    '',
    'A Grupo SRV cuida disso para vocês: perfil completo, avaliações, postagens e aparecer nas primeiras posições do Maps no seu bairro. Posso te mostrar o mapa de posições do seu negócio?',
  ].join('\n')
}

/**
 * Comparação de duas varreduras da mesma palavra: piorou quando a posição média geral sobe 1 ou mais, ou o top 3
 * cai 10 pontos percentuais ou mais. Devolve o texto do aviso (null = não piorou).
 */
export function pioraNoGeogrid(atual: MetricasGrade, anterior: MetricasGrade): string | null {
  const subiu = Math.round((atual.posicaoMediaTotal - anterior.posicaoMediaTotal) * 10) / 10
  const caiuTop3 = Math.round((anterior.top3 - atual.top3) * 10) / 10
  if (subiu < 1 && caiuTop3 < 10) return null
  const partes = [
    ...(subiu >= 1 ? [`posição média de ${anterior.posicaoMediaTotal.toLocaleString('pt-BR')}º para ${atual.posicaoMediaTotal.toLocaleString('pt-BR')}º`] : []),
    ...(caiuTop3 >= 10 ? [`top 3 de ${anterior.top3.toLocaleString('pt-BR')}% para ${atual.top3.toLocaleString('pt-BR')}% dos pontos`] : []),
  ]
  return partes.join(' e ')
}

export type ColunaComparativo = { nome: string; perfil: PerfilPublico; saude: number }
export type LinhaComparativo = { rotulo: string; valores: string[]; tomCliente: Exclude<Tom, 'neutro'> }

/**
 * Cliente (primeira coluna) lado a lado com os concorrentes. Número: verde se empata ou ganha de todos, vermelho se
 * perde para todos, amarelo no meio. Sim/não: verde se tem, vermelho se não tem e algum concorrente tem.
 */
export function comparativo(colunas: ColunaComparativo[]): LinhaComparativo[] {
  const [cli, ...outros] = colunas
  const extras = (p: PerfilPublico) => p.categorias.filter((c) => !GENERICOS.has(c)).length - (p.categoriaPrincipal ? 1 : 0)
  const numero = (rotulo: string, f: (c: ColunaComparativo) => number, fmt: (v: number, c: ColunaComparativo) => string): LinhaComparativo => {
    const v = f(cli)
    const os = outros.map(f)
    const tom = !os.length || v >= Math.max(...os) ? 'bom' : v < Math.min(...os) ? 'ruim' : 'atencao'
    return { rotulo, valores: colunas.map((c) => fmt(f(c), c)), tomCliente: tom }
  }
  const simNao = (rotulo: string, f: (p: PerfilPublico) => boolean): LinhaComparativo => ({
    rotulo,
    valores: colunas.map((c) => (f(c.perfil) ? 'Sim' : 'Não')),
    tomCliente: f(cli.perfil) ? 'bom' : outros.some((o) => f(o.perfil)) ? 'ruim' : 'atencao',
  })
  return [
    numero('Saúde do perfil', (c) => c.saude, (v) => `${v}/100`),
    numero('Nota', (c) => c.perfil.nota ?? 0, (v, c) => (c.perfil.nota === null ? '—' : `★ ${v.toLocaleString('pt-BR')}`)),
    numero('Avaliações', (c) => c.perfil.avaliacoes, (v) => v.toLocaleString('pt-BR')),
    numero('Fotos', (c) => c.perfil.fotos, (v) => (v >= 10 ? '10+' : String(v))),
    numero('Categorias adicionais', (c) => Math.max(0, extras(c.perfil)), (v) => String(v)),
    simNao('Horário', (p) => p.temHorario),
    simNao('Site', (p) => !!p.site),
    simNao('Telefone', (p) => !!p.telefone),
  ]
}
