import 'server-only'
import { cache } from 'react'
import type { CanalAnuncios, ContaAnuncios, ResumoCanalAnuncios } from '@/dominio/central-anuncios'
import type { PagoPorDia } from '@/dominio/insights'
import { pagoPorDiaGoogle, estruturaGoogle } from './google-agencia'
import { pagoPorDiaMeta, resumoMetaPorTipo } from './meta-anuncios'
import { graph } from './publicacao-meta'

type CampanhaMeta = { id: string; status: string }
async function catalogoMeta(conta: string): Promise<CampanhaMeta[] | { erro: string }> {
  try {
    const campanhas: CampanhaMeta[] = []
    let depois: string | undefined
    do {
      const r = await graph<{ data: CampanhaMeta[]; paging?: { next?: string; cursors?: { after?: string } } }>(`act_${conta}/campaigns`, { params: { fields: 'id,status', effective_status: '["ACTIVE","PAUSED"]', limit: '300', ...(depois ? { after: depois } : {}) } })
      campanhas.push(...r.data)
      const proximo = r.paging?.next ? r.paging.cursors?.after : undefined
      if (proximo === depois) break
      depois = proximo
    } while (depois)
    return campanhas
  } catch (e) { return { erro: e instanceof Error ? e.message : 'Não foi possível consultar as campanhas da Meta.' } }
}
const soma = (dias: PagoPorDia[], campo: 'gasto' | 'cliques' | 'conversoes') => dias.reduce((s, d) => s + (d[campo] ?? 0), 0)
const vazio = (): ResumoCanalAnuncios => ({ gasto: null, cliques: null, resultados: null, gastoCaptacao: null, ativas: null, pausadas: null, dias: [] })
export const campanhasGoogleCentral = cache((conta: string, de: string, ate: string) => estruturaGoogle(conta, { de, ate }))

/** Cache apenas desta renderização; credenciais e respostas das APIs ficam no servidor. */
export const contaCentralAnuncios = cache(async (id: string, nome: string, metaId: string | null, googleId: string | null, de: string, ate: string, googleConectado: boolean, canal: CanalAnuncios): Promise<ContaAnuncios> => {
  const periodo = { de, ate }
  const comMeta = !!metaId && canal !== 'google', comGoogle = !!googleId && canal !== 'meta'
  const [md, mr, mc, gd, gc] = await Promise.all([
    comMeta ? pagoPorDiaMeta(metaId!, periodo) : null,
    comMeta ? resumoMetaPorTipo(metaId!, periodo) : null,
    comMeta ? catalogoMeta(metaId!) : null,
    comGoogle && googleConectado ? pagoPorDiaGoogle(googleId!, periodo) : null,
    comGoogle && googleConectado ? campanhasGoogleCentral(googleId!, de, ate) : null,
  ])
  const erros: string[] = []
  const ok = <T,>(r: T | { erro: string } | null, fonte: string): T | null => {
    if (r && typeof r === 'object' && 'erro' in r) { erros.push(`${fonte}: ${r.erro}`); return null }
    return r as T | null
  }
  const metaDia = ok(md, 'Investimento Meta'), metaResumo = ok(mr, 'Resultados Meta'), metaCampanhas = ok(mc, 'Campanhas Meta')
  const googleDia = ok(gd, 'Resultados Google'), googleCampanhas = ok(gc, 'Campanhas Google')
  let meta: ResumoCanalAnuncios | null = null, google: ResumoCanalAnuncios | null = null
  if (comMeta) meta = { ...vazio(), gasto: metaDia ? soma(metaDia, 'gasto') : null, cliques: metaDia ? soma(metaDia, 'cliques') : null, resultados: metaResumo?.captacao.leads ?? null, gastoCaptacao: metaResumo?.captacao.gasto ?? null, ativas: metaCampanhas?.filter(c => c.status === 'ACTIVE').length ?? null, pausadas: metaCampanhas?.filter(c => c.status === 'PAUSED').length ?? null, dias: metaDia ?? [] }
  if (comGoogle) {
    if (!googleConectado) erros.push('Google Ads: conecte a conta da agência para consultar os resultados.')
    google = { ...vazio(), gasto: googleDia ? soma(googleDia, 'gasto') : null, cliques: googleDia ? soma(googleDia, 'cliques') : null, resultados: googleDia ? soma(googleDia, 'conversoes') : null, ativas: googleCampanhas?.filter(c => c.status === 'ENABLED').length ?? null, pausadas: googleCampanhas?.filter(c => c.status === 'PAUSED').length ?? null, dias: googleDia ?? [] }
  }
  return { id, nome, meta, google, erros }
})
