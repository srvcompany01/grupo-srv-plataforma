import { chaveDeMidiaValida, type Aprovacao, type Decisao, type Formato } from '@/dominio/conteudo'
import { validarEntrada } from '@/dominio/midias'
import type { TipoMidia } from '@/dominio/tipos'
import { urlLeitura } from '@/infra/r2'
import type { Supabase } from '@/infra/supabase/servidor'
import { dados } from './resultado'

export type MidiaDoPost = { id: string; tipo: TipoMidia; nome: string; tamanho: number; url: string }
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
         content_media(id, position, kind, r2_key, original_name, size_bytes),
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
              .map(async (m) => ({ id: m.id, tipo: m.kind as TipoMidia, nome: m.original_name, tamanho: m.size_bytes, url: await urlLeitura(m.r2_key) })),
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
