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
    <section>
      <div>
        <p>{docs.length} {docs.length === 1 ? 'documento' : 'documentos'} nesta lista · todos aparecem também na aba Documentos</p>
        <div>
          <VincularExistente listaId={listaId} candidatos={candidatos} />
          <NovoDocumentoDialog listaId={listaId} clientes={clientes} clienteInicial={clienteDaLista} />
        </div>
      </div>
      {docs.length === 0 ? (
        <p>Nenhum documento nesta lista. Crie um novo ou vincule um que já existe.</p>
      ) : (
        <div>
          {docs.map((d) => {
            const Icone = d.visibilidade === 'team' ? Users : Lock
            return (
              <div key={d.id}>
                <Link href={`/documentos/${d.id}`}>
                  <FileText />
                  <span>
                    <span>{d.titulo}</span>
                    <span>{d.donoNome} · atualizado {dia.format(new Date(d.atualizadoEm))}</span>
                  </span>
                </Link>
                <div>
                  <span title={ROTULO_VISIBILIDADE[d.visibilidade]}><Icone /> {ROTULO_VISIBILIDADE[d.visibilidade]}</span>
                  {d.clienteNome && <span>· <NomeCliente nome={d.clienteNome} />{d.clienteVisivel ? ' (vê)' : ''}</span>}
                  <span><DesvincularDocumento listaId={listaId} documentoId={d.id} /></span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
