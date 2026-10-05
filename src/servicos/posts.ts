import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm'
import type { Db } from '@/db/conexao'
import {
  clientes,
  midias,
  posts,
  respostas,
  versoes,
  type Cliente,
  type Midia,
  type Post,
  type Resposta,
  type Versao,
} from '@/db/schema'
import { ErroRegra } from '@/dominio/erros'
import { exigirUuid } from '@/dominio/ids'
import { validarConjunto } from '@/dominio/midias'
import { edicaoCriaNovaVersao, podeEnviar, statusAposEdicao } from '@/dominio/status'
import type { CamposPost, Formato, MidiaEntrada, Status } from '@/dominio/tipos'

export type Tx = Parameters<Parameters<Db['transaction']>[0]>[0]

export interface PostResumo {
  id: string
  formato: Formato
  dataPrevista: string
  status: Status
  versaoAtual: number
  ideia: string
}

export type VersaoComMidias = Versao & { midias: Midia[] }

export interface PostDetalhe {
  post: Post
  cliente: Cliente
  /** Da mais nova para a mais antiga. */
  versoes: Array<VersaoComMidias & { resposta: Resposta | null }>
}

export function prefixoChave(postId: string): string {
  return `posts/${postId}/`
}

function validarChaves(postId: string, lista: MidiaEntrada[]) {
  const prefixo = prefixoChave(postId)
  for (const m of lista) {
    const resto = m.chave.slice(prefixo.length)
    if (!m.chave.startsWith(prefixo) || !/^[A-Za-z0-9._-]+$/.test(resto) || resto.includes('..')) {
      throw new ErroRegra('chave_invalida', 'Mídia inválida para este post.')
    }
  }
}

export async function versaoAtual(tx: Tx | Db, postId: string): Promise<Versao> {
  const [v] = await tx.select().from(versoes).where(eq(versoes.postId, postId)).orderBy(desc(versoes.numero)).limit(1)
  return v
}

async function lerPost(tx: Tx | Db, postId: string): Promise<Post> {
  exigirUuid(postId)
  const [p] = await tx.select().from(posts).where(eq(posts.id, postId))
  if (!p) throw new ErroRegra('nao_encontrado', 'Post não encontrado.')
  return p
}

/**
 * Lê com trava de linha: se o cliente responder durante a edição, a resposta
 * espera, ou a edição vê o status novo e cria outra versão em vez de alterar
 * a versão que acabou de ser aprovada.
 */
async function lerPostParaAlterar(tx: Tx, postId: string): Promise<Post> {
  exigirUuid(postId)
  const [p] = await tx.select().from(posts).where(eq(posts.id, postId)).for('update')
  if (!p) throw new ErroRegra('nao_encontrado', 'Post não encontrado.')
  return p
}

async function inserirMidias(tx: Tx, versaoId: string, lista: MidiaEntrada[]) {
  if (lista.length === 0) return
  await tx.insert(midias).values(
    lista.map((m, ordem) => ({
      versaoId,
      ordem,
      tipo: m.tipo,
      chaveR2: m.chave,
      nomeOriginal: m.nomeOriginal,
      tamanhoBytes: m.tamanhoBytes,
    })),
  )
}

export async function criarPost(db: Db, clienteId: string, formato: Formato, dataPrevista: string): Promise<string> {
  return db.transaction(async (tx) => {
    const [p] = await tx.insert(posts).values({ clienteId, formato, dataPrevista }).returning({ id: posts.id })
    await tx.insert(versoes).values({ postId: p.id, numero: 1 })
    return p.id
  })
}

export async function salvarEdicao(db: Db, postId: string, campos: CamposPost, lista: MidiaEntrada[]): Promise<void> {
  validarChaves(postId, lista)
  await db.transaction(async (tx) => {
    const post = await lerPostParaAlterar(tx, postId)
    if (post.status !== 'rascunho' || lista.length > 0) validarConjunto(lista)

    const textos = { ideia: campos.ideia, objetivo: campos.objetivo, legenda: campos.legenda }
    const atual = await versaoAtual(tx, postId)
    if (edicaoCriaNovaVersao(post.status)) {
      const [nova] = await tx
        .insert(versoes)
        .values({ postId, numero: atual.numero + 1, ...textos })
        .returning({ id: versoes.id })
      await inserirMidias(tx, nova.id, lista)
    } else {
      await tx.update(versoes).set(textos).where(eq(versoes.id, atual.id))
      await tx.delete(midias).where(eq(midias.versaoId, atual.id))
      await inserirMidias(tx, atual.id, lista)
    }

    await tx
      .update(posts)
      .set({
        status: statusAposEdicao(post.status),
        formato: campos.formato,
        dataPrevista: campos.dataPrevista,
        atualizadoEm: new Date(),
      })
      .where(eq(posts.id, postId))
  })
}

export async function enviarParaAprovacao(db: Db, postId: string): Promise<void> {
  await db.transaction(async (tx) => {
    const post = await lerPostParaAlterar(tx, postId)
    if (!podeEnviar(post.status)) throw new ErroRegra('status_invalido', 'Este post já foi enviado.')
    const atual = await versaoAtual(tx, postId)
    const lista = await tx.select().from(midias).where(eq(midias.versaoId, atual.id))
    validarConjunto(lista.map((m) => ({ chave: m.chaveR2, tipo: m.tipo, nomeOriginal: m.nomeOriginal, tamanhoBytes: m.tamanhoBytes })))
    await tx.update(posts).set({ status: 'aguardando', atualizadoEm: new Date() }).where(eq(posts.id, postId))
  })
}

export async function listarPosts(db: Db, clienteId: string, filtro?: Status): Promise<PostResumo[]> {
  return db
    .select({
      id: posts.id,
      formato: posts.formato,
      dataPrevista: posts.dataPrevista,
      status: posts.status,
      versaoAtual: versoes.numero,
      ideia: versoes.ideia,
    })
    .from(posts)
    .innerJoin(
      versoes,
      and(
        eq(versoes.postId, posts.id),
        sql`${versoes.numero} = (select max(v2.numero) from versoes v2 where v2.post_id = ${posts.id})`,
      ),
    )
    .where(filtro ? and(eq(posts.clienteId, clienteId), eq(posts.status, filtro)) : eq(posts.clienteId, clienteId))
    .orderBy(asc(posts.dataPrevista), asc(posts.criadoEm))
}

export async function detalhePost(db: Db, postId: string): Promise<PostDetalhe> {
  const post = await lerPost(db, postId)
  const [cliente] = await db.select().from(clientes).where(eq(clientes.id, post.clienteId))
  const lista = await db.select().from(versoes).where(eq(versoes.postId, postId)).orderBy(desc(versoes.numero))
  const ids = lista.map((v) => v.id)
  const todasMidias = await db.select().from(midias).where(inArray(midias.versaoId, ids)).orderBy(asc(midias.ordem))
  const todasRespostas = await db.select().from(respostas).where(inArray(respostas.versaoId, ids))
  return {
    post,
    cliente,
    versoes: lista.map((v) => ({
      ...v,
      midias: todasMidias.filter((m) => m.versaoId === v.id),
      resposta: todasRespostas.find((r) => r.versaoId === v.id) ?? null,
    })),
  }
}
