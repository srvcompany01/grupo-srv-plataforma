import type { NextConfig } from 'next'
import { LANDINGS } from './src/dominio/landings'

const nextConfig: NextConfig = {
  serverExternalPackages: ['@electric-sql/pglite'],
  // Cada landing é um arquivo estático em public/lp/<slug>/index.html servido em /<slug>.
  async rewrites() {
    return LANDINGS.map((slug) => ({ source: `/${slug}`, destination: `/lp/${slug}/index.html` }))
  },
}

export default nextConfig
