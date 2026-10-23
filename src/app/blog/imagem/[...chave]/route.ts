import { urlLeitura } from '@/infra/r2'

const CHAVE = /^blog\/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$/

/** Imagens do blog com endereço fixo (bom para o Google): busca no armazenamento e guarda em cache por 1 ano. */
export async function GET(_req: Request, { params }: { params: Promise<{ chave: string[] }> }) {
  const chave = (await params).chave.join('/')
  if (!CHAVE.test(chave)) return new Response('Não encontrado', { status: 404 })
  const r = await fetch(await urlLeitura(chave))
  if (!r.ok || !r.body) return new Response('Não encontrado', { status: 404 })
  return new Response(r.body, {
    headers: { 'Content-Type': r.headers.get('content-type') ?? 'image/jpeg', 'Cache-Control': 'public, max-age=31536000, immutable' },
  })
}
