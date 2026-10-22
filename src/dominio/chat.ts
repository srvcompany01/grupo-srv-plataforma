import { validarAnexo } from './anexos'

/** Chat da equipe: regras puras (nome de canal, anexos, links internos e agrupamento por dia). */

/** "Área de Vendas!" → "area-de-vendas" (minúsculas, sem acento, hífens; até 40). */
export function nomeDeCanal(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/, '')
}
export const NOME_CANAL = /^[a-z0-9][a-z0-9-]{0,39}$/

export const MAX_ANEXOS_CHAT = 10

/** Revalida no servidor os anexos de uma mensagem: tipo, tamanho e chave da pasta do próprio canal. */
export function validarAnexosChat(canalId: string, anexos: { chave: string; mime: string; tamanho: number }[]): string | null {
  if (anexos.length > MAX_ANEXOS_CHAT) return `Máximo de ${MAX_ANEXOS_CHAT} anexos por mensagem`
  const prefixo = `chat/${canalId}/`
  for (const a of anexos) {
    const resto = a.chave.startsWith(prefixo) ? a.chave.slice(prefixo.length) : ''
    if (!/^[0-9a-f-]{36}\.[a-z0-9]+$/.test(resto)) return 'Anexo inválido'
    const erro = validarAnexo(a)
    if (erro) return erro
  }
  return null
}

/** Pedaço do texto: texto comum, link externo ou link para uma tarefa/documento da plataforma. */
export type Trecho = { tipo: 'texto'; valor: string } | { tipo: 'link'; url: string } | { tipo: 'interno'; recurso: 'tarefa' | 'documento'; id: string; url: string }

const LINK = /https?:\/\/[^\s<>()]+[^\s<>().,;:!?'"]/g
const INTERNO = /\/(tarefas|documentos)\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?![0-9a-f-])/

/** Separa os links do texto; os da própria plataforma (tarefa ou documento) viram cartõezinhos com o título. */
export function trechosDoTexto(texto: string): Trecho[] {
  const saida: Trecho[] = []
  let fim = 0
  for (const m of texto.matchAll(LINK)) {
    if (m.index > fim) saida.push({ tipo: 'texto', valor: texto.slice(fim, m.index) })
    const interno = m[0].match(INTERNO)
    saida.push(interno ? { tipo: 'interno', recurso: interno[1] === 'tarefas' ? 'tarefa' : 'documento', id: interno[2], url: m[0] } : { tipo: 'link', url: m[0] })
    fim = m.index + m[0].length
  }
  if (fim < texto.length) saida.push({ tipo: 'texto', valor: texto.slice(fim) })
  return saida
}

/** Ids de tarefas e documentos citados por link (para buscar os títulos de uma vez). */
export function referenciasInternas(textos: string[]): { tarefas: string[]; documentos: string[] } {
  const tarefas = new Set<string>()
  const documentos = new Set<string>()
  for (const t of textos) for (const tr of trechosDoTexto(t)) if (tr.tipo === 'interno') (tr.recurso === 'tarefa' ? tarefas : documentos).add(tr.id)
  return { tarefas: [...tarefas], documentos: [...documentos] }
}

/** "Hoje", "Ontem" ou "segunda-feira, 20 de outubro" (dia de Belém). */
export function rotuloDia(dia: string, hoje: string): string {
  if (dia === hoje) return 'Hoje'
  const ontem = new Date(Date.parse(`${hoje}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10)
  if (dia === ontem) return 'Ontem'
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(`${dia}T00:00:00Z`))
}

/** Mensagem seguida da mesma pessoa em até 5 minutos aparece sem repetir nome e foto. */
export const continuacao = (anterior: { autorId: string; criadoEm: string } | undefined, atual: { autorId: string; criadoEm: string }) =>
  !!anterior && anterior.autorId === atual.autorId && Date.parse(atual.criadoEm) - Date.parse(anterior.criadoEm) < 5 * 60_000
