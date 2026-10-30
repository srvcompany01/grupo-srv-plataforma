/**
 * Melhores dias e horários para publicar, a partir do que já foi publicado no Instagram do cliente (alcance, ou visualizações + interações).
 * Poucos dados por horário enganam, então cada horário é "puxado" para a média geral (suavização): só se destaca quem tem resultado
 * bom em vários posts. Com pouco histórico no total, cai nos horários padrão do Brasil e avisa que não é baseado em dados do cliente.
 */

export type PostHistorico = { publicadoEm: string; alcance?: number; visualizacoes?: number; interacoes?: number }
export type Horario = { diaSemana: number; hora: number; pontuacao: number; amostras: number }
export type Ranking = { baseadoEmDados: boolean; totalPosts: number; horarios: Horario[] }
export type Janela = { data: string; hora: string; diaSemana: number; motivo: string }

const FUSO = 'America/Belem'
const NOMES_DIA = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']
export const nomeDoDia = (d: number) => NOMES_DIA[d]

/** Dia da semana (0 = domingo), hora e data (AAAA-MM-DD) de um instante, no horário de Belém. */
export function partesEmBelem(iso: string): { diaSemana: number; hora: number; data: string } {
  const p = new Intl.DateTimeFormat('en-CA', { timeZone: FUSO, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23', weekday: 'short' }).formatToParts(new Date(iso))
  const g = (t: string) => p.find((x) => x.type === t)?.value ?? ''
  return { diaSemana: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(g('weekday')), hora: Number(g('hour')), data: `${g('year')}-${g('month')}-${g('day')}` }
}

/** Padrões usados quando o cliente ainda tem pouco histórico (terça a quinta no almoço e no fim do dia; fim de semana de manhã). */
const PADRAO: Horario[] = [
  ...[2, 3, 4].flatMap((d) => [{ diaSemana: d, hora: 12, pontuacao: 1, amostras: 0 }, { diaSemana: d, hora: 18, pontuacao: 0.95, amostras: 0 }, { diaSemana: d, hora: 19, pontuacao: 0.9, amostras: 0 }]),
  ...[1, 5].flatMap((d) => [{ diaSemana: d, hora: 12, pontuacao: 0.8, amostras: 0 }, { diaSemana: d, hora: 18, pontuacao: 0.75, amostras: 0 }]),
  ...[0, 6].map((d) => ({ diaSemana: d, hora: 11, pontuacao: 0.7, amostras: 0 })),
]

const valorDoPost = (p: PostHistorico) => p.alcance ?? ((p.visualizacoes ?? 0) + (p.interacoes ?? 0) * 3)

export function ranquearHorarios(posts: PostHistorico[], minimoPosts = 8): Ranking {
  const validos = posts.filter((p) => !Number.isNaN(Date.parse(p.publicadoEm)))
  if (validos.length < minimoPosts) return { baseadoEmDados: false, totalPosts: validos.length, horarios: PADRAO }
  const media = validos.reduce((s, p) => s + valorDoPost(p), 0) / validos.length || 1
  const grupos = new Map<string, { diaSemana: number; hora: number; soma: number; n: number }>()
  for (const p of validos) {
    const { diaSemana, hora } = partesEmBelem(p.publicadoEm)
    const k = `${diaSemana}-${hora}`
    const g = grupos.get(k) ?? { diaSemana, hora, soma: 0, n: 0 }
    g.soma += valorDoPost(p)
    g.n += 1
    grupos.set(k, g)
  }
  const SUAVIZACAO = 2
  const horarios = [...grupos.values()]
    .map((g) => ({ diaSemana: g.diaSemana, hora: g.hora, amostras: g.n, pontuacao: Math.round(((g.soma + SUAVIZACAO * media) / (g.n + SUAVIZACAO) / media) * 100) / 100 }))
    .sort((a, b) => b.pontuacao - a.pontuacao || b.amostras - a.amostras)
  return { baseadoEmDados: true, totalPosts: validos.length, horarios }
}

const somarDias = (iso: string, n: number) => {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

/**
 * Escolhe `quantidade` datas e horários a partir de `agora`: no máximo um post por dia, só em dias sem post já agendado
 * (`ocupados` = instantes ISO dos posts agendados) e só em horário que ainda não passou. Em cada dia usa o melhor horário do ranking para aquele dia da semana.
 */
export function proximasJanelas(r: Ranking, o: { agoraIso: string; quantidade: number; ocupados?: string[]; diasAFrente?: number }): Janela[] {
  const { data: hoje, hora: horaAgora } = partesEmBelem(o.agoraIso)
  const diasOcupados = new Set((o.ocupados ?? []).map((i) => partesEmBelem(i).data))
  const janelas: Janela[] = []
  for (let i = 0; i <= (o.diasAFrente ?? 60) && janelas.length < o.quantidade; i++) {
    const data = somarDias(hoje, i)
    if (diasOcupados.has(data)) continue
    const diaSemana = new Date(`${data}T12:00:00Z`).getUTCDay()
    const candidatos = r.horarios.filter((h) => h.diaSemana === diaSemana && (i > 0 || h.hora > horaAgora))
    const melhor = candidatos[0]
    if (!melhor) continue
    janelas.push({ data, hora: `${String(melhor.hora).padStart(2, '0')}:00`, diaSemana, motivo: r.baseadoEmDados ? `melhor horário de ${nomeDoDia(diaSemana)} no histórico do cliente (${melhor.amostras} post${melhor.amostras === 1 ? '' : 's'})` : `horário padrão de ${nomeDoDia(diaSemana)} (o cliente ainda tem poucos posts para analisar)` })
  }
  return janelas
}
