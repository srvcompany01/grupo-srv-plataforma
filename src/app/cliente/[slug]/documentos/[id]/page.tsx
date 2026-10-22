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
    <main className="mx-auto min-h-screen max-w-4xl p-4 py-8">
      <Link href={base} className="mb-4 inline-flex items-center gap-1 text-rotulo text-texto-3 hover:text-texto"><ChevronLeft className="h-4 w-4" /> Voltar</Link>
      <h1 className="mb-4 text-xl font-bold text-texto">{doc.resumo.titulo}</h1>
      <div className="flex flex-col gap-4 md:flex-row">
        {ordem.length > 1 && (
          <nav className="shrink-0 space-y-0.5 md:w-52" aria-label="Páginas">
            {ordem.map((pg) => (
              <Link key={pg.id} href={`${base}/documentos/${id}?p=${pg.id}`} style={{ paddingLeft: 8 + pg.nivel * 12 }} className={`block truncate rounded-md py-1.5 pr-2 text-rotulo ${pg.id === escolhida.id ? 'bg-hover font-semibold text-texto' : 'text-texto-2 hover:bg-hover'}`}>
                {pg.titulo || 'Sem título'}
              </Link>
            ))}
          </nav>
        )}
        <article className="min-w-0 flex-1 rounded-lg border border-borda bg-white p-6">
          {pagina.titulo && <h2 className="mb-2 text-[1.6rem] font-bold text-texto">{pagina.titulo}</h2>}
          <LeitorDocumento conteudo={yjsParaJson(pagina.ydoc, pagina.conteudo)} />
        </article>
      </div>
    </main>
  )
}
