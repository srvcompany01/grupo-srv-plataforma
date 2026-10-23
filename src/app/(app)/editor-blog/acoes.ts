'use server'

import { revalidatePath } from 'next/cache'
import { after } from 'next/server'
import { SITE, bloqueiosDePublicacao, limparBriefing, type Briefing } from '@/dominio/blog'
import { camposDoArquivo, docxParaTexto, lerArquivoDeArtigo } from '@/dominio/blog-modelo'
import { validarCapa } from '@/dominio/clientes-galeria'
import { mensagemErro } from '@/dominio/erros-banco'
import { gerarChaveBlog, urlUpload } from '@/infra/r2'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { tentar, type Resultado } from '@/servicos/acao'
import * as blog from '@/servicos/blog'
import { gerarRascunho, type Rascunho } from '@/servicos/blog-ia'
import { avisarIndexNow, validarPublicado, type Verificacao } from '@/servicos/blog-validacao'

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

/**
 * `quando`: ISO (agora ou no futuro = agendado) para publicar; 'revisao' manda para a revisão humana; null volta para
 * rascunho. Publicar exige revisão humana aprovada e nada que bloqueie no checklist (H1 extra, marcadores esquecidos).
 */
export async function publicacaoAcao(id: string, quando: string | 'revisao' | null): Promise<Resultado> {
  await exigirEquipe()
  if (!UUID.test(id)) return { erro: 'Artigo inválido.' }
  if (quando && quando !== 'revisao' && Number.isNaN(Date.parse(quando))) return { erro: 'Data inválida.' }
  const sb = await criarClienteServidor()
  const post = await blog.postDaEquipe(sb, id)
  if (!post) return { erro: 'Artigo não encontrado.' }
  if (quando && !post.conteudo.trim()) return { erro: 'Escreva o artigo antes de publicar.' }
  if (quando && quando !== 'revisao') {
    const bloqueios = bloqueiosDePublicacao(await blog.qualidadeDoPost(sb, post))
    if (bloqueios.length) return { erro: `Ainda não dá para publicar: ${bloqueios.join('; ')}.` }
  }
  const agendado = quando && quando !== 'revisao' && Date.parse(quando) > Date.now() + 60_000
  const r = await tentar(() => blog.definirPublicacao(sb, id, quando), !quando ? 'Voltou para rascunho (saiu do ar).' : quando === 'revisao' ? 'Enviado para revisão.' : agendado ? 'Agendado.' : 'Publicado!')
  atualizarBlog(post.slug)
  if (r?.ok && quando && quando !== 'revisao' && !agendado && post.indexar) after(() => avisarIndexNow([post.canonical || `${SITE}/blog/${post.slug}`]))
  return r
}

/** Revisão humana: aprovar (fica registrado quem e quando) ou desfazer. */
export async function revisaoAcao(id: string, aprovado: boolean): Promise<Resultado> {
  const eu = await exigirEquipe()
  if (!UUID.test(id)) return { erro: 'Artigo inválido.' }
  const r = await tentar(async () => blog.definirRevisao(await criarClienteServidor(), id, eu.id, aprovado), aprovado ? 'Revisão aprovada.' : 'Aprovação desfeita.')
  revalidatePath(`/editor-blog/${id}`)
  return r
}

/** Confere o artigo no ar como o Google vê (status, robots, canonical, schema, imagem, sitemap, links). */
export async function validarAcao(id: string): Promise<Verificacao[] | { erro: string }> {
  await exigirEquipe()
  if (!UUID.test(id)) return { erro: 'Artigo inválido.' }
  const post = await blog.postDaEquipe(await criarClienteServidor(), id)
  if (!post) return { erro: 'Artigo não encontrado.' }
  if (post.status !== 'publicado' || !post.publicadoEmBruto || Date.parse(post.publicadoEmBruto) > Date.now()) return { erro: 'A validação é feita no artigo publicado (no ar).' }
  return validarPublicado(post.slug, post.canonical || `${SITE}/blog/${post.slug}`, post.indexar)
}

