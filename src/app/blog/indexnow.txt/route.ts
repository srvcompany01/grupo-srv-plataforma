/** Chave do IndexNow (prova para o Bing e outros de que o site é nosso). Só existe se INDEXNOW_KEY estiver na Vercel. */
export function GET() {
  const chave = process.env.INDEXNOW_KEY?.trim()
  return chave ? new Response(chave, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }) : new Response('Não encontrado', { status: 404 })
}
