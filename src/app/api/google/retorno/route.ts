import { NextResponse, type NextRequest } from 'next/server'
import { usuarioAtual } from '@/infra/supabase/sessao'
import { concluirConexao } from '@/servicos/google-agenda'
import { concluirConexaoAgencia } from '@/servicos/google-agencia'

// Volta do consentimento do Google: confere o estado (contra CSRF), guarda o vínculo e volta para a agenda
// (ou para Anúncios, quando é a conta da agência: estado começa com "agencia.").
export async function GET(req: NextRequest) {
  const eu = await usuarioAtual()
  if (!eu || !eu.ativo || eu.papel === 'cliente') return NextResponse.redirect(new URL('/login', req.url))
  const q = req.nextUrl.searchParams
  const estado = req.cookies.get('google_estado')?.value
  const codigo = q.get('code')
  const agencia = !!estado?.startsWith('agencia.')
  let resultado = 'ok'
  if (!estado || estado !== q.get('state') || !codigo) resultado = q.get('error') === 'access_denied' ? 'cancelado' : 'erro'
  else {
    try {
      if (agencia) {
        if (eu.papel !== 'admin') throw new Error('Só o admin conecta o Google da agência.')
        await concluirConexaoAgencia(eu.id, codigo, req.nextUrl.origin)
      } else await concluirConexao(eu.id, codigo, req.nextUrl.origin)
    } catch (e) {
      console.error(e)
      resultado = 'erro'
    }
  }
  const res = NextResponse.redirect(new URL(`${agencia ? '/anuncios' : '/agenda'}?google=${resultado}`, req.url))
  res.cookies.delete({ name: 'google_estado', path: '/api/google' })
  return res
}
