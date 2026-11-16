// Prova visual: comentários do cliente presos a um ponto da mídia ou a um instante do vídeo, por versão do post.

export type ComentarioProva = {
  id: string
  versaoId: string
  paiId: string | null
  autorTipo: 'cliente' | 'equipe'
  autor: string
  texto: string
  /** Qual mídia do carrossel (0 = primeira). `null` = comentário geral. */
  midia: number | null
  /** Posição em % da mídia. */
  x: number | null
  y: number | null
  /** Instante do vídeo, em segundos. */
  segundo: number | null
  resolvidoEm: string | null
  resolvidoPor: string | null
  criadoEm: string
}

export type ComentarioNumerado = ComentarioProva & { numero: number; respostas: ComentarioProva[] }

/** Raízes numeradas pela ordem em que foram escritas (o número do marcador), cada uma com as respostas. */
export function numerarComentarios(todos: ComentarioProva[]): ComentarioNumerado[] {
  const porData = (a: ComentarioProva, b: ComentarioProva) => (a.criadoEm < b.criadoEm ? -1 : a.criadoEm > b.criadoEm ? 1 : a.id < b.id ? -1 : 1)
  const raizes = todos.filter((c) => !c.paiId).sort(porData)
  return raizes.map((r, i) => ({ ...r, numero: i + 1, respostas: todos.filter((c) => c.paiId === r.id).sort(porData) }))
}

export const estaResolvido = (c: Pick<ComentarioProva, 'resolvidoEm'>) => c.resolvidoEm !== null

export function contarAbertos(todos: Pick<ComentarioProva, 'paiId' | 'resolvidoEm'>[]): number {
  return todos.filter((c) => !c.paiId && !c.resolvidoEm).length
}

/** "0:12" ou "1:05:09". */
export function formatarInstante(segundos: number): string {
  const total = Math.max(0, Math.floor(segundos))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const dois = (n: number) => String(n).padStart(2, '0')
  return h ? `${h}:${dois(m)}:${dois(s)}` : `${m}:${dois(s)}`
}

/** Onde o comentário foi feito: "Imagem 2", "Vídeo 1 · 0:12" ou "Geral". */
export function descreverLocal(c: Pick<ComentarioProva, 'midia' | 'segundo'>, tipos: ('imagem' | 'video')[]): string {
  if (c.midia === null) return 'Geral'
  const tipo = tipos[c.midia] ?? 'imagem'
  const nome = `${tipo === 'video' ? 'Vídeo' : 'Imagem'} ${c.midia + 1}`
  return c.segundo !== null ? `${nome} · ${formatarInstante(c.segundo)}` : nome
}

// ---------------------------------------------------------------- geometria

export type Retangulo = { x: number; y: number; largura: number; altura: number }

/**
 * Parte da caixa que a mídia realmente ocupa com `object-contain` (sem as faixas pretas do letterbox).
 * `natural` é o tamanho da imagem/vídeo; sem ele (ainda carregando) vale a caixa inteira.
 */
export function retanguloDaMidia(caixa: { largura: number; altura: number }, natural: { largura: number; altura: number } | null): Retangulo {
  if (!natural || natural.largura <= 0 || natural.altura <= 0 || caixa.largura <= 0 || caixa.altura <= 0) return { x: 0, y: 0, largura: caixa.largura, altura: caixa.altura }
  const escala = Math.min(caixa.largura / natural.largura, caixa.altura / natural.altura)
  const largura = natural.largura * escala
  const altura = natural.altura * escala
  return { x: (caixa.largura - largura) / 2, y: (caixa.altura - altura) / 2, largura, altura }
}

const limitar = (n: number) => Math.min(100, Math.max(0, n))
const arredondar = (n: number) => Math.round(n * 100) / 100

/** Toque em (px, py) dentro da caixa → % da mídia. `null` se o toque caiu na faixa preta, fora da mídia. */
export function pontoEmPercentual(toque: { x: number; y: number }, midia: Retangulo): { x: number; y: number } | null {
  if (midia.largura <= 0 || midia.altura <= 0) return null
  const dentro = toque.x >= midia.x && toque.x <= midia.x + midia.largura && toque.y >= midia.y && toque.y <= midia.y + midia.altura
  if (!dentro) return null
  return { x: arredondar(limitar(((toque.x - midia.x) / midia.largura) * 100)), y: arredondar(limitar(((toque.y - midia.y) / midia.altura) * 100)) }
}

/** % da mídia → posição em px dentro da caixa (para desenhar o marcador). */
export function percentualEmPosicao(ponto: { x: number; y: number }, midia: Retangulo): { x: number; y: number } {
  return { x: midia.x + (midia.largura * ponto.x) / 100, y: midia.y + (midia.altura * ponto.y) / 100 }
}

