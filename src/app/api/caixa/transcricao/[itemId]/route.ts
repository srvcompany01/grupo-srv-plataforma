import { registrarTranscricao, tokenValido } from '@/servicos/caixa-de-entrada'

/** O Whisper (GitHub Actions) devolve aqui o texto transcrito. O token na URL é a assinatura deste item, gerada só para este pedido. */
export async function POST(req: Request, { params }: { params: Promise<{ itemId: string }> }) {
  const { itemId } = await params
  const url = new URL(req.url)
  if (!tokenValido(itemId, url.searchParams.get('t') ?? '', 'transcricao-caixa')) return new Response('Link inválido.', { status: 403 })
  const corpo = (await req.json().catch(() => null)) as { texto?: unknown } | null
  if (typeof corpo?.texto !== 'string') return new Response('Corpo inválido.', { status: 400 })
  try {
    await registrarTranscricao(itemId, corpo.texto.trim())
    return Response.json({ ok: true })
  } catch (e) {
    console.error(e)
    return new Response('Não consegui gravar a transcrição.', { status: 500 })
  }
}
