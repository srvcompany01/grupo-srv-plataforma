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

/** Conteúdo binário e chaves de criptografia que não servem para classificar lead nem venda (só pesam e expõem). */
const CHAVES_DESCARTADAS = new Set(['jpegThumbnail', 'mediaKey', 'fileSha256', 'fileEncSha256', 'midQualityFileSha256', 'axolotlSenderKeyDistributionMessage', 'messageSecret', 'senderKeyHash', 'recipientKeyHash', 'scanLengths', 'url', 'directPath', 'messageContextInfo'])

function podar(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(podar)
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v as Obj).filter(([k]) => !CHAVES_DESCARTADAS.has(k)).map(([k, x]) => [k, podar(x)]))
  return v
}

/**
 * Tira do evento o que não deve ser guardado: a chave (apikey) da instância, o endereço de destino (que leva o segredo
 * do webhook), o servidor da Evolution e os blocos binários e de criptografia da mensagem.
 */
export function limparEvento(corpo: unknown): unknown {
  const { apikey: _apikey, destination: _destino, server_url: _servidor, ...resto } = obj(corpo)
  return podar(resto)
}

/** Grupos, status, canais e listas de transmissão não são leads nem vendas: nem entram na tabela (privacidade e ruído). */
export function ignorarEvento(corpo: unknown): boolean {
  const c = obj(corpo)
  const d = obj(Array.isArray(c.data) ? c.data[0] : c.data)
  const jid = String(obj(d.key).remoteJid ?? '')
  return jid.endsWith('@g.us') || jid.endsWith('@broadcast') || jid.endsWith('@newsletter')
}
