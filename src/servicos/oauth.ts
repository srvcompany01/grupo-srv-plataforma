import 'server-only'
import { gerarTokenApi, hashToken } from '@/dominio/api-token'
import { DURACAO_ACESSO_SEG, DURACAO_CODIGO_SEG, DURACAO_RENOVACAO_SEG, pkceConfere, retornoValido } from '@/dominio/oauth'
import { gerarToken } from '@/dominio/token'
import { criarClienteAdmin } from '@/infra/supabase/admin'

/**
 * OAuth 2.1 do MCP (registro dinâmico + código com PKCE + renovação). O token de acesso é um token srv_ comum
 * (api_tokens), então a autenticação do /api/mcp continua a mesma e a pessoa vê e revoga em Configurações.
 */
export class ErroOAuth extends Error {
  constructor(readonly codigo: string, mensagem: string) {
    super(mensagem)
  }
}

const emSeg = (s: number) => new Date(Date.now() + s * 1000).toISOString()

export async function registrarCliente(c: { redirect_uris?: unknown; client_name?: unknown }) {
  const uris = Array.isArray(c.redirect_uris) ? c.redirect_uris.filter((u): u is string => typeof u === 'string') : []
  if (!uris.length || uris.length > 10 || !uris.every(retornoValido)) throw new ErroOAuth('invalid_redirect_uri', 'Endereços de retorno inválidos (use https).')
  const id = `mcp_${gerarToken()}`
  const nome = String(c.client_name ?? '').slice(0, 120)
  const { error } = await criarClienteAdmin().from('oauth_clients').insert({ client_id: id, name: nome, redirect_uris: uris })
  if (error) throw error
  return { client_id: id, client_name: nome, redirect_uris: uris, client_id_issued_at: Math.floor(Date.now() / 1000), token_endpoint_auth_method: 'none', grant_types: ['authorization_code', 'refresh_token'], response_types: ['code'] }
}

export async function clienteOAuth(id: string): Promise<{ id: string; nome: string; retornos: string[] } | null> {
  if (!/^mcp_[A-Za-z0-9]{32}$/.test(id)) return null
  const { data } = await criarClienteAdmin().from('oauth_clients').select('client_id, name, redirect_uris').eq('client_id', id).maybeSingle()
  return data ? { id: data.client_id, nome: data.name, retornos: data.redirect_uris } : null
}

/** Depois que a pessoa autoriza: código de uso único, válido por 10 minutos. */
export async function criarCodigo(o: { userId: string; clientId: string; retorno: string; challenge: string; escopo: 'read' | 'write' }): Promise<string> {
  const codigo = gerarToken()
  const { error } = await criarClienteAdmin().from('oauth_codes').insert({ code_hash: await hashToken(codigo), client_id: o.clientId, user_id: o.userId, redirect_uri: o.retorno, code_challenge: o.challenge, scope: o.escopo, expires_at: emSeg(DURACAO_CODIGO_SEG) })
  if (error) throw error
  return codigo
}

async function emitir(userId: string, clientId: string, escopo: 'read' | 'write') {
  const admin = criarClienteAdmin()
  const { data: perfil } = await admin.from('profiles').select('active, role').eq('id', userId).maybeSingle()
  if (!perfil?.active || perfil.role === 'cliente') throw new ErroOAuth('invalid_grant', 'Usuário sem acesso à plataforma.')
  const cliente = await clienteOAuth(clientId)
  const acesso = gerarTokenApi()
  const { data: tok, error } = await admin.from('api_tokens').insert({ user_id: userId, name: `App do Claude${cliente?.nome ? ` (${cliente.nome})` : ''}`.slice(0, 80), token_hash: await hashToken(acesso), scope: escopo, expires_at: emSeg(DURACAO_ACESSO_SEG) }).select('id').single()
  if (error) throw error
  const renovacao = `${gerarToken()}${gerarToken()}`
  const r = await admin.from('oauth_refresh_tokens').insert({ token_hash: await hashToken(renovacao), client_id: clientId, user_id: userId, api_token_id: tok.id, scope: escopo, expires_at: emSeg(DURACAO_RENOVACAO_SEG) })
  if (r.error) throw r.error
  return { access_token: acesso, token_type: 'Bearer', expires_in: DURACAO_ACESSO_SEG, refresh_token: renovacao, scope: escopo }
}

export async function trocarCodigo(o: { codigo: string; clientId: string; retorno: string; verifier: string }) {
  const admin = criarClienteAdmin()
  const { data: c } = await admin.from('oauth_codes').select('*').eq('code_hash', await hashToken(o.codigo)).maybeSingle()
  if (!c || c.used_at || new Date(c.expires_at) <= new Date() || c.client_id !== o.clientId || c.redirect_uri !== o.retorno) throw new ErroOAuth('invalid_grant', 'Código inválido ou vencido.')
  if (!(await pkceConfere(o.verifier, c.code_challenge))) throw new ErroOAuth('invalid_grant', 'PKCE não confere.')
  // Marca como usado só se ainda não estava (duas trocas ao mesmo tempo: só uma passa).
  const { data: marcado } = await admin.from('oauth_codes').update({ used_at: new Date().toISOString() }).eq('code_hash', c.code_hash).is('used_at', null).select('code_hash')
  if (!marcado?.length) throw new ErroOAuth('invalid_grant', 'Código já usado.')
  return emitir(c.user_id, c.client_id, c.scope as 'read' | 'write')
}

/** Renovação com rotação: o token antigo (acesso e renovação) deixa de valer. */
export async function renovar(o: { renovacao: string; clientId: string }) {
  const admin = criarClienteAdmin()
  const hash = await hashToken(o.renovacao)
  const { data: r } = await admin.from('oauth_refresh_tokens').select('*').eq('token_hash', hash).maybeSingle()
  if (!r || r.revoked_at || new Date(r.expires_at) <= new Date() || r.client_id !== o.clientId) throw new ErroOAuth('invalid_grant', 'Renovação inválida ou vencida.')
  const { data: revogado } = await admin.from('oauth_refresh_tokens').update({ revoked_at: new Date().toISOString() }).eq('token_hash', hash).is('revoked_at', null).select('token_hash')
  if (!revogado?.length) throw new ErroOAuth('invalid_grant', 'Renovação já usada.')
  if (r.api_token_id) await admin.from('api_tokens').update({ revoked_at: new Date().toISOString() }).eq('id', r.api_token_id).is('revoked_at', null)
  return emitir(r.user_id, r.client_id, r.scope as 'read' | 'write')
}
