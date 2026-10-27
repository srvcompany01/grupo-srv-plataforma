import { SLUGS_DAS_LANDINGS } from './landings'

export type PapelUsuario = 'admin' | 'gestor' | 'membro' | 'cliente'

const PREFIXOS_PUBLICOS = ['/login', '/r', '/.well-known', '/oauth', '/api/oauth', '/l', '/sobre', '/privacidade', '/exclusao-de-dados', '/blog', '/api/blog', '/sitemap.xml', '/auth', '/admin', '/c', '/cliente', '/f', '/api/cron', '/api/mcp', '/api/dev-arquivos', '/api/leads', '/lp', ...SLUGS_DAS_LANDINGS.map((slug) => `/${slug}`)]

const comecaCom = (caminho: string, prefixo: string) => caminho === prefixo || caminho.startsWith(`${prefixo}/`)

/** Rotas que não exigem sessão do Supabase (login e o app antigo, que tem a própria proteção). */
export function rotaPublica(caminho: string): boolean {
  return caminho === '/robots.txt' || PREFIXOS_PUBLICOS.some((p) => comecaCom(caminho, p))
}

/** Para onde mandar o usuário; null = pode seguir. */
export function destinoPorPapel(caminho: string, papel: PapelUsuario | null, ativo: boolean): string | null {
  if (rotaPublica(caminho)) return null
  if (!papel || !ativo) return '/login'
  const cliente = papel === 'cliente'
  if (caminho === '/') return cliente ? '/portal' : '/inicio'
  const noPortal = comecaCom(caminho, '/portal')
  if (cliente && !noPortal) return '/portal'
  if (!cliente && noPortal) return '/inicio'
  return null
}
