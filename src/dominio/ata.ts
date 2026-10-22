/**
 * Notetaker: a IA ouve a gravação da reunião e devolve a ata em JSON; aqui validamos e montamos o documento
 * (página "Ata" com títulos e listas, e a página "Transcrição").
 */

export type ProximoPasso = { acao: string; responsavel: string | null; prazo: string | null }
export type Ata = {
  titulo: string
  resumo: string
  participantes: string[]
  topicos: { titulo: string; pontos: string[] }[]
  decisoes: string[]
  proximosPassos: ProximoPasso[]
  transcricao: string
}

export const LIMITE_GRAVACAO_MB = 200
export const MIMES_REUNIAO = ['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/aac', 'audio/x-m4a', 'audio/m4a', 'audio/flac', 'video/mp4', 'video/webm'] as const
const EXTENSAO: Record<string, string> = { 'audio/webm': 'webm', 'video/webm': 'webm', 'audio/ogg': 'ogg', 'audio/mp4': 'm4a', 'audio/x-m4a': 'm4a', 'audio/m4a': 'm4a', 'audio/mpeg': 'mp3', 'audio/mp3': 'mp3', 'audio/wav': 'wav', 'audio/x-wav': 'wav', 'audio/aac': 'aac', 'audio/flac': 'flac', 'video/mp4': 'mp4' }

/** Tipo sem parâmetros (`audio/webm;codecs=opus` → `audio/webm`), ou null se não é áudio/vídeo aceito. */
export function mimeDaGravacao(mime: string): string | null {
  const base = mime.split(';')[0].trim().toLowerCase()
  return (MIMES_REUNIAO as readonly string[]).includes(base) ? base : null
}
export const extensaoDaGravacao = (mime: string) => EXTENSAO[mime] ?? 'bin'
/** Chave no armazenamento; o processamento só aceita chaves neste formato (ninguém lê arquivo alheio). */
export const CHAVE_REUNIAO = /^reunioes\/[0-9a-f-]{36}\.(webm|ogg|m4a|mp3|wav|aac|flac|mp4)$/

export const PROMPT_ATA = `Você é o notetaker de uma agência de marketing brasileira. Ouça a gravação inteira da reunião e responda SOMENTE com um JSON neste formato:
{
  "titulo": "assunto principal em poucas palavras",
  "resumo": "3 a 6 frases com o que foi tratado e o resultado",
  "participantes": ["nomes citados ou 'Falante 1', 'Falante 2'"],
  "topicos": [{ "titulo": "tema", "pontos": ["o que foi dito, objetivo"] }],
  "decisoes": ["o que ficou decidido"],
  "proximosPassos": [{ "acao": "tarefa clara começando com verbo", "responsavel": "nome ou null", "prazo": "AAAA-MM-DD ou null" }],
  "transcricao": "transcrição completa em português, uma fala por linha no formato 'Nome: fala'"
}
Regras: escreva em português do Brasil; não invente nada que não foi dito; listas vazias quando não houver; prazos relativos ("sexta") viram data se a data da reunião permitir, senão null.`

const texto = (v: unknown, max = 5000) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
const lista = (v: unknown, max = 60) => (Array.isArray(v) ? v.map((x) => texto(x, 600)).filter(Boolean).slice(0, max) : [])
const DATA = /^\d{4}-\d{2}-\d{2}$/

/** Valida o JSON da IA (tolerante a cercas ```json e campos faltando). */
export function lerAta(bruto: string): Ata | null {
  const limpo = bruto.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  let j: Record<string, unknown>
  try {
    j = JSON.parse(limpo)
  } catch {
    return null
  }
  if (!j || typeof j !== 'object') return null
  const ata: Ata = {
    titulo: texto(j.titulo, 120),
    resumo: texto(j.resumo, 4000),
    participantes: lista(j.participantes, 30),
    topicos: (Array.isArray(j.topicos) ? j.topicos : []).slice(0, 30).map((t) => ({ titulo: texto((t as { titulo?: unknown })?.titulo, 200), pontos: lista((t as { pontos?: unknown })?.pontos, 30) })).filter((t) => t.titulo || t.pontos.length),
    decisoes: lista(j.decisoes),
    proximosPassos: (Array.isArray(j.proximosPassos) ? j.proximosPassos : []).slice(0, 60).map((p) => {
      const x = (p ?? {}) as Record<string, unknown>
      const prazo = texto(x.prazo, 10)
      return { acao: texto(x.acao, 300), responsavel: texto(x.responsavel, 80) || null, prazo: DATA.test(prazo) ? prazo : null }
    }).filter((p) => p.acao),
    transcricao: texto(j.transcricao, 400_000),
  }
  return ata.resumo || ata.transcricao ? ata : null
}

// Conteúdo do editor (ProseMirror/Tiptap).
type No = Record<string, unknown>
const t = (s: string): No => ({ type: 'text', text: s })
const par = (s: string): No => (s ? { type: 'paragraph', content: [t(s)] } : { type: 'paragraph' })
const titulo = (s: string, level = 2): No => ({ type: 'heading', attrs: { level }, content: [t(s)] })
const itens = (xs: string[]): No => ({ type: 'bulletList', content: xs.map((x) => ({ type: 'listItem', content: [par(x)] })) })
const dataBr = (iso: string) => iso.split('-').reverse().join('/')

/** Página "Ata": cabeçalho, resumo, participantes, tópicos, decisões e próximos passos. */
export function conteudoDaAta(ata: Ata, meta: { data: string; duracaoMin: number | null; cliente: string | null }): No {
  const cabecalho = [`Reunião de ${dataBr(meta.data)}`, meta.duracaoMin ? `${meta.duracaoMin} min` : '', meta.cliente ? `Cliente: ${meta.cliente}` : ''].filter(Boolean).join(' · ')
  const passos = ata.proximosPassos.map((p) => [p.acao, p.responsavel ? `— ${p.responsavel}` : '', p.prazo ? `(até ${dataBr(p.prazo)})` : ''].filter(Boolean).join(' '))
  const nos: No[] = [par(cabecalho), titulo('Resumo'), ...ata.resumo.split('\n').map(par)]
  if (ata.participantes.length) nos.push(titulo('Participantes'), itens(ata.participantes))
  for (const tp of ata.topicos) nos.push(titulo(tp.titulo || 'Tópico', 3), ...(tp.pontos.length ? [itens(tp.pontos)] : []))
  nos.push(titulo('Decisões'), ata.decisoes.length ? itens(ata.decisoes) : par('Nenhuma decisão registrada.'))
  nos.push(titulo('Próximos passos'), passos.length ? itens(passos) : par('Nenhum próximo passo registrado.'))
  return { type: 'doc', content: nos }
}

export const conteudoDaTranscricao = (transcricao: string): No => ({ type: 'doc', content: (transcricao || 'Sem transcrição.').split('\n').map((l) => par(l.trim())) })
