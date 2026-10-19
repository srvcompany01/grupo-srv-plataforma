import type { NextConfig } from 'next'
import { SLUGS_DAS_LANDINGS } from './src/dominio/landings'

const nextConfig: NextConfig = {
  serverExternalPackages: ['@electric-sql/pglite'],
  // Cada landing é um arquivo estático em public/lp/<slug>/index.html servido em /<slug>.
  async rewrites() {
    return SLUGS_DAS_LANDINGS.map((slug) => ({ source: `/${slug}`, destination: `/lp/${slug}/index.html` }))
  },
  // www.gruposrv.com.br é do site público: enquanto não houver uma página inicial, a raiz mostra a calculadora (como antes de o app assumir o domínio).
  // O app (app.gruposrv.com.br) não é afetado. Troque o destino quando existir a página inicial.
  async redirects() {
    return [{ source: '/', has: [{ type: 'host', value: 'www.gruposrv.com.br' }], destination: '/calculadora', permanent: false }]
  },
}

export default nextConfig
