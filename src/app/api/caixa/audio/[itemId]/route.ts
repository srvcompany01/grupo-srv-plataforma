import { urlLeitura } from '@/infra/r2'
import { criarClienteAdmin } from '@/infra/supabase/admin'
import { chaveDoAudio, tokenValido } from '@/servicos/caixa-de-entrada'

/**
 * Endereço fixo do áudio de um vídeo da caixa (não expira). O token na URL é uma assinatura do id do item: só quem recebeu o link
 * (a IA conectada pelo MCP) consegue abrir. Cada acesso é redirecionado para um link novo do armazenamento. Some quando o vídeo é removido ou vira post.
 */
export async function GET(req: Request, { params }: { params: Promise<{ itemId: string }> }) {
  const { itemId } = await params
  const t = new URL(req.url).searchParams.get('t') ?? ''
  if (!tokenValido(itemId, t)) return new Response('Link inválido.', { status: 403 })
  const { data } = await criarClienteAdmin().from('content_inbox').select('r2_key, status').eq('id', itemId).maybeSingle()
  if (!data || data.status !== 'pronto') return new Response('Áudio indisponível (o vídeo foi removido ou já virou post).', { status: 404 })
  return Response.redirect(await urlLeitura(chaveDoAudio(data.r2_key)), 302)
}
