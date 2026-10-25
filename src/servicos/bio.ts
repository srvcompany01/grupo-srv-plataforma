import 'server-only'
import { lerLinkBio, MAXIMO_LINKS_BIO } from '@/dominio/bio'
import type { Supabase } from '@/infra/supabase/servidor'
import { dados } from './resultado'

/** Página da bio de um cliente: logo (chave no R2) e botões extras (o do WhatsApp vem do cadastro). */
export type LinkDaBio = { id: string; rotulo: string; url: string }

export async function paginaBioDoCliente(sb: Supabase, clienteId: string): Promise<{ logo: string | null; links: LinkDaBio[] }> {
  const [c, l] = await Promise.all([
    sb.from('clients').select('bio_logo').eq('id', clienteId).maybeSingle(),
    sb.from('bio_links').select('id, rotulo, url').eq('client_id', clienteId).order('position').order('created_at'),
  ])
  return { logo: c.data?.bio_logo ?? null, links: l.error ? [] : (l.data ?? []) }
}

export async function adicionarLinkBio(sb: Supabase, clienteId: string, rotulo: string, url: string): Promise<void> {
  const l = lerLinkBio(rotulo, url)
  if ('erro' in l) throw { code: 'P0001', message: l.erro }
  const { count } = await sb.from('bio_links').select('id', { count: 'exact', head: true }).eq('client_id', clienteId)
  if ((count ?? 0) >= MAXIMO_LINKS_BIO) throw { code: 'P0001', message: `No máximo ${MAXIMO_LINKS_BIO} botões extras.` }
  dados(await sb.from('bio_links').insert({ client_id: clienteId, rotulo: l.rotulo, url: l.url, position: count ?? 0 }).select('id'))
}

export async function removerLinkBio(sb: Supabase, id: string): Promise<void> {
  dados(await sb.from('bio_links').delete().eq('id', id).select('id'))
}

export async function definirLogoBio(sb: Supabase, clienteId: string, chave: string | null): Promise<void> {
  dados(await sb.from('clients').update({ bio_logo: chave }).eq('id', clienteId).select('id'))
}

/** Visitas por origem e toques por botão no período (a equipe vê quem clicou onde). */
export async function resumoDaBio(sb: Supabase, clienteId: string, de: string, ate: string) {
  const [v, b, l] = await Promise.all([
    sb.from('bio_clicks').select('origem, clicks').eq('client_id', clienteId).gte('day', de).lte('day', ate),
    sb.from('bio_botao_clicks').select('botao, clicks').eq('client_id', clienteId).gte('day', de).lte('day', ate),
    sb.from('bio_links').select('id, rotulo').eq('client_id', clienteId),
  ])
  const soma = (xs: { k: string; clicks: number }[]) => [...xs.reduce((m, x) => m.set(x.k, (m.get(x.k) ?? 0) + x.clicks), new Map<string, number>())]
  const nomes = new Map((l.data ?? []).map((x) => [x.id, x.rotulo]))
  return {
    porOrigem: soma((v.data ?? []).map((x) => ({ k: x.origem, clicks: x.clicks }))).map(([origem, cliques]) => ({ origem, cliques })).sort((a, z) => z.cliques - a.cliques),
    porBotao: soma((b.data ?? []).map((x) => ({ k: x.botao, clicks: x.clicks }))).map(([id, cliques]) => ({ botao: id === 'whatsapp' ? 'WhatsApp' : nomes.get(id) ?? 'Botão removido', cliques })).sort((a, z) => z.cliques - a.cliques),
  }
}
