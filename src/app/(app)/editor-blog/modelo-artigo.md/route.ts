import { modeloMarkdown } from '@/dominio/blog-modelo'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { autores, categorias } from '@/servicos/blog'

/** Modelo do artigo em Markdown (bom para pedir a outra IA preencher). */
export async function GET() {
  await exigirEquipe()
  const [cats, auts] = await Promise.all([categorias(), autores(await criarClienteServidor())])
  return new Response(modeloMarkdown(cats.map((c) => c.nome), auts.map((a) => a.nome)), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8', 'Content-Disposition': 'attachment; filename="modelo-artigo-blog-grupo-srv.md"' },
  })
}
