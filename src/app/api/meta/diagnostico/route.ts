import { NextResponse } from 'next/server'
import { usuarioAtual } from '@/infra/supabase/sessao'

const VERSAO = process.env.META_API_VERSION || 'v23.0'
const PRECISA = ['ads_read', 'pages_show_list', 'pages_read_engagement', 'pages_manage_posts', 'instagram_basic', 'instagram_content_publish', 'business_management']

/**
 * Diagnóstico do token do Meta (só admin): permissões, validade e as Páginas/Instagram que ele alcança.
 * O token nunca sai do servidor; a resposta traz só nomes e ids.
 */
export async function GET() {
  const eu = await usuarioAtual()
  if (!eu || !eu.ativo || eu.papel !== 'admin') return NextResponse.json({ erro: 'Só o admin.' }, { status: 403 })
  const token = process.env.META_ACCESS_TOKEN
  if (!token) return NextResponse.json({ erro: 'META_ACCESS_TOKEN não configurado.' })
  const graph = async (caminho: string) => {
    const r = await fetch(`https://graph.facebook.com/${VERSAO}/${caminho}${caminho.includes('?') ? '&' : '?'}access_token=${encodeURIComponent(token)}`, { cache: 'no-store' })
    const corpo = await r.json()
    return corpo.error ? { erro: `${corpo.error.code}: ${corpo.error.message}` } : corpo
  }
  const [info, contas] = await Promise.all([
    graph(`debug_token?input_token=${encodeURIComponent(token)}`),
    graph('me/accounts?fields=id,name,tasks,instagram_business_account{id,username}&limit=100'),
  ])
  const dados = info.data ?? {}
  const escopos: string[] = dados.scopes ?? []
  return NextResponse.json({
    tipo: dados.type,
    valido: dados.is_valid,
    expira: dados.expires_at ? (dados.expires_at === 0 ? 'nunca' : new Date(dados.expires_at * 1000).toISOString()) : 'nunca',
    escopos,
    faltando: PRECISA.filter((p) => !escopos.includes(p)),
    paginas: contas.erro ? contas : (contas.data ?? []).map((p: { id: string; name: string; tasks?: string[]; instagram_business_account?: { id: string; username: string } }) => ({ id: p.id, nome: p.name, permissoes: p.tasks, instagram: p.instagram_business_account ?? null })),
    erroDebug: info.erro,
  })
}
