import { chaveDeMidiaValida, type Aprovacao, type Decisao, type Formato } from '@/dominio/conteudo'
import { validarEntrada } from '@/dominio/midias'
import { LIMITE_TEXTO_NEGOCIO } from '@/dominio/google'
import { ALVOS, validarPublicacao, type Alvo, type ModoPublicacao, type StatusPublicacao } from '@/dominio/publicacao'
import type { TipoMidia } from '@/dominio/tipos'
import { urlLeitura } from '@/infra/r2'
import type { Supabase } from '@/infra/supabase/servidor'
import { dados } from './resultado'

export type MidiaDoPost = { id: string; tipo: TipoMidia; nome: string; tamanho: number; url: string; chave: string }
export type RespostaDoCliente = { decisao: Decisao; comentario: string; nome: string; em: string }
export type VersaoDoPost = { id: string; numero: number; ideia: string; objetivo: string; legenda: string; midias: MidiaDoPost[]; resposta: RespostaDoCliente | null }
export type ConteudoDaTarefa = { formato: Formato; aprovacao: Aprovacao; versaoAtual: number; versoes: VersaoDoPost[] }
export type NovaMidia = { chave: string; tipo: TipoMidia; nome: string; tamanho: number }

/** Cria tarefa + post em rascunho + versão 1 de uma vez (função `criar_post_conteudo`). Devolve o id da tarefa. */
export async function criarPost(sb: Supabase, e: { listaId: string; clienteId: string; titulo: string; formato: Formato; dataPrevista: string }): Promise<string> {
  return dados(await sb.rpc('criar_post_conteudo', { p_list: e.listaId, p_client: e.clienteId, p_title: e.titulo, p_format: e.formato, p_date: e.dataPrevista }))
}

/** null se a tarefa não é um post de conteúdo (ou a RLS esconde). Versões da mais nova para a mais antiga. */
export async function buscarConteudo(sb: Supabase, tarefaId: string): Promise<ConteudoDaTarefa | null> {
  const { data, error } = await sb
    .from('content_posts')
    .select(
      `format, approval, current_version,
       content_versions(id, number, idea, objective, caption,
         content_media(id, position, kind, r2_key, original_name, size_bytes, arquivado_em),
         content_responses(decision, comment, responder_name, created_at))`,
    )
    .eq('task_id', tarefaId)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  const versoes = await Promise.all(
    [...data.content_versions]
      .sort((a, b) => b.number - a.number)
      .map(async (v): Promise<VersaoDoPost> => {
        const r = v.content_responses // relação 1:1: a versão tem no máximo uma resposta
        return {
          id: v.id,
          numero: v.number,
          ideia: v.idea,
          objetivo: v.objective,
          legenda: v.caption,
          midias: await Promise.all(
            [...v.content_media]
              .sort((a, b) => a.position - b.position)
              .map(async (m) => ({ id: m.id, tipo: (m.arquivado_em ? 'imagem' : m.kind) as TipoMidia, nome: m.original_name, tamanho: m.size_bytes, url: await urlLeitura(m.r2_key, { arquivado: m.arquivado_em }), chave: m.r2_key })),
          ),
          resposta: r ? { decisao: r.decision as Decisao, comentario: r.comment, nome: r.responder_name, em: r.created_at } : null,
        }
      }),
  )
  return { formato: data.format as Formato, aprovacao: data.approval as Aprovacao, versaoAtual: data.current_version, versoes }
}

/** Salva ideia/objetivo/legenda. Depois da resposta do cliente cria a versão seguinte. Devolve o número da versão gravada. */
export async function salvarTexto(sb: Supabase, tarefaId: string, t: { ideia: string; objetivo: string; legenda: string }): Promise<number> {
  return dados(await sb.rpc('salvar_texto_conteudo', { p_task: tarefaId, p_idea: t.ideia, p_objective: t.objetivo, p_caption: t.legenda }))
}

/** Registra uma mídia já enviada ao R2 na versão atual. Valida a chave (do post) e o tipo/tamanho antes de gravar. */
export async function registrarMidia(sb: Supabase, tarefaId: string, m: NovaMidia): Promise<string> {
  if (!chaveDeMidiaValida(m.chave, tarefaId)) throw new Error('Mídia inválida para este post.')
  validarEntrada({ chave: m.chave, tipo: m.tipo, nomeOriginal: m.nome, tamanhoBytes: m.tamanho })
  return dados(await sb.rpc('registrar_midia_conteudo', { p_task: tarefaId, p_key: m.chave, p_kind: m.tipo, p_name: m.nome, p_size: m.tamanho }))
}

