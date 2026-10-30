import type { NextConfig } from 'next'
import { SLUGS_DAS_LANDINGS } from './src/dominio/landings'

const nextConfig: NextConfig = {
  serverExternalPackages: ['@electric-sql/pglite', 'ffmpeg-static'],
  // O binário do ffmpeg (extrai o áudio dos vídeos da caixa) precisa ir junto com as funções que o usam.
  outputFileTracingIncludes: { '/caixa-de-entrada': ['./node_modules/ffmpeg-static/ffmpeg'], '/api/mcp': ['./node_modules/ffmpeg-static/ffmpeg'] },
  // O artigo do blog chega como arquivo (.docx/.md, até 3 MB) numa ação do servidor; o padrão é 1 MB.
  experimental: { serverActions: { bodySizeLimit: '4mb' } },
  // Cada landing é um arquivo estático em public/lp/<slug>/index.html servido em /<slug>.
  async rewrites() {
    return SLUGS_DAS_LANDINGS.map((slug) => ({ source: `/${slug}`, destination: `/lp/${slug}/index.html` }))
  },
  // www.gruposrv.com.br é do site público: enquanto não houver uma página inicial, a raiz mostra a calculadora (como antes de o app assumir o domínio).
  // O app (app.gruposrv.com.br) não é afetado. Troque o destino quando existir a página inicial.
  async redirects() {
    return [
      { source: '/', has: [{ type: 'host', value: 'www.gruposrv.com.br' }], destination: '/calculadora', permanent: false },
      // O blog mora só no www (um endereço por artigo, para o Google não ver conteúdo duplicado).
      ...['app.gruposrv.com.br', 'gruposrv.com.br', 'conteudo.gruposrv.com.br'].map((host) => ({ source: '/blog/:caminho*', has: [{ type: 'host' as const, value: host }], destination: 'https://www.gruposrv.com.br/blog/:caminho*', permanent: true })),
    ]
  },
}

export default nextConfig
