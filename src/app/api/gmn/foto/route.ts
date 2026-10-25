import { usuarioAtual } from '@/infra/supabase/sessao'

/** Foto de um lugar do Google (a chave da Places API fica no servidor): redireciona para a URL pública da foto. */
export async function GET(req: Request) {
  const eu = await usuarioAtual()
  if (!eu || !eu.ativo || eu.papel === 'cliente') return new Response('Não autorizado', { status: 401 })
  const nome = new URL(req.url).searchParams.get('nome') ?? ''
  const chave = process.env.GOOGLE_PLACES_API_KEY
  if (!chave || !/^places\/[A-Za-z0-9_-]+\/photos\/[A-Za-z0-9_-]+$/.test(nome)) return new Response('Foto inválida', { status: 400 })
  const r = await fetch(`https://places.googleapis.com/v1/${nome}/media?maxWidthPx=800&skipHttpRedirect=true&key=${encodeURIComponent(chave)}`, { next: { revalidate: 86_400 } })
  const j = (await r.json().catch(() => ({}))) as { photoUri?: string }
  if (!j.photoUri) return new Response('Foto indisponível', { status: 404 })
  return Response.redirect(j.photoUri, 302)
}
