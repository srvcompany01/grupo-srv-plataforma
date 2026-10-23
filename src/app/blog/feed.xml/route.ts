import { SITE } from '@/dominio/blog'
import { publicados } from '@/servicos/blog'

export const revalidate = 600

const x = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** RSS dos 30 artigos mais recentes (leitores de feed, agregadores e ferramentas de newsletter). */
export async function GET() {
  // Sem banco (ex.: montagem de prévia sem as variáveis), sai o feed vazio em vez de quebrar a montagem.
  const { posts } = await publicados({ limite: 30 }).catch(() => ({ posts: [] }))
  const itens = posts.map((p) => `<item><title>${x(p.titulo)}</title><link>${SITE}/blog/${p.slug}</link><guid>${SITE}/blog/${p.slug}</guid><pubDate>${new Date(p.publicadoEm).toUTCString()}</pubDate><description>${x(p.resumo)}</description>${p.categoria ? `<category>${x(p.categoria.nome)}</category>` : ''}</item>`).join('')
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Blog Grupo SRV</title><link>${SITE}/blog</link><description>Marketing e vendas para empresas</description><language>pt-BR</language>${itens}</channel></rss>`
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } })
}
