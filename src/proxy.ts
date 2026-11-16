import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { rotaPublica } from '@/dominio/acesso'
import { caminhoInternoDaBio, hostEhDaBio } from '@/dominio/bio'
import { limiteDaRota, permitir } from '@/dominio/limite'
import { opcoesRealtime } from '@/infra/supabase/realtime'
import { COOKIE_SESSAO, sessaoValida } from '@/infra/sessao'

// Rotas públicas que gravam (leads, newsletter, eventos do blog, visitas e quiz da bio): limite de pedidos por IP.
function excedeu(req: NextRequest, caminho: string): boolean {
  const limite = limiteDaRota(req.method, caminho)
  if (!limite) return false
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'sem-ip'
  return !permitir(`${limite.grupo}|${ip}`, limite.max, Date.now())
}
const muitosPedidos = () => new NextResponse(null, { status: 429, headers: { 'Retry-After': '60' } })

// Checagem otimista: renova a sessão do Supabase e manda quem não está logado para /login.
// Papel (equipe × cliente) é decidido nas páginas (exigirEquipe/exigirCliente); a garantia é a RLS.
export async function proxy(req: NextRequest) {
  const caminho = req.nextUrl.pathname

  // Domínio dedicado às páginas da bio (BIO_DOMINIO): /<cliente> abre a página; qualquer outro caminho é 404 em branco.
  if (hostEhDaBio(req.headers.get('host'), process.env.BIO_DOMINIO)) {
    const interno = caminhoInternoDaBio(caminho)
    if (!interno) return new NextResponse(null, { status: 404 })
    if (excedeu(req, interno)) return muitosPedidos()
    const destino = req.nextUrl.clone()
    destino.pathname = interno
    return NextResponse.rewrite(destino)
  }

  if (excedeu(req, caminho)) return muitosPedidos()

  // App antigo de aprovação (até a Fase 1b): senha única em cookie próprio.
  if (caminho === '/admin' || caminho.startsWith('/admin/')) {
    if (caminho === '/admin/login') return NextResponse.next()
    const valor = req.cookies.get(COOKIE_SESSAO)?.value
    if (sessaoValida(valor, process.env.SESSAO_SEGREDO ?? '', Date.now())) return NextResponse.next()
    return NextResponse.redirect(new URL('/admin/login', req.url))
  }

  let res = NextResponse.next({ request: req })
  const sb = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    realtime: opcoesRealtime,
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (lista, cabecalhos) => {
        lista.forEach(({ name, value }) => req.cookies.set(name, value))
        res = NextResponse.next({ request: req })
        lista.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
        Object.entries(cabecalhos).forEach(([k, v]) => res.headers.set(k, v))
      },
    },
  })
  const { data } = await sb.auth.getClaims()

  if (!data?.claims && !rotaPublica(caminho)) {
    const destino = new URL('/login', req.url)
    const redir = NextResponse.redirect(destino)
    res.cookies.getAll().forEach((c) => redir.cookies.set(c))
    return redir
  }
  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
}
