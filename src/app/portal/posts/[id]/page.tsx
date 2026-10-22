import { CalendarClock, ChevronLeft, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PreviaPost } from '@/componentes/portal/PreviaPost'
import { RespostaPost } from '@/componentes/portal/RespostaPost'
import { ROTULO_ALVO, situacaoPublicacao } from '@/dominio/publicacao'
import { exigirCliente } from '@/infra/supabase/sessao'
import { clienteDoUsuario, postDoCliente } from '@/servicos/portal-conteudo'

// Aprovar pode publicar na hora (quando o horário já passou).
export const maxDuration = 300

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const quando = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'America/Belem' })

/** Post para o cliente ver como vai ficar, com o dia e a hora, e aprovar ou pedir ajuste. */
export default async function PostDoPortal({ params }: PageProps<'/portal/posts/[id]'>) {
  const { id } = await params
  const eu = await exigirCliente()
  if (!UUID.test(id)) notFound()
  const cliente = await clienteDoUsuario(eu.id)
  if (!cliente) notFound()
  const post = await postDoCliente(cliente.id, id)
  if (!post) notFound()
  const dataHora = post.publicarEm ? quando.format(new Date(post.publicarEm)) : null
  const situacao = situacaoPublicacao({ status: post.status, em: post.publicarEm, modo: post.modo, aprovacao: post.aprovacao }, new Date())

  return (
    <main className="mx-auto min-h-screen max-w-4xl space-y-5 p-4 py-8">
      <Link href="/portal" className="inline-flex items-center gap-1 text-rotulo text-texto-3 hover:text-texto"><ChevronLeft className="h-4 w-4" /> Voltar</Link>
      <div className="grid items-start gap-6 md:grid-cols-[minmax(0,420px)_1fr]">
        <PreviaPost nome={cliente.nome} formato={post.formato} midias={post.midias} legenda={post.legenda} />
        <section className="space-y-4">
          <div>
            <p className="text-legenda font-semibold uppercase tracking-wide text-texto-3">Post · versão {post.versao}</p>
            <h1 className="text-xl font-bold text-texto">{post.titulo}</h1>
          </div>
          <div className="space-y-1 rounded-xl border border-borda bg-white p-4">
            <p className="flex items-center gap-2 text-rotulo font-semibold text-texto"><CalendarClock className="h-4 w-4" /> Quando vai ao ar</p>
            <p className="text-corpo capitalize text-texto">{dataHora ?? 'Data a combinar'}</p>
            {post.alvos.length > 0 && <p className="text-legenda text-texto-3">Em {post.alvos.map((a) => ROTULO_ALVO[a]).join(' e ')} · {situacao}</p>}
          </div>
          {post.aprovacao === 'aguardando' ? (
            <div className="space-y-2 rounded-xl border border-aviso-fundo bg-aviso-fundo/40 p-4">
              <p className="text-rotulo font-semibold text-aviso-forte">Este post espera a sua aprovação</p>
              <RespostaPost tarefaId={post.id} quando={dataHora} />
            </div>
          ) : (
            <div className={`rounded-xl border p-4 text-rotulo ${post.aprovacao === 'aprovado' ? 'border-sucesso-fundo bg-sucesso-fundo/40 text-sucesso-forte' : 'border-perigo-borda bg-perigo-fundo/30 text-perigo-forte'}`}>
              {post.status === 'publicado' ? 'Publicado!' : post.aprovacao === 'aprovado' ? 'Você aprovou este post.' : 'Você pediu ajuste; a equipe vai mandar a nova versão.'}
              {(post.igLink || post.fbLink) && (
                <div className="mt-2 flex flex-wrap gap-3">
                  {post.igLink && <a href={post.igLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold underline">Ver no Instagram <ExternalLink className="h-3 w-3" /></a>}
                  {post.fbLink && <a href={post.fbLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold underline">Ver no Facebook <ExternalLink className="h-3 w-3" /></a>}
                </div>
              )}
            </div>
          )}
          {post.respostas.length > 0 && (
            <div className="space-y-2">
              <p className="text-rotulo font-semibold text-texto-2">Histórico</p>
              <ul className="space-y-1.5">
                {post.respostas.map((r) => (
                  <li key={r.versao} className="rounded-lg border border-borda bg-white px-3 py-2 text-rotulo">
                    <span className="font-semibold">Versão {r.versao}: {r.decisao === 'aprovado' ? 'aprovada' : 'ajuste pedido'}</span> <span className="text-texto-3">por {r.nome}</span>
                    {r.comentario && <p className="mt-0.5 text-texto-2">“{r.comentario}”</p>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
