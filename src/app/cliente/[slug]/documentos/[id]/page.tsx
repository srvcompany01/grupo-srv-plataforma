import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { LeitorDocumento } from '@/componentes/documentos/LeitorDocumento'
import { arvoreDePaginas } from '@/dominio/documentos'
import { criarClienteAdmin } from '@/infra/supabase/admin'
import { buscarDocumento, buscarPagina } from '@/servicos/documentos'
import { yjsParaJson } from '@/servicos/documentos-yjs'
import { clientePorLink, documentoLiberado } from '@/servicos/portal-conteudo'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Documento liberado ao cliente, só leitura, pelo link (confere que é deste cliente antes de ler). */
export default async function DocumentoDoCliente({ params, searchParams }: PageProps<'/cliente/[slug]/documentos/[id]'>) {
  const { slug, id } = await params
  const { p } = await searchParams
  if (!UUID.test(id)) notFound()
  const cliente = await clientePorLink(slug)
  if (!cliente || !(await documentoLiberado(cliente.id, id))) notFound()
  const admin = criarClienteAdmin()
  const doc = await buscarDocumento(admin, id)
  if (!doc) notFound()
  const ordem = arvoreDePaginas(doc.paginas)
  const escolhida = ordem.find((pg) => pg.id === (Array.isArray(p) ? p[0] : p)) ?? ordem[0]
  if (!escolhida) notFound()
  const pagina = await buscarPagina(admin, escolhida.id, false)
  if (!pagina) notFound()
  const base = `/cliente/${cliente.slug}`

  return (
    <main>
      <Link href={base}><ChevronLeft /> Voltar</Link>
      <h1>{doc.resumo.titulo}</h1>
      <div>
        {ordem.length > 1 && (
          <nav aria-label="Páginas">
            {ordem.map((pg) => (
              <Link key={pg.id} href={`${base}/documentos/${id}?p=${pg.id}`} style={{ paddingLeft: 8 + pg.nivel * 12 }}>
                {pg.titulo || 'Sem título'}
              </Link>
            ))}
          </nav>
        )}
        <article>
          {pagina.titulo && <h2>{pagina.titulo}</h2>}
          <LeitorDocumento conteudo={yjsParaJson(pagina.ydoc, pagina.conteudo)} />
        </article>
      </div>
    </main>
  )
}