/** Só funciona em versão ainda não respondida (o banco recusa a congelada). */
export async function removerMidia(sb: Supabase, midiaId: string): Promise<void> {
  const { error } = await sb.from('content_media').delete().eq('id', midiaId)
  if (error) throw error
}

export type PublicacaoDoPost = {
  em: string | null
  alvos: Alvo[]
  modo: ModoPublicacao
  status: StatusPublicacao
  erro: string | null
  igLink: string | null
  fbLink: string | null
  googleLink: string | null
  publicadoEm: string | null
  dataPrevista: string | null
  cliente: { id: string; nome: string; paginaId: string | null; googlePerfil: string | null } | null
  /** @ convidados para a collab no Instagram. */
  collabs: string[]
}

/** Agendamento/publicação na Meta do post. null sem a migration de publicação (o post abre normalmente). */
export async function buscarPublicacao(sb: Supabase, tarefaId: string): Promise<PublicacaoDoPost | null> {
  const { data, error } = await sb
    .from('content_posts')
    .select('publish_at, publish_targets, publish_mode, publish_status, publish_error, ig_permalink, fb_permalink, gbp_link, published_at, collaborators, tasks(due_date, clients(id, name, meta_page_id, google_location))')
    .eq('task_id', tarefaId)
    .maybeSingle()
  if (error || !data) return null
  const c = data.tasks?.clients
  return {
    em: data.publish_at,
    alvos: data.publish_targets as Alvo[],
    modo: data.publish_mode as ModoPublicacao,
    status: data.publish_status as StatusPublicacao,
    erro: data.publish_error,
    igLink: data.ig_permalink,
    fbLink: data.fb_permalink,
    googleLink: data.gbp_link,
    publicadoEm: data.published_at,
    dataPrevista: data.tasks?.due_date ?? null,
    cliente: c ? { id: c.id, nome: c.name, paginaId: c.meta_page_id, googlePerfil: c.google_location } : null,
    collabs: data.collaborators ?? [],
  }
}

/** Grava o agendamento (e, no modo aprovação, manda o rascunho para o cliente). A RLS confere o acesso ao post. */
export async function agendarPost(sb: Supabase, tarefaId: string, a: { em: string; alvos: Alvo[]; modo: ModoPublicacao; enviarAoCliente: boolean; collabs?: string[] }): Promise<void> {
  const campos = { publish_at: a.em, publish_targets: a.alvos, publish_mode: a.modo, publish_status: 'agendado', publish_error: null, ...(a.collabs ? { collaborators: a.collabs } : {}), ...(a.enviarAoCliente ? { approval: 'aguardando' } : {}) }
  if (!dados(await sb.from('content_posts').update(campos).eq('task_id', tarefaId).select('task_id')).length) throw { code: '42501' }
}

export async function cancelarAgendamento(sb: Supabase, tarefaId: string): Promise<void> {
  if (!dados(await sb.from('content_posts').update({ publish_status: 'nao_agendado', publish_error: null }).eq('task_id', tarefaId).in('publish_status', ['agendado', 'falhou']).select('task_id')).length) throw { code: '42501' }
}

/** Confere se o post pode ir para as redes (alvos, mídias, formato, Página do cliente). null = pode. */
export async function problemaParaPublicar(sb: Supabase, tarefaId: string, alvos: Alvo[], collabs?: string[]): Promise<string | null> {
  if (!alvos.length || alvos.some((a) => !(ALVOS as readonly string[]).includes(a))) return 'Escolha onde publicar (Instagram, Facebook e/ou Google Meu Negócio).'
  const [post, pub] = await Promise.all([buscarConteudo(sb, tarefaId), buscarPublicacao(sb, tarefaId)])
  if (!post || !pub) return 'Post não encontrado (ou falta a migration de publicação).'
  if (post.formato !== 'stories' && !post.versoes[0].legenda.trim()) return 'O post está sem legenda: escreva a legenda do post (campo Legenda, ou atualizar_conteudo_post) antes de agendar. A descrição da tarefa não é publicada.'
  if (alvos.some((a) => a !== 'google') && !pub.cliente?.paginaId) return 'O cliente não tem a Página do Facebook no cadastro (campo "Biblioteca de anúncios do Meta").'
  if (alvos.includes('google') && !pub.cliente?.googlePerfil) return 'O cliente não tem o perfil do Google Meu Negócio ligado (página do cliente → Google Meu Negócio).'
  if (alvos.includes('google') && post.versoes[0].legenda.length > LIMITE_TEXTO_NEGOCIO) return `No Google Meu Negócio o texto vai até ${LIMITE_TEXTO_NEGOCIO} caracteres (a legenda tem ${post.versoes[0].legenda.length}).`
  return validarPublicacao(post.formato, alvos, post.versoes[0].midias.map((m) => ({ tipo: m.tipo, nome: m.nome, chave: m.chave })), collabs ?? pub.collabs)
}

