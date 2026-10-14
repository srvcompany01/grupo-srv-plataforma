import { FileText, Lock, Users } from 'lucide-react'
import Link from 'next/link'
import { EstrelaDocumento } from '@/componentes/documentos/EstrelaDocumento'
import { NovoDocumentoDialog } from '@/componentes/documentos/NovoDocumentoDialog'
import { ABAS_DOCUMENTOS, ROTULO_ABA, ROTULO_VISIBILIDADE, filtrarDocumentos, lerAba, type ResumoDocumento } from '@/dominio/documentos'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { listarClientes } from '@/servicos/clientes-plataforma'
import { listarDocumentos } from '@/servicos/documentos'

const dia = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
const textoParam = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? ''

function IconeAcesso({ d }: { d: ResumoDocumento }) {
  const Icone = d.visibilidade === 'team' ? Users : Lock
  return <span title={ROTULO_VISIBILIDADE[d.visibilidade]}><Icone className="h-3.5 w-3.5 text-texto-3" /></span>
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
    <div className="min-h-full bg-white">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-borda px-4 py-3 md:px-5">
        <h1 className="flex items-center gap-2 text-destaque font-bold text-texto"><FileText className="h-4 w-4" /> Documentos</h1>
        <div className="flex items-center gap-2">
          <form className="flex" action="/documentos">
            {aba !== 'todos' && <input type="hidden" name="aba" value={aba} />}
            <input name="busca" defaultValue={busca} placeholder="Buscar documento, lista ou cliente…" className="h-8 w-64 rounded-lg border border-borda bg-white px-3 text-rotulo outline-none focus:border-marca" />
          </form>
          <NovoDocumentoDialog clientes={clientes.map((c) => ({ id: c.id, nome: c.nome }))} />
        </div>
      </header>
      <nav className="flex gap-0.5 overflow-x-auto border-b border-borda px-4 md:px-5" aria-label="Filtro de documentos">
        {ABAS_DOCUMENTOS.map((a) => (
          <Link key={a} href={href(a)} className={`-mb-px border-b-2 px-2 py-1.5 text-rotulo font-semibold whitespace-nowrap ${a === aba ? 'border-petroleo text-petroleo' : 'border-transparent text-texto-2 hover:text-texto'}`}>
            {ROTULO_ABA[a]}
          </Link>
        ))}
      </nav>
      <main className="p-4 md:p-5">
        {docs.length === 0 ? (
          <p className="py-16 text-center text-corpo text-texto-3">{busca ? 'Nenhum documento encontrado.' : aba === 'favoritos' ? 'Marque um documento com estrela para ele aparecer aqui.' : 'Nenhum documento ainda. Crie o primeiro em "Novo documento".'}</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-borda">
            <table className="w-full min-w-[760px] text-left text-rotulo">
              <thead className="bg-fundo/70 text-legenda font-bold uppercase tracking-rotulo text-texto-3">
                <tr>
                  <th className="w-8 px-2 py-2" />
                  <th className="px-2 py-2">Nome</th>
                  <th className="px-2 py-2">Localização</th>
                  <th className="px-2 py-2">Cliente</th>
                  <th className="px-2 py-2">Dono</th>
                  <th className="px-2 py-2">Atualizado</th>
                  <th className="px-2 py-2">Visto</th>
                  <th className="w-8 px-2 py-2" />
                </tr>
              </thead>
              <tbody>
                {docs.map((d) => (
                  <tr key={d.id} className="border-t border-borda hover:bg-hover">
                    <td className="px-2 py-1.5"><EstrelaDocumento id={d.id} favorito={d.favorito} /></td>
                    <td className="px-2 py-1.5">
                      <Link href={`/documentos/${d.id}`} className="flex items-center gap-2 font-medium text-texto hover:text-marca">
                        <FileText className="h-3.5 w-3.5 shrink-0 text-texto-3" /> <span className="truncate">{d.titulo}</span>
                        {d.wiki && <span className="rounded-full bg-aviso-fundo px-1.5 text-legenda text-aviso-forte">Wiki</span>}
                      </Link>
                    </td>
                    <td className="px-2 py-1.5">
                      <div className="flex flex-wrap gap-1">
                        {d.listas.length === 0 && <span className="text-texto-3">—</span>}
                        {d.listas.map((l) => <Link key={l.id} href={`/listas/${l.id}?visao=documentos`} className="rounded-full bg-fundo px-2 py-0.5 text-legenda ring-1 ring-borda hover:text-marca">{l.nome}</Link>)}
                      </div>
                    </td>
                    <td className="px-2 py-1.5 text-texto-2">{d.clienteNome ?? '—'}{d.clienteVisivel && <span className="ml-1 text-legenda text-marca" title="O cliente vê este documento">· visível</span>}</td>
                    <td className="px-2 py-1.5 text-texto-2">{d.donoNome}</td>
                    <td className="px-2 py-1.5 text-texto-2">{dia.format(new Date(d.atualizadoEm))}</td>
                    <td className="px-2 py-1.5 text-texto-2">{d.visualizadoEm ? dia.format(new Date(d.visualizadoEm)) : '—'}</td>
                    <td className="px-2 py-1.5"><IconeAcesso d={d} /></td>
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
