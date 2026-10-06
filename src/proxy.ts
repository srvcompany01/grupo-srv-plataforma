import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { rotaPublica } from '@/dominio/acesso'
import { COOKIE_SESSAO, sessaoValida } from '@/infra/sessao'

// Checagem otimista: renova a sessão do Supabase e manda quem não está logado para /login.
// Papel (equipe × cliente) é decidido nas páginas (exigirEquipe/exigirCliente); a garantia é a RLS.
export async function proxy(req: NextRequest) {
  const caminho = req.nextUrl.pathname

  // App antigo de aprovação (até a Fase 1b): senha única em cookie próprio.
  if (caminho === '/admin' || caminho.startsWith('/admin/')) {
    if (caminho === '/admin/login') return NextResponse.next()
    const valor = req.cookies.get(COOKIE_SESSAO)?.value
    if (sessaoValida(valor, process.env.SESSAO_SEGREDO ?? '', Date.now())) return NextResponse.next()
    return NextResponse.redirect(new URL('/admin/login', req.url))
  }

  let res = NextResponse.next({ request: req })
  const sb = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
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
