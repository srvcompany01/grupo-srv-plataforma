import type { MetadataRoute } from 'next'
import { headers } from 'next/headers'
import { SITE } from '@/dominio/blog'
import { contextoMarca } from '@/servicos/blog'

// Robôs que só treinam modelos de IA (não trazem visita): bloqueados, a não ser que o contexto da marca permita.
const TREINO_IA = ['GPTBot', 'Google-Extended', 'CCBot', 'anthropic-ai', 'ClaudeBot', 'Applebot-Extended', 'Bytespider', 'meta-externalagent']
// Robôs de busca por IA (citam e linkam o artigo): sempre liberados no blog.
const BUSCA_IA = ['OAI-SearchBot', 'ChatGPT-User', 'PerplexityBot', 'Perplexity-User', 'Claude-SearchBot', 'Claude-User']

/**
 * O app (app.gruposrv.com.br e demais endereços) fica fora do Google. Só o site público (www.gruposrv.com.br) libera
 * o blog e as landing pages, e aponta o mapa do site. Robôs de busca por IA entram; os de treinamento, conforme a marca.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = (await headers()).get('host') ?? ''
  if (host !== 'www.gruposrv.com.br' && host !== 'gruposrv.com.br') return { rules: { userAgent: '*', disallow: '/' } }
  const publico = { allow: ['/blog', '/maquinadevendas', '/calculadora', '/sobre', '/privacidade', '/marca/', '/lp/'], disallow: ['/', '/blog/busca', '/api/'] }
  const treino = (await contextoMarca().catch(() => ({}) as Record<string, unknown>)).allow_ai_training === true
  return {
    rules: [
      { userAgent: '*', ...publico },
      { userAgent: BUSCA_IA, ...publico },
      treino ? { userAgent: TREINO_IA, ...publico } : { userAgent: TREINO_IA, disallow: '/' },
    ],
    sitemap: `${SITE}/sitemap.xml`,
  }
}
