import { FileText, Lock, Users } from 'lucide-react'
import Link from 'next/link'
import { ROTULO_VISIBILIDADE, type ResumoDocumento } from '@/dominio/documentos'
import { DesvincularDocumento, VincularExistente } from './VincularExistente'
import { NovoDocumentoDialog } from './NovoDocumentoDialog'
import { NomeCliente } from '@/componentes/NomeCliente'

const dia = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })

/** Visualização "Documentos" de uma lista: os documentos ligados a ela (criados aqui ou vinculados). */
export function VisaoDocumentos({ listaId, docs, candidatos, clientes, clienteDaLista }: { listaId: string; docs: ResumoDocumento[]; candidatos: { id: string; titulo: string; donoNome: string }[]; clientes: { id: string; nome: string }[]; clienteDaLista: string | null }) {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-rotulo text-texto-3">{docs.length} {docs.length === 1 ? 'documento' : 'documentos'} nesta lista · todos aparecem também na aba Documentos</p>
        <div className="flex items-center gap-2">
          <VincularExistente listaId={listaId} candidatos={candidatos} />
          <NovoDocumentoDialog listaId={listaId} clientes={clientes} clienteInicial={clienteDaLista} />
        </div>
      </div>
      {docs.length === 0 ? (
        <p className="rounded-lg border border-dashed border-borda py-14 text-center text-corpo text-texto-3">Nenhum documento nesta lista. Crie um novo ou vincule um que já existe.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {docs.map((d) => {
            const Icone = d.visibilidade === 'team' ? Users : Lock
            return (
              <div key={d.id} className="group relative rounded-lg border border-borda bg-white p-3 transition hover:border-marca-clara hover:shadow-sm">
                <Link href={`/documentos/${d.id}`} className="flex items-start gap-2">
                  <FileText className="mt-0.5 h-4 w-4 shrink-0 text-texto-3" />
                  <span className="min-w-0">
                    <span className="block truncate text-corpo font-semibold text-texto group-hover:text-marca">{d.titulo}</span>
                    <span className="block text-legenda text-texto-3">{d.donoNome} · atualizado {dia.format(new Date(d.atualizadoEm))}</span>
                  </span>
                </Link>
                <div className="mt-2 flex items-center gap-2 text-legenda text-texto-3">
                  <span className="inline-flex items-center gap-1" title={ROTULO_VISIBILIDADE[d.visibilidade]}><Icone className="h-3 w-3" /> {ROTULO_VISIBILIDADE[d.visibilidade]}</span>
                  {d.clienteNome && <span>· <NomeCliente nome={d.clienteNome} />{d.clienteVisivel ? ' (vê)' : ''}</span>}
                  <span className="ml-auto"><DesvincularDocumento listaId={listaId} documentoId={d.id} /></span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
