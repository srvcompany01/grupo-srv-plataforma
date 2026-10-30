import { urlLeitura } from '@/infra/r2'
import { criarClienteAdmin } from '@/infra/supabase/admin'
import { chaveDoAudio, tokenValido } from '@/servicos/caixa-de-entrada'

/**
 * Endereço fixo do áudio de um vídeo da caixa (não expira). O token na URL é uma assinatura do id do item: só quem recebeu o link
 * (a IA conectada pelo MCP) consegue abrir. O arquivo passa pela própria plataforma (sem redirecionar para o armazenamento), para a IA precisar liberar só um domínio. Some quando o vídeo é removido ou vira post.
 */
export async function GET(req: Request, { params }: { params: Promise<{ itemId: string }> }) {
  const { itemId } = await params
  const t = new URL(req.url).searchParams.get('t') ?? ''
  if (!tokenValido(itemId, t)) return new Response('Link inválido.', { status: 403 })
  const { data } = await criarClienteAdmin().from('content_inbox').select('r2_key, status').eq('id', itemId).maybeSingle()
  if (!data || data.status !== 'pronto') return new Response('Áudio indisponível (o vídeo foi removido ou já virou post).', { status: 404 })
  const origem = await urlLeitura(chaveDoAudio(data.r2_key))
  if (origem.startsWith('/')) return Response.redirect(new URL(origem, req.url), 302) // armazenamento local (desenvolvimento)
  const r = await fetch(origem)
  if (!r.ok || !r.body) return new Response('O áudio ainda não está no armazenamento. Tente de novo em instantes.', { status: 502 })
  const cabecalhos: Record<string, string> = { 'Content-Type': 'audio/mpeg', 'Content-Disposition': 'inline; filename="audio.mp3"', 'Cache-Control': 'private, no-store' }
  const tamanho = r.headers.get('content-length')
  if (tamanho) cabecalhos['Content-Length'] = tamanho
  return new Response(r.body, { headers: cabecalhos })
}