export async function salvarContextoAcao(c: blog.ContextoMarca): Promise<Resultado> {
  await exigirEquipe()
  const r = await tentar(async () => blog.salvarContextoMarca(await criarClienteServidor(), c), 'Contexto da marca salvo.')
  revalidatePath('/blog', 'layout')
  revalidatePath('/robots.txt')
  revalidatePath('/editor-blog')
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

export async function gerarRascunhoAcao(p: { tema: string; palavraChave: string; categoriaId: string | null; publico: string; secundarias: string[]; briefing: Briefing }): Promise<Rascunho | { erro: string }> {
  await exigirEquipe()
  if (!p.tema.trim() || !p.palavraChave.trim()) return { erro: 'Informe o tema e a palavra-chave.' }
  try {
    const [cats, posts, marca] = await Promise.all([blog.categorias(), blog.publicados({ limite: 30 }), blog.contextoMarca().catch(() => ({}))])
    const categoria = cats.find((c) => c.id === p.categoriaId)?.nome ?? 'Marketing e vendas'
    return await gerarRascunho({
      tema: p.tema.slice(0, 300), palavraChave: p.palavraChave.slice(0, 80), categoria, publico: p.publico.slice(0, 200), secundarias: p.secundarias.slice(0, 15).map((k) => String(k).slice(0, 80)),
      briefing: limparBriefing(p.briefing), marca, outros: posts.posts.map((x) => ({ titulo: x.titulo, slug: x.slug })),
    })
  } catch (e) {
    return { erro: e instanceof Error ? e.message : 'A IA não conseguiu gerar agora.' }
  }
}

export async function salvarAutorAcao(id: string | null, a: { nome: string; cargo: string; bio: string; links?: string[]; fotoChave?: string | null }): Promise<Resultado> {
  await exigirEquipe()
  if (id && !UUID.test(id)) return { erro: 'Autor inválido.' }
  const r = await tentar(async () => blog.salvarAutor(await criarClienteServidor(), id, a), 'Autor salvo.')
  atualizarBlog()
  return r
}

const LIMITE_ARQUIVO = 3 * 1024 * 1024

/**
 * Cria um artigo (rascunho) a partir do arquivo do modelo preenchido: Word (.docx), Markdown (.md) ou texto (.txt).
 * Devolve o id e o que vale conferir (campos não reconhecidos e o que ainda bloqueia a publicação).
 */
export async function importarArquivoAcao(form: FormData): Promise<{ id: string; avisos: string[]; pendencias: string[]; nota: number } | { erro: string }> {
  await exigirEquipe()
  const arquivo = form.get('arquivo')
  if (!(arquivo instanceof File) || !arquivo.size) return { erro: 'Escolha o arquivo do artigo.' }
  if (arquivo.size > LIMITE_ARQUIVO) return { erro: 'O arquivo passa de 3 MB.' }
  const nome = arquivo.name.toLowerCase()
  let texto: string
  try {
    if (nome.endsWith('.docx')) texto = docxParaTexto(new Uint8Array(await arquivo.arrayBuffer()))
    else if (/\.(md|markdown|txt)$/.test(nome)) texto = await arquivo.text()
    else return { erro: 'Use o modelo em Word (.docx), Markdown (.md) ou texto (.txt). No Google Docs: Arquivo → Fazer download → .docx.' }
  } catch (e) {
    console.error(e)
    return { erro: 'Não consegui ler o arquivo. Confira se é o modelo do blog salvo em .docx, .md ou .txt.' }
  }
  const lido = lerArquivoDeArtigo(texto)
  if (!lido.titulo) return { erro: 'Não encontrei o título. Preencha "Título:" na ficha do modelo.' }
  if (!lido.artigo.trim()) return { erro: `Não encontrei o texto do artigo. Escreva-o depois da linha "=== ARTIGO ===".` }
  try {
    const sb = await criarClienteServidor()
    const [cats, auts] = await Promise.all([blog.categorias(), blog.autores(sb)])
    const { campos, avisos } = camposDoArquivo(lido, cats, auts)
    const id = await blog.salvarPost(sb, null, campos)
    const post = await blog.postDaEquipe(sb, id)
    const q = post ? await blog.qualidadeDoPost(sb, post) : null
    atualizarBlog()
    return { id, avisos, pendencias: q ? q.itens.filter((i) => !i.ok && !i.texto.startsWith('Revisão humana')).map((i) => i.texto) : [], nota: q?.nota ?? 0 }
  } catch (e) {
    console.error(e)
    return { erro: erroDoSlug(e) }
  }
}
