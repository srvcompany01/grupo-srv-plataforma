import type { Aprovacao, Formato } from './conteudo'

/**
 * Publicação dos posts de conteúdo na Meta: o que pode ir para onde e em que forma, e quando um post está pronto.
 * Instagram: só JPEG em foto; feed com 1 mídia (foto ou vídeo → Reels) ou carrossel (2 a 10); Reels = 1 vídeo;
 * Stories = cada mídia vira um story (só Instagram). Facebook: fotos (até 10) ou 1 vídeo, sem misturar.
 */

export const ALVOS = ['instagram', 'facebook'] as const
export type Alvo = (typeof ALVOS)[number]
export const ROTULO_ALVO: Record<Alvo, string> = { instagram: 'Instagram', facebook: 'Facebook' }

export type ModoPublicacao = 'aprovacao' | 'direto'
export type StatusPublicacao = 'nao_agendado' | 'agendado' | 'publicando' | 'publicado' | 'falhou'
export const ROTULO_STATUS_PUBLICACAO: Record<StatusPublicacao, string> = {
  nao_agendado: 'Não agendado',
  agendado: 'Agendado',
  publicando: 'Publicando…',
  publicado: 'Publicado',
  falhou: 'Falhou',
}

export type MidiaPublicavel = { tipo: 'imagem' | 'video'; nome: string; chave: string }

const ehJpeg = (m: MidiaPublicavel) => /\.jpe?g$/i.test(m.chave)

/** Regras de cada rede para o formato e as mídias da versão atual. null = pode publicar. */
export function validarPublicacao(formato: Formato, alvos: Alvo[], midias: MidiaPublicavel[], collabs: string[] = []): string | null {
  if (!alvos.length) return 'Escolha onde publicar (Instagram e/ou Facebook).'
  if (collabs.length && !alvos.includes('instagram')) return 'Collab é só no Instagram: marque o Instagram ou tire os convidados.'
  if (collabs.length && formato === 'stories') return 'Stories não aceitam collab: tire os convidados ou mude o formato.'
  if (formato === 'tiktok') return 'Post de TikTok não é publicado pela Meta. Mude o formato ou publique no TikTok.'
  if (!midias.length) return 'Adicione a foto ou o vídeo do post antes de agendar.'
  if (midias.length > 10) return 'No máximo 10 mídias por post.'
  const videos = midias.filter((m) => m.tipo === 'video').length
  if (formato === 'reels' && (midias.length !== 1 || videos !== 1)) return 'Reels precisa de exatamente 1 vídeo.'
  if (formato === 'stories' && alvos.includes('facebook')) return 'Stories só são publicados no Instagram. Desmarque o Facebook.'
  if (alvos.includes('instagram')) {
    const naoJpeg = midias.find((m) => m.tipo === 'imagem' && !ehJpeg(m))
    if (naoJpeg) return `O Instagram só aceita foto em JPG: troque "${naoJpeg.nome}" (as fotos novas já são convertidas no envio).`
  }
  if (alvos.includes('facebook') && videos > 0 && midias.length > 1) return 'No Facebook o post é só fotos ou só 1 vídeo (não mistura).'
  return null
}

/**
 * Collab no Instagram: até 3 perfis convidados como coautores (feed, Reels e carrossel). Aceita "@a, @b c" ou links
 * do perfil. O convidado aceita o convite no app; enquanto não aceita, o post sai só no perfil do cliente.
 */
export const MAX_COLLABS = 3
export function lerCollabs(texto: string): string[] | { erro: string } {
  const nomes = [...new Set(texto.split(/[\s,;]+/).map((t) => t.replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/[/?#].*$/, '').replace(/^@/, '').toLowerCase()).filter(Boolean))]
  const invalido = nomes.find((n) => !/^[a-z0-9._]{1,30}$/.test(n))
  if (invalido) return { erro: `"${invalido}" não é um @ válido do Instagram.` }
  if (nomes.length > MAX_COLLABS) return { erro: `No máximo ${MAX_COLLABS} perfis na collab.` }
  return nomes
}

/** Forma do post no Instagram. */
export type PlanoInstagram = { tipo: 'IMAGE' | 'REELS' | 'CAROUSEL' | 'STORIES'; midias: MidiaPublicavel[] }
export function planoInstagram(formato: Formato, midias: MidiaPublicavel[]): PlanoInstagram {
  if (formato === 'stories') return { tipo: 'STORIES', midias }
  if (formato === 'reels' || (midias.length === 1 && midias[0].tipo === 'video')) return { tipo: 'REELS', midias: midias.slice(0, 1) }
  if (midias.length === 1) return { tipo: 'IMAGE', midias }
  return { tipo: 'CAROUSEL', midias }
}

/** A rotina publica quando venceu a hora e (no modo aprovação) o cliente já aprovou a versão atual. */
export function prontoParaPublicar(p: { status: StatusPublicacao; em: string | null; modo: ModoPublicacao; aprovacao: Aprovacao }, agora: Date): boolean {
  if (p.status !== 'agendado' && p.status !== 'publicando') return false
  if (!p.em || Date.parse(p.em) > agora.getTime()) return false
  return p.modo === 'direto' || p.aprovacao === 'aprovado'
}

/** Situação para mostrar (equipe e cliente). */
export function situacaoPublicacao(p: { status: StatusPublicacao; em: string | null; modo: ModoPublicacao; aprovacao: Aprovacao }, agora: Date): string {
  if (p.status === 'publicado') return 'Publicado'
  if (p.status === 'falhou') return 'Falhou ao publicar'
  if (p.status === 'nao_agendado') return 'Não agendado'
  if (p.modo === 'aprovacao' && p.aprovacao !== 'aprovado') {
    const atrasado = p.em && Date.parse(p.em) < agora.getTime()
    return p.aprovacao === 'ajuste' ? 'Ajuste pedido pelo cliente' : atrasado ? 'Aguardando aprovação (horário já passou)' : 'Aguardando aprovação do cliente'
  }
  return p.status === 'publicando' ? 'Publicando…' : 'Agendado'
}
