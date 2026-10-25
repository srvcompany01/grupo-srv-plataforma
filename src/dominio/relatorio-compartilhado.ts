/**
 * Relatório que a agência manda ao cliente: uma foto dos números do período (anúncios, Instagram e Google Meu
 * Negócio) guardada no banco, aberta por um link público com token, e o texto pronto para o WhatsApp.
 */
import type { MetricasGrade, PontoGrade, Ponto } from './gmn'

export type RelatorioCompartilhado = {
  cliente: string
  de: string
  ate: string
  geradoEm: string
  anuncios: {
    /** null quando a agência escolheu não mostrar o investimento. */
    investido: number | null
    conversas: number
    formularios: number
    conversoesGoogle: number
    cliques: number
    impressoes: number
    custoPorLead: number | null
  } | null
  instagram: { usuario: string; seguidores: number; novosSeguidores: number; alcance: number; visualizacoes: number; interacoes: number; posts: number; engajamentoPosts: number | null; melhorPost: { legenda: string; link: string; interacoes: number } | null } | null
  gmn: { nota: number | null; avaliacoes: number; saude: number; geogrid: { palavra: string; metricas: MetricasGrade; centro: Ponto; pontos: PontoGrade[]; em: string } | null } | null
  destaques: string[]
}

export const TOKEN_RELATORIO = /^[A-Za-z0-9]{32}$/

export const leadsDoRelatorio = (a: NonNullable<RelatorioCompartilhado['anuncios']>) => a.conversas + a.formularios + Math.round(a.conversoesGoogle)

const data = (d: string) => d.split('-').reverse().slice(0, 2).join('/')
const reais = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const num = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })

/** Texto do WhatsApp: os números principais e o link do relatório completo. */
export function textoWhatsapp(r: RelatorioCompartilhado, url: string): string {
  const linhas = [`Olá! Segue o relatório da ${r.cliente} de ${data(r.de)} a ${data(r.ate)} 📊`, '']
  if (r.anuncios) {
    const leads = leadsDoRelatorio(r.anuncios)
    linhas.push('*Anúncios*')
    if (r.anuncios.investido !== null) linhas.push(`• Investimento: ${reais(r.anuncios.investido)}`)
    linhas.push(`• Leads: ${num(leads)}${r.anuncios.conversas ? ` (${num(r.anuncios.conversas)} conversas no WhatsApp/Direct)` : ''}`)
    if (r.anuncios.custoPorLead !== null && r.anuncios.investido !== null) linhas.push(`• Custo por lead: ${reais(r.anuncios.custoPorLead)}`)
    linhas.push('')
  }
  if (r.instagram) {
    linhas.push('*Instagram*')
    linhas.push(`• ${r.instagram.novosSeguidores >= 0 ? '+' : ''}${num(r.instagram.novosSeguidores)} seguidores (total ${num(r.instagram.seguidores)})`)
    linhas.push(`• ${num(r.instagram.alcance)} pessoas alcançadas · ${num(r.instagram.posts)} posts`)
    linhas.push('')
  }
  if (r.gmn) {
    linhas.push('*Google*')
    linhas.push(`• Nota ${r.gmn.nota === null ? '—' : `★ ${num(r.gmn.nota)}`} com ${num(r.gmn.avaliacoes)} avaliações`)
    if (r.gmn.geogrid) linhas.push(`• Top 3 do Google Maps em ${num(r.gmn.geogrid.metricas.top3)}% da região para "${r.gmn.geogrid.palavra}"`)
    linhas.push('')
  }
  linhas.push(`Relatório completo: ${url}`)
  return linhas.join('\n')
}

/** Link do WhatsApp com o texto pronto (para o número do cliente, se houver). */
export const linkWhatsapp = (texto: string, numero: string | null) => `https://wa.me/${numero ?? ''}?text=${encodeURIComponent(texto)}`
