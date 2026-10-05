import { and, eq } from 'drizzle-orm'
import type { Db } from '@/db/conexao'
import { posts, respostas } from '@/db/schema'
import { ErroRegra } from '@/dominio/erros'
import { statusAposResposta } from '@/dominio/status'
import type { Decisao } from '@/dominio/tipos'
import { detalhePost, exigirUuid, listarPosts, versaoAtual, type PostDetalhe, type PostResumo } from './posts'

export interface EntradaResposta {
  clienteId: string
  postId: string
  versaoNumero: number
  decisao: Decisao
  comentario: string
  nome: string
}

const naoEncontrado = () => new ErroRegra('nao_encontrado', 'Post não encontrado.')

export async function responder(db: Db, e: EntradaResposta): Promise<void> {
  const comentario = e.comentario.trim()
  const nome = e.nome.trim()
  if (!nome) throw new ErroRegra('nome_obrigatorio', 'Informe seu nome.')
  if (e.decisao === 'ajuste' && !comentario) {
    throw new ErroRegra('comentario_obrigatorio', 'Conte o que precisa ser ajustado.')
  }
  exigirUuid(e.postId)

  await db.transaction(async (tx) => {
    // O UPDATE condicional é a trava: de dois toques simultâneos, só um encontra 'aguardando'.
    const alterados = await tx
      .update(posts)
      .set({ status: statusAposResposta(e.decisao), atualizadoEm: new Date() })
      .where(and(eq(posts.id, e.postId), eq(posts.clienteId, e.clienteId), eq(posts.status, 'aguardando')))
      .returning({ id: posts.id })

    if (alterados.length === 0) {
      const [p] = await tx
        .select({ status: posts.status })
        .from(posts)
        .where(and(eq(posts.id, e.postId), eq(posts.clienteId, e.clienteId)))
      if (!p || p.status === 'rascunho') throw naoEncontrado()
      throw new ErroRegra('status_invalido', 'Este post já foi respondido.')
    }

    const atual = await versaoAtual(tx, e.postId)
    if (atual.numero !== e.versaoNumero) {
      throw new ErroRegra('versao_desatualizada', 'Este post foi atualizado. Recarregue a página para ver a versão nova.')
    }
    await tx.insert(respostas).values({ versaoId: atual.id, decisao: e.decisao, comentario, nomeRespondente: nome })
  })
}

export async function postsDoClienteParaVer(
  db: Db,
  clienteId: string,
): Promise<{ pendentes: PostResumo[]; respondidos: PostResumo[] }> {
  const todos = (await listarPosts(db, clienteId)).filter((p) => p.status !== 'rascunho')
  return {
    pendentes: todos.filter((p) => p.status === 'aguardando'),
    respondidos: todos.filter((p) => p.status !== 'aguardando'),
  }
}

export async function postParaCliente(db: Db, clienteId: string, postId: string): Promise<PostDetalhe> {
  const d = await detalhePost(db, postId)
  if (d.post.clienteId !== clienteId || d.post.status === 'rascunho') throw naoEncontrado()
  return d
}
