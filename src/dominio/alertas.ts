/** Textos dos alertas do sistema que vão ao sino dos admins (token da Meta vencendo, erro em produção). */

const DIA = 86_400_000

/** Resposta de `debug_token` da Meta → aviso a dar, ou null se o token está bem. `expires_at` em segundos; 0 = não vence. */
export function alertaDoTokenMeta(dados: { is_valid?: boolean; expires_at?: number } | null, agora: number, diasDeAviso = 10): string | null {
  if (!dados) return null
  if (dados.is_valid === false) return 'Token da Meta inválido ou vencido: anúncios, insights e publicação de posts estão parados. Gere um token novo e troque o META_ACCESS_TOKEN.'
  if (!dados.expires_at) return null
  const dias = Math.floor((dados.expires_at * 1000 - agora) / DIA)
  if (dias > diasDeAviso) return null
  return `Token da Meta vence ${dias <= 0 ? 'hoje' : dias === 1 ? 'amanhã' : `em ${dias} dias`}: gere um token novo e troque o META_ACCESS_TOKEN antes disso, senão anúncios, insights e publicação de posts param.`
}

const ONDE = { render: 'ao abrir a página', route: 'numa rota de API', action: 'ao salvar uma ação', proxy: 'na entrada do app' } as const

/** Erro do servidor → texto do aviso. O caminho vai sem a consulta (pode ter token ou dado de cliente). */
export function alertaDeErro(mensagem: string, caminho: string, tipo: string, digest?: string): string {
  const onde = ONDE[tipo as keyof typeof ONDE] ?? 'no servidor'
  return `Erro na plataforma ${onde} ${caminho.split('?')[0]}: ${mensagem.replace(/\s+/g, ' ').trim() || 'sem mensagem'}${digest ? ` (código ${digest})` : ''}`.slice(0, 300)
}
