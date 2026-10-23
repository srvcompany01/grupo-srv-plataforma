import type { MetadataRoute } from 'next'
import { headers } from 'next/headers'
import { SITE } from '@/dominio/blog'

/**
 * O app (app.gruposrv.com.br e demais endereços) fica fora do Google. Só o site público (www.gruposrv.com.br) libera
 * o blog e as landing pages, e aponta o mapa do site.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = (await headers()).get('host') ?? ''
  if (host !== 'www.gruposrv.com.br' && host !== 'gruposrv.com.br') return { rules: { userAgent: '*', disallow: '/' } }
  return {
    rules: { userAgent: '*', allow: ['/blog', '/maquinadevendas', '/calculadora', '/sobre', '/privacidade', '/marca/', '/lp/'], disallow: ['/', '/blog/busca', '/api/'] },
    sitemap: `${SITE}/sitemap.xml`,
  }
}
