import { FileText, Lock, Users } from 'lucide-react'
import Link from 'next/link'
import { EstrelaDocumento } from '@/componentes/documentos/EstrelaDocumento'
import { NovoDocumentoDialog } from '@/componentes/documentos/NovoDocumentoDialog'
import { ABAS_DOCUMENTOS, ROTULO_ABA, ROTULO_VISIBILIDADE, filtrarDocumentos, lerAba, type ResumoDocumento } from '@/dominio/documentos'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { listarClientes } from '@/servicos/clientes-plataforma'
import { listarDocumentos } from '@/servicos/documentos'
import { NomeCliente } from '@/componentes/NomeCliente'

const dia = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
const textoParam = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? ''

function IconeAcesso({ d }: { d: ResumoDocumento }) {
  const Icone = d.visibilidade === 'team' ? Users : Lock
  return <span title={ROTULO_VISIBILIDADE[d.visibilidade]}><Icone /></span>
}

export default async function PaginaDocumentos({ searchParams }: PageProps<'/documentos'>) {
  const sp = await searchParams
  const eu = await exigirEquipe()
  const aba = lerAba(textoParam(sp.aba))
  const busca = textoParam(sp.busca).slice(0, 100)
  const sb = await criarClienteServidor()
  const [todos, clientes] = await Promise.all([listarDocumentos(sb), listarClientes(sb)])
  const docs = filtrarDocumentos(todos, aba, eu.id, busca)
  const href = (a: string) => (a === 'todos' ? '/documentos' : `/documentos?aba=${a}`) + (busca && a === aba ? `${a === 'todos' ? '?' : '&'}busca=${encodeURIComponent(busca)}` : '')

  return (
    <div>
      <header>
        <h1><FileText /> Documentos</h1>
        <div>
          <form action="/documentos">
            {aba !== 'todos' && <input type="hidden" name="aba" value={aba} />}
            <input name="busca" defaultValue={busca} placeholder="Buscar documento, lista ou cliente…" />
          </form>
          <NovoDocumentoDialog clientes={clientes.map((c) => ({ id: c.id, nome: c.nome }))} />
        </div>
      </header>
      <nav aria-label="Filtro de documentos">
        {ABAS_DOCUMENTOS.map((a) => (
          <Link key={a} href={href(a)}>
            {ROTULO_ABA[a]}
          </Link>
        ))}
      </nav>
      <main>
        {docs.length === 0 ? (
          <p>{busca ? 'Nenhum documento encontrado.' : aba === 'favoritos' ? 'Marque um documento com estrela para ele aparecer aqui.' : 'Nenhum documento ainda. Crie o primeiro em "Novo documento".'}</p>
        ) : (
          <div>
            <table>
              <thead>
                <tr>
                  <th />
                  <th>Nome</th>
                  <th>Localização</th>
                  <th>Cliente</th>
                  <th>Dono</th>
                  <th>Atualizado</th>
                  <th>Visto</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {docs.map((d) => (
                  <tr key={d.id}>
                    <td><EstrelaDocumento id={d.id} favorito={d.favorito} /></td>
                    <td>
                      <Link href={`/documentos/${d.id}`}>
                        <FileText /> <span>{d.titulo}</span>
                        {d.wiki && <span>Wiki</span>}
                      </Link>
                    </td>
                    <td>
                      <div>
                        {d.listas.length === 0 && <span>—</span>}
                        {d.listas.map((l) => <Link key={l.id} href={`/listas/${l.id}?visao=documentos`}>{l.nome}</Link>)}
                      </div>
                    </td>
                    <td>{d.clienteNome ? <NomeCliente nome={d.clienteNome} /> : '—'}{d.clienteVisivel && <span title="O cliente vê este documento">· visível</span>}</td>
                    <td>{d.donoNome}</td>
                    <td>{dia.format(new Date(d.atualizadoEm))}</td>
                    <td>{d.visualizadoEm ? dia.format(new Date(d.visualizadoEm)) : '—'}</td>
                    <td><IconeAcesso d={d} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