export type Agendamento = {
  id: string
  titulo: string
  formato: Formato
  aprovacao: Aprovacao
  em: string | null
  alvos: Alvo[]
  modo: ModoPublicacao
  status: StatusPublicacao
  erro: string | null
  igLink: string | null
  fbLink: string | null
  publicadoEm: string | null
  /** Id do post no Instagram (para as métricas). */
  igMediaId: string | null
  cliente: { id: string; nome: string; cor: string } | null
  capa: { tipo: TipoMidia; url: string } | null
}

/** Posts agendados, esperando o cliente, publicados ou com falha (a RLS mostra só os que a pessoa vê). */
export async function listarAgendamentos(sb: Supabase): Promise<Agendamento[]> {
  const { data, error } = await sb
    .from('content_posts')
    .select('task_id, format, approval, current_version, publish_at, publish_targets, publish_mode, publish_status, publish_error, ig_permalink, ig_media_id, fb_permalink, published_at, tasks!inner(title, archived_at, clients(id, name, color)), content_versions(number, content_media(kind, r2_key, position, arquivado_em))')
    .is('tasks.archived_at', null)
    .or('publish_status.neq.nao_agendado,approval.in.(aguardando,ajuste)')
    .order('publish_at', { ascending: true, nullsFirst: false })
    .limit(300)
  if (error) throw error
  return Promise.all(
    data.map(async (p) => {
      const midia = [...(p.content_versions.find((v) => v.number === p.current_version)?.content_media ?? [])].sort((a, b) => a.position - b.position)[0]
      const c = p.tasks.clients
      return {
        id: p.task_id,
        titulo: p.tasks.title,
        formato: p.format as Formato,
        aprovacao: p.approval as Aprovacao,
        em: p.publish_at,
        alvos: p.publish_targets as Alvo[],
        modo: p.publish_mode as ModoPublicacao,
        status: p.publish_status as StatusPublicacao,
        erro: p.publish_error,
        igLink: p.ig_permalink,
        fbLink: p.fb_permalink,
        publicadoEm: p.published_at,
        igMediaId: p.ig_media_id,
        cliente: c ? { id: c.id, nome: c.name, cor: c.color } : null,
        capa: midia ? { tipo: (midia.arquivado_em ? 'imagem' : midia.kind) as TipoMidia, url: await urlLeitura(midia.r2_key, { arquivado: midia.arquivado_em }) } : null,
      }
    }),
  )
}

export async function alterarFormato(sb: Supabase, tarefaId: string, formato: Formato): Promise<void> {
  if (!dados(await sb.from('content_posts').update({ format: formato }).eq('task_id', tarefaId).select('task_id')).length) throw { code: '42501' }
}

/** Tipo da lista: 'conteudo' faz toda subtarefa virar post (o banco converte as que já existem). */
export async function definirTipoLista(sb: Supabase, listaId: string, tipo: 'tarefas' | 'conteudo'): Promise<void> {
  if (!dados(await sb.from('lists').update({ kind: tipo }).eq('id', listaId).select('id')).length) throw { code: '42501' }
}

/** Tarefas-mãe das listas de conteúdo (onde nascem os posts como subtarefas), com o cliente. */
export async function tarefasMaeDeConteudo(sb: Supabase): Promise<{ id: string; titulo: string; listaId: string; cliente: string | null }[]> {
  const listas = dados(await sb.from('lists').select('id').eq('kind', 'conteudo').is('archived_at', null)).map((l) => l.id)
  if (!listas.length) return []
  const [maes, posts] = await Promise.all([
    sb.from('tasks').select('id, title, list_id, clients(name)').in('list_id', listas).is('parent_task_id', null).is('archived_at', null).order('created_at', { ascending: false }).limit(200).then(dados),
    sb.from('content_posts').select('task_id, tasks!inner(list_id, parent_task_id)').in('tasks.list_id', listas).is('tasks.parent_task_id', null).then(dados),
  ])
  const avulsos = new Set(posts.map((p) => p.task_id))
  return maes.filter((m) => !avulsos.has(m.id)).map((m) => ({ id: m.id, titulo: m.title, listaId: m.list_id, cliente: m.clients?.name ?? null }))
}
