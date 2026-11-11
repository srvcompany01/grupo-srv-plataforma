import { CalendarClock, ChevronLeft, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PreviaPost } from '@/componentes/portal/PreviaPost'
import { RespostaPost } from '@/componentes/portal/RespostaPost'
import { ROTULO_ALVO, situacaoPublicacao } from '@/dominio/publicacao'
import { clientePorLink, postDoCliente } from '@/servicos/portal-conteudo'

// Aprovar pode publicar na hora (quando o horário já passou).
export const maxDuration = 300

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const quando = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'America/Belem' })

/** Post para o cliente ver como vai ficar, com o dia e a hora, e aprovar ou pedir ajuste. */
export default async function PostDoCliente({ params }: PageProps<'/cliente/[slug]/posts/[id]'>) {
  const { slug, id } = await params
  if (!UUID.test(id)) notFound()
  const cliente = await clientePorLink(slug)
  if (!cliente) notFound()
  const post = await postDoCliente(cliente.id, id)
  if (!post) notFound()
  const dataHora = post.publicarEm ? quando.format(new Date(post.publicarEm)) : null
  const situacao = situacaoPublicacao({ status: post.status, em: post.publicarEm, modo: post.modo, aprovacao: post.aprovacao }, new Date())

  return (
    <main>
      <Link href={`/cliente/${cliente.slug}`}><ChevronLeft /> Voltar</Link>
      <div>
        <PreviaPost nome={cliente.nome} formato={post.formato} midias={post.midias} legenda={post.legenda} collabs={post.collabs} />
        <section>
          <div>
            <p>Post · versão {post.versao}</p>
            <h1>{post.titulo}</h1>
          </div>
          <div>
            <p><CalendarClock /> Quando vai ao ar</p>
            <p>{dataHora ?? 'Data a combinar'}</p>
            {post.alvos.length > 0 && <p>Em {post.alvos.map((a) => ROTULO_ALVO[a]).join(' e ')} · {situacao}</p>}
          </div>
          {post.aprovacao === 'aguardando' ? (
            <div>
              <p>Este post espera a sua aprovação</p>
              <RespostaPost slug={cliente.slug} tarefaId={post.id} quando={dataHora} />
            </div>
          ) : (
            <div>
              {post.status === 'publicado' ? 'Publicado!' : post.aprovacao === 'aprovado' ? 'Você aprovou este post.' : 'Você pediu ajuste; a equipe vai mandar a nova versão.'}
              {(post.igLink || post.fbLink) && (
                <div>
                  {post.igLink && <a href={post.igLink} target="_blank" rel="noreferrer">Ver no Instagram <ExternalLink /></a>}
                  {post.fbLink && <a href={post.fbLink} target="_blank" rel="noreferrer">Ver no Facebook <ExternalLink /></a>}
                </div>
              )}
            </div>
          )}
          {post.respostas.length > 0 && (
            <div>
              <p>Histórico</p>
              <ul>
                {post.respostas.map((r) => (
                  <li key={r.versao}>
                    <span>Versão {r.versao}: {r.decisao === 'aprovado' ? 'aprovada' : 'ajuste pedido'}</span> <span>por {r.nome}</span>
                    {r.comentario && <p>“{r.comentario}”</p>}
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
