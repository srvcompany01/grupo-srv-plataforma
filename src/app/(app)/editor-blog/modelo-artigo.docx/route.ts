import { modeloDocx } from '@/dominio/blog-modelo'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { autores, categorias } from '@/servicos/blog'

/** Modelo do artigo em Word, com as categorias e autores atuais. Preencha e importe em Blog → Importar arquivo. */
export async function GET() {
  await exigirEquipe()
  const [cats, auts] = await Promise.all([categorias(), autores(await criarClienteServidor())])
  return new Response(new Blob([modeloDocx(cats.map((c) => c.nome), auts.map((a) => a.nome)) as BlobPart]), {
    headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'Content-Disposition': 'attachment; filename="modelo-artigo-blog-grupo-srv.docx"' },
  })
}
