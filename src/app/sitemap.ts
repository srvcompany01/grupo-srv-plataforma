import type { MetadataRoute } from 'next'
import { SITE } from '@/dominio/blog'
import { categorias, enderecosPublicados } from '@/servicos/blog'

export const revalidate = 600

/** Mapa do site público (www.gruposrv.com.br): blog, categorias, autores e as landing pages. O app não entra. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, cats] = await Promise.all([enderecosPublicados().catch(() => []), categorias().catch(() => [])])
  const autores = [...new Set(posts.map((p) => p.autor).filter((a): a is string => !!a))]
  const ultimo = posts[0]?.atualizadoEm
  return [
    { url: `${SITE}/blog`, lastModified: ultimo, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE}/maquinadevendas`, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${SITE}/calculadora`, changeFrequency: 'monthly', priority: 0.7 },
    ...cats.map((c) => ({ url: `${SITE}/blog/categoria/${c.slug}`, lastModified: posts.find((p) => p.categoria === c.slug)?.atualizadoEm, changeFrequency: 'weekly' as const, priority: 0.8 })),
    ...posts.map((p) => ({ url: `${SITE}/blog/${p.slug}`, lastModified: p.atualizadoEm, changeFrequency: 'monthly' as const, priority: 0.7 })),
    ...autores.map((a) => ({ url: `${SITE}/blog/autor/${a}`, changeFrequency: 'monthly' as const, priority: 0.4 })),
  ]
}
