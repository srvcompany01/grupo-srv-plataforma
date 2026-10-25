/**
 * Página da bio do cliente: só o nome e a logo do cliente, com os botões (WhatsApp do cadastro + links extras).
 * Fica no domínio dedicado (BIO_DOMINIO, ex.: links.exemplo.com/<cliente>) ou, sem ele, em /l/<cliente>.
 */
export const MAXIMO_LINKS_BIO = 8
export const ORIGENS_BIO = ['bio', 'story', 'anuncio'] as const

/** Robôs e pré-visualizações (Instagram, WhatsApp, Facebook, buscadores) não contam como clique. */
export const ehRobo = (userAgent: string | null | undefined) => !userAgent || /bot|crawl|spider|slurp|preview|facebookexternalhit|facebot|whatsapp|telegram|skype|embedly|quora|pinterest|headless|lighthouse|curl|wget|python-requests|okhttp|go-http/i.test(userAgent)

export const origemDaBio = (o: string | null | undefined) => (o && /^[a-z0-9_-]{1,20}$/.test(o) ? o : 'bio')

export const slugValido = (slug: string) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)

/** Endereço da página: no domínio dedicado (sem prefixo) ou no do app, em /l/. */
export function urlDaBio(slug: string, origem: string | null = null, dominio: string | undefined = process.env.BIO_DOMINIO): string {
  const base = dominio ? `https://${dominio}/${slug}` : `https://www.gruposrv.com.br/l/${slug}`
  return origem && origem !== 'bio' ? `${base}?o=${origem}` : base
}

/** Reescreve o caminho que chega no domínio da bio para a rota interna; null = não existe (página em branco 404). */
export function caminhoInternoDaBio(caminho: string): string | null {
  const m = caminho.match(/^\/([a-z0-9]+(?:-[a-z0-9]+)*)(?:\/ir\/([a-z0-9-]{1,40}))?\/?$/)
  if (!m) return null
  return m[2] ? `/l/${m[1]}/ir/${m[2]}` : `/l/${m[1]}`
}

export const hostEhDaBio = (host: string | null, dominio: string | undefined) => !!dominio && !!host && host.split(':')[0].toLowerCase() === dominio.toLowerCase()

/** Rótulo e endereço de um botão: https obrigatório (completa se faltar), até 500 caracteres. */
export function lerLinkBio(rotulo: string, url: string): { rotulo: string; url: string } | { erro: string } {
  const r = rotulo.trim()
  if (!r || r.length > 40) return { erro: 'Dê um nome de até 40 caracteres ao botão.' }
  const bruto = url.trim()
  const completo = /^https?:\/\//i.test(bruto) ? bruto : `https://${bruto}`
  try {
    const u = new URL(completo)
    if (!/^https?:$/.test(u.protocol) || !u.hostname.includes('.') || completo.length > 500) throw new Error('url')
    return { rotulo: r, url: u.toString() }
  } catch {
    return { erro: 'Endereço inválido. Use algo como https://www.site.com.br.' }
  }
}
