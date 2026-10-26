import { timingSafeEqual } from 'node:crypto'

/** Compara o segredo do webhook sem vazar o tamanho nem o conteúdo pelo tempo de resposta. */
export function segredoValido(recebido: string, esperado: string): boolean {
  if (!esperado || !recebido) return false
  const a = Buffer.from(recebido)
  const b = Buffer.from(esperado)
  return a.length === b.length && timingSafeEqual(a, b)
}

type Obj = Record<string, unknown>
const obj = (v: unknown): Obj => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Obj) : {})

/**
 * Resumo de um evento da Evolution (v1 e v2) para conferir o formato na fase de teste: quem mandou, de que tipo,
 * se é mensagem nossa (fromMe), se veio de anúncio (externalAdReply) e o começo do texto.
 */
export function resumoDoEvento(corpo: unknown) {
  const c = obj(corpo)
  const dados = obj(Array.isArray(c.data) ? c.data[0] : c.data)
  const chave = obj(dados.key)
  const mensagem = obj(dados.message)
  const estendida = obj(mensagem.extendedTextMessage)
  const contexto = obj(estendida.contextInfo ?? obj(mensagem[Object.keys(mensagem)[0]]).contextInfo)
  const anuncio = obj(contexto.externalAdReply)
  const texto = String(mensagem.conversation ?? estendida.text ?? obj(mensagem.imageMessage).caption ?? '')
  return {
    evento: String(c.event ?? ''),
    instancia: String(c.instance ?? c.instanceName ?? ''),
    deMim: typeof chave.fromMe === 'boolean' ? chave.fromMe : null,
    grupo: String(chave.remoteJid ?? '').endsWith('@g.us'),
    tipo: String(dados.messageType ?? Object.keys(mensagem)[0] ?? ''),
    veioDeAnuncio: Object.keys(anuncio).length > 0,
    anuncio: Object.keys(anuncio).length ? { id: anuncio.sourceId ?? null, titulo: anuncio.title ?? null, url: anuncio.sourceUrl ?? null, clid: anuncio.ctwaClid ?? null, origem: anuncio.conversionSource ?? null } : null,
    texto: texto.slice(0, 160),
  }
}