/** Mira do teclado: setas andam 2% (10% com Shift), sempre dentro da mídia. */
export function moverMira(mira: { x: number; y: number }, tecla: string, shift: boolean): { x: number; y: number } {
  const passo = shift ? 10 : 2
  const dx = tecla === 'ArrowLeft' ? -passo : tecla === 'ArrowRight' ? passo : 0
  const dy = tecla === 'ArrowUp' ? -passo : tecla === 'ArrowDown' ? passo : 0
  return { x: limitar(mira.x + dx), y: limitar(mira.y + dy) }
}

// ---------------------------------------------------------------- validação

/** Teto do instante de um vídeo (3 h). A duração real do vídeo não é guardada no banco, então este é o limite possível. */
export const SEGUNDO_MAXIMO = 10_800
/** Quantas mídias o portal mostra por post (as demais não existem para o cliente). */
export const MIDIAS_NO_PORTAL = 10

export type EntradaComentario = { texto: string; nome: string; midia: number | null; x: number | null; y: number | null; segundo: number | null }

/** Mensagem de erro (pt-BR) ou `null`. Vale no navegador e de novo no servidor. */
export function validarComentario(e: EntradaComentario): string | null {
  if (!e.nome.trim()) return 'Informe o seu nome.'
  if (!e.texto.trim()) return 'Escreva o comentário.'
  if (e.texto.trim().length > 2000) return 'O comentário passou de 2000 caracteres.'
  if (e.nome.trim().length > 80) return 'O nome passou de 80 caracteres.'
  if ((e.x === null) !== (e.y === null)) return 'Ponto inválido.'
  if (e.x !== null && (e.x < 0 || e.x > 100 || e.y! < 0 || e.y! > 100)) return 'Ponto fora da mídia.'
  if (e.midia !== null && (!Number.isInteger(e.midia) || e.midia < 0 || e.midia > 49)) return 'Mídia inválida.'
  if ((e.x !== null || e.segundo !== null) && e.midia === null) return 'Escolha a mídia do comentário.'
  if (e.segundo !== null && (!Number.isFinite(e.segundo) || e.segundo < 0 || e.segundo > SEGUNDO_MAXIMO)) return 'Instante inválido.'
  return null
}

/** Tempo relativo curto: "agora", "há 5 min", "há 3 h", "há 2 dias". */
export function tempoRelativo(iso: string, agoraMs: number): string {
  const seg = Math.max(0, Math.round((agoraMs - Date.parse(iso)) / 1000))
  if (seg < 60) return 'agora'
  if (seg < 3600) return `há ${Math.floor(seg / 60)} min`
  if (seg < 86_400) return `há ${Math.floor(seg / 3600)} h`
  const dias = Math.floor(seg / 86_400)
  return `há ${dias} ${dias === 1 ? 'dia' : 'dias'}`
}

// ---------------------------------------------------------------- pedido vindo do navegador (nada é confiável)

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const numero = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)

export type EntradaDoPortal = EntradaComentario & { paiId: string | null }

/**
 * Converte o que chegou do navegador (qualquer coisa: objeto fora do formato, texto no lugar de número, NaN, Infinity)
 * numa entrada tipada, ou devolve a mensagem de erro. Nunca lança.
 */
export function lerEntradaDoPortal(bruto: unknown): { entrada: EntradaDoPortal } | { erro: string } {
  if (typeof bruto !== 'object' || bruto === null || Array.isArray(bruto)) return { erro: 'Comentário inválido.' }
  const o = bruto as Record<string, unknown>
  if (typeof o.texto !== 'string' || typeof o.nome !== 'string') return { erro: 'Comentário inválido.' }
  const opcional = (v: unknown): number | null | undefined => (v === null || v === undefined ? null : numero(v) ? v : undefined)
  const midia = opcional(o.midia)
  const x = opcional(o.x)
  const y = opcional(o.y)
  const segundo = opcional(o.segundo)
  if (midia === undefined || x === undefined || y === undefined || segundo === undefined) return { erro: 'Ponto ou instante inválido.' }
  const paiId = o.paiId === null || o.paiId === undefined ? null : typeof o.paiId === 'string' && UUID.test(o.paiId) ? o.paiId : undefined
  if (paiId === undefined) return { erro: 'Comentário inválido.' }
  const entrada: EntradaDoPortal = { texto: o.texto, nome: o.nome, midia, x, y, segundo, paiId }
  const erro = validarComentario(entrada)
  return erro ? { erro } : { entrada }
}

export type MidiaDaVersao = { tipo: 'imagem' | 'video' }

/**
 * Confere o local do comentário com as mídias reais da versão (as que o portal mostra, na ordem): a mídia precisa existir
 * e o instante só vale em vídeo. A duração do vídeo não está no banco, então só o teto geral vale.
 */
export function validarLocalNaMidia(e: Pick<EntradaComentario, 'midia' | 'x' | 'y' | 'segundo'>, midias: MidiaDaVersao[]): string | null {
  if (e.midia === null) return null
  const visiveis = midias.slice(0, MIDIAS_NO_PORTAL)
  const alvo = visiveis[e.midia]
  if (!alvo) return 'Essa mídia não existe nesta versão.'
  if (e.segundo !== null && alvo.tipo !== 'video') return 'O instante só vale para vídeo.'
  return null
}
