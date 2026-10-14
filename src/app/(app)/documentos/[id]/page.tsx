import { notFound } from 'next/navigation'
import { ArvorePaginas } from '@/componentes/documentos/ArvorePaginas'
import { CabecalhoDocumento } from '@/componentes/documentos/CabecalhoDocumento'
import { EditorPagina } from '@/componentes/documentos/EditorPagina'
import { TituloPagina } from '@/componentes/documentos/TituloPagina'
import { arvoreDePaginas } from '@/dominio/documentos'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { listarClientes } from '@/servicos/clientes-plataforma'
import { buscarDocumento, registrarVisualizacao } from '@/servicos/documentos'
import { paginaComEstado } from '@/servicos/documentos-yjs'
import { listarListasVisiveis } from '@/servicos/listas'
import { listarEquipe } from '@/servicos/usuarios'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function RotaDocumento({ params, searchParams }: PageProps<'/documentos/[id]'>) {
  const { id } = await params
  const { p } = await searchParams
  const eu = await exigirEquipe()
  if (!UUID.test(id)) notFound()
  const sb = await criarClienteServidor()
  const doc = await buscarDocumento(sb, id)
  if (!doc) notFound()

  const ordem = arvoreDePaginas(doc.paginas)
  const escolhida = ordem.find((pg) => pg.id === (Array.isArray(p) ? p[0] : p)) ?? ordem[0]
  if (!escolhida) notFound()

  const [pagina, podeEditarR, podeGerirR, equipe, clientes, listas] = await Promise.all([
    paginaComEstado(sb, escolhida.id),
    sb.rpc('can_edit_document', { doc: id }),
    sb.rpc('can_manage_document', { doc: id }),
    listarEquipe(sb),
    listarClientes(sb),
    listarListasVisiveis(sb),
    registrarVisualizacao(sb, eu.id, id),
  ])
  if (!pagina) notFound()
  const podeEditar = podeEditarR.data === true
  const podeGerir = podeGerirR.data === true

  return (
    <div className="flex h-[calc(100vh-var(--altura-topo,0px))] min-h-[32rem] flex-col bg-white">
      <CabecalhoDocumento
        documento={doc.resumo}
        pessoas={doc.pessoas}
        equipe={equipe.map((e) => ({ id: e.id, nome: e.nome }))}
        clientes={clientes.map((c) => ({ id: c.id, nome: c.nome }))}
        listas={listas.map((l) => ({ id: l.id, nome: l.nome, espacoNome: l.espacoNome }))}
        euId={eu.id}
        podeEditar={podeEditar}
        podeGerir={podeGerir}
      />
      <div className="flex min-h-0 flex-1">
        <ArvorePaginas documentoId={id} paginas={doc.paginas} atualId={pagina.id} podeEditar={podeEditar} />
        <div className="flex min-w-0 flex-1 flex-col">
          <TituloPagina key={pagina.id} id={pagina.id} inicial={pagina.titulo} podeEditar={podeEditar} />
          <EditorPagina
            key={pagina.id}
            pagina={{ id: pagina.id, titulo: pagina.titulo, conteudo: pagina.conteudo, ydoc: pagina.ydoc, baseUpdate: pagina.baseUpdate, alteracoes: pagina.alteracoes }}
            podeEditar={podeEditar}
            eu={{ id: eu.id, nome: eu.nome }}
            equipe={equipe}
            documentoTitulo={doc.resumo.titulo}
          />
        </div>
      </div>
    </div>
  )
}
