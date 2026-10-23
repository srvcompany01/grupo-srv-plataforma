'use server'

import { revalidatePath } from 'next/cache'
import { validarCapa } from '@/dominio/clientes-galeria'
import { mensagemErro } from '@/dominio/erros-banco'
import { gerarChaveBlog, urlUpload } from '@/infra/r2'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { tentar, type Resultado } from '@/servicos/acao'
import * as blog from '@/servicos/blog'
import { gerarRascunho, type Rascunho } from '@/servicos/blog-ia'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Some do cache o que mudou no blog público (início, artigo, categorias, mapa do site). */
function atualizarBlog(slug?: string) {
  revalidatePath('/blog', 'layout')
  if (slug) revalidatePath(`/blog/${slug}`)
  revalidatePath('/sitemap.xml')
  revalidatePath('/editor-blog', 'layout')
}

const erroDoSlug = (e: unknown) => ((e as { code?: string })?.code === '23505' ? 'Já existe um artigo com esse endereço (slug). Mude o slug.' : mensagemErro(e))

export async function salvarPostAcao(id: string | null, c: blog.CamposPost): Promise<{ id: string } | { erro: string }> {
  await exigirEquipe()
  if (id && !UUID.test(id)) return { erro: 'Artigo inválido.' }
  if (c.categoriaId && !UUID.test(c.categoriaId)) return { erro: 'Categoria inválida.' }
  if (c.autorId && !UUID.test(c.autorId)) return { erro: 'Autor inválido.' }
  if (c.capaChave && !/^blog\/[0-9a-f-]{36}\.(jpg|png|webp)$/.test(c.capaChave)) return { erro: 'Imagem inválida.' }
  try {
    const novo = await blog.salvarPost(await criarClienteServidor(), id, c)
    atualizarBlog(c.slug)
    return { id: novo }
  } catch (e) {
    console.error(e)
    return { erro: erroDoSlug(e) }
  }
}

/** `quando`: ISO (agora ou no futuro = agendado) para publicar; null volta para rascunho. */
export async function publicacaoAcao(id: string, quando: string | null): Promise<Resultado> {
  await exigirEquipe()
  if (!UUID.test(id)) return { erro: 'Artigo inválido.' }
  if (quando && Number.isNaN(Date.parse(quando))) return { erro: 'Data inválida.' }
  const sb = await criarClienteServidor()
  const post = await blog.postDaEquipe(sb, id)
  if (!post) return { erro: 'Artigo não encontrado.' }
  if (quando && !post.conteudo.trim()) return { erro: 'Escreva o artigo antes de publicar.' }
  const r = await tentar(() => blog.definirPublicacao(sb, id, quando), !quando ? 'Voltou para rascunho (saiu do ar).' : Date.parse(quando) > Date.now() + 60_000 ? 'Agendado.' : 'Publicado!')
  atualizarBlog(post.slug)
  return r
}

export async function enviarImagemAcao(mime: string, tamanho: number): Promise<{ chave: string; url: string } | { erro: string }> {
  await exigirEquipe()
  const invalida = validarCapa({ mime, tamanho })
  if (invalida) return { erro: invalida }
  try {
    const chave = gerarChaveBlog(mime)
    return { chave, url: await urlUpload(chave, mime, tamanho) }
  } catch (e) {
    console.error(e)
    return { erro: 'Não foi possível preparar o envio da imagem.' }
  }
}

export async function gerarRascunhoAcao(p: { tema: string; palavraChave: string; categoriaId: string | null; publico: string }): Promise<Rascunho | { erro: string }> {
  await exigirEquipe()
  if (!p.tema.trim() || !p.palavraChave.trim()) return { erro: 'Informe o tema e a palavra-chave.' }
  try {
    const [cats, posts] = await Promise.all([blog.categorias(), blog.publicados({ limite: 30 })])
    const categoria = cats.find((c) => c.id === p.categoriaId)?.nome ?? 'Marketing e vendas'
    return await gerarRascunho({ tema: p.tema.slice(0, 300), palavraChave: p.palavraChave.slice(0, 80), categoria, publico: p.publico.slice(0, 200), outros: posts.posts.map((x) => ({ titulo: x.titulo, slug: x.slug })) })
  } catch (e) {
    return { erro: e instanceof Error ? e.message : 'A IA não conseguiu gerar agora.' }
  }
}

export async function salvarAutorAcao(id: string | null, a: { nome: string; cargo: string; bio: string; fotoChave?: string | null }): Promise<Resultado> {
  await exigirEquipe()
  if (id && !UUID.test(id)) return { erro: 'Autor inválido.' }
  const r = await tentar(async () => blog.salvarAutor(await criarClienteServidor(), id, a), 'Autor salvo.')
  atualizarBlog()
  return r
}
