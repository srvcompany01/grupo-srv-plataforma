import 'server-only'
import { lerLinkBio, MAXIMO_LINKS_BIO, montarResumoBio, type ResumoBio } from '@/dominio/bio'
import { APARENCIA_PADRAO, lerAparencia, lerPerguntas, type AparenciaQuiz, type Pergunta } from '@/dominio/bio-quiz'
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

/** Visitas, toques por botão e por dia de um cliente no período (inclui botões já removidos que tiveram toque). */
export async function resumoDaBio(sb: Supabase, clienteId: string, de: string, ate: string, temWhatsapp: boolean): Promise<ResumoBio> {
  const mapa = await resumoDaBioDeVarios(sb, [{ id: clienteId, temWhatsapp }], de, ate)
  return mapa.get(clienteId)!
}

/** O mesmo resumo para vários clientes de uma vez (4 consultas, qualquer quantidade de clientes). */
export async function resumoDaBioDeVarios(sb: Supabase, clientes: { id: string; temWhatsapp: boolean }[], de: string, ate: string): Promise<Map<string, ResumoBio>> {
  const ids = clientes.map((c) => c.id)
  const [v, w, b, l, q] = await Promise.all([
    sb.from('bio_clicks').select('client_id, day, origem, clicks').in('client_id', ids).gte('day', de).lte('day', ate),
    sb.from('bio_visualizacoes').select('client_id, day, origem, views, visitantes').in('client_id', ids).gte('day', de).lte('day', ate),
    sb.from('bio_botao_clicks').select('client_id, botao, rotulo, day, clicks').in('client_id', ids).gte('day', de).lte('day', ate),
    sb.from('bio_links').select('client_id, id, rotulo, position').in('client_id', ids).order('position'),
    sb.from('bio_leads').select('client_id, day, origem, respostas').in('client_id', ids).gte('day', de).lte('day', ate).limit(5000),
  ])
  const por = <T extends { client_id: string }>(xs: T[] | null) => (xs ?? []).reduce((m, x) => m.set(x.client_id, [...(m.get(x.client_id) ?? []), x]), new Map<string, T[]>())
  const visitas = por(v.data)
  const visualizacoes = por(w.data)
  const botoes = por(b.data)
  const links = por(l.data)
  const leads = por(q.data)
  return new Map(clientes.map((c) => [c.id, montarResumoBio({ visitas: visitas.get(c.id) ?? [], visualizacoes: visualizacoes.get(c.id) ?? [], botoes: botoes.get(c.id) ?? [], links: links.get(c.id) ?? [], leads: leads.get(c.id) ?? [], temWhatsapp: c.temWhatsapp })]))
}

/** Perguntas do quiz de um cliente (vazio = a página usa o quiz padrão). */
export async function perguntasDoCliente(sb: Supabase, clienteId: string): Promise<Pergunta[]> {
  const { data } = await sb.from('bio_perguntas').select('pergunta, opcoes').eq('client_id', clienteId).order('position').order('created_at')
  return data ?? []
}

/** Troca todas as perguntas do cliente pelas informadas (lista vazia volta ao quiz padrão). */
export async function salvarPerguntasBio(sb: Supabase, clienteId: string, brutas: { pergunta: string; opcoes: string }[]): Promise<void> {
  const perguntas = lerPerguntas(brutas)
  if ('erro' in perguntas) throw { code: 'P0001', message: perguntas.erro }
  dados(await sb.from('bio_perguntas').delete().eq('client_id', clienteId).select('id'))
  if (perguntas.length) dados(await sb.from('bio_perguntas').insert(perguntas.map((q, i) => ({ client_id: clienteId, position: i, pergunta: q.pergunta, opcoes: q.opcoes }))).select('id'))
}

/** Aparência do botão do WhatsApp e do quiz do cliente (vazio = padrão). */
export async function aparenciaDoCliente(sb: Supabase, clienteId: string): Promise<AparenciaQuiz> {
  const { data } = await sb.from('clients').select('bio_botao_texto, bio_botao_fundo, bio_botao_letra, bio_quiz_titulo, bio_quiz_descricao').eq('id', clienteId).maybeSingle()
  return data ? { botaoTexto: data.bio_botao_texto ?? '', botaoFundo: data.bio_botao_fundo ?? '', botaoLetra: data.bio_botao_letra ?? '', titulo: data.bio_quiz_titulo ?? '', descricao: data.bio_quiz_descricao ?? '' } : APARENCIA_PADRAO
}

export async function salvarAparencia(sb: Supabase, clienteId: string, bruta: Partial<AparenciaQuiz>): Promise<void> {
  const a = lerAparencia(bruta)
  if ('erro' in a) throw { code: 'P0001', message: a.erro }
  dados(await sb.from('clients').update({ bio_botao_texto: a.botaoTexto || null, bio_botao_fundo: a.botaoFundo || null, bio_botao_letra: a.botaoLetra || null, bio_quiz_titulo: a.titulo || null, bio_quiz_descricao: a.descricao || null }).eq('id', clienteId).select('id'))
}
