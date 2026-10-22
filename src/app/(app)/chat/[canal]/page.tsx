import { Hash, Lock, MessagesSquare, X } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AoVivo } from '@/componentes/chat/AoVivo'
import { CaixaChat, GerenciarCanal, NovoCanal } from '@/componentes/chat/ControlesChat'
import { ItemMensagem } from '@/componentes/chat/ItemMensagem'
import { EstadoVazio } from '@/componentes/EstadoVazio'
import { continuacao, referenciasInternas, rotuloDia } from '@/dominio/chat'
import { dataDeHoje } from '@/dominio/filtros'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { fioDaMensagem, listarCanais, membrosDoCanal, mensagensDoCanal, titulosReferencias, type Canal, type Mensagem } from '@/servicos/chat'
import { listarEquipe } from '@/servicos/usuarios'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const texto = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

function IconeCanal({ c, className = 'h-3.5 w-3.5' }: { c: Pick<Canal, 'privado'>; className?: string }) {
  return c.privado ? <Lock className={className} /> : <Hash className={className} />
}

/** Chat da equipe: canais à esquerda, conversa no meio e o tópico aberto à direita. */
export default async function PaginaCanal({ params, searchParams }: PageProps<'/chat/[canal]'>) {
  const { canal: nome } = await params
  const sp = await searchParams
  const eu = await exigirEquipe()
  const sb = await criarClienteServidor()
  const canais = await listarCanais(sb).catch(() => null)
  if (!canais) {
    return <div className="page-shell"><EstadoVazio icone={MessagesSquare} titulo="O chat ainda não foi ativado" descricao="Falta rodar a migration do chat no banco." /></div>
  }
  const canal = canais.find((c) => c.nome === decodeURIComponent(nome))
  if (!canal) notFound()
  const fioId = texto(sp.fio)
  const [mensagens, fio, equipe, membros] = await Promise.all([
    mensagensDoCanal(sb, canal.id),
    fioId && UUID.test(fioId) ? fioDaMensagem(sb, fioId) : null,
    listarEquipe(sb),
    canal.privado ? membrosDoCanal(sb, canal.id) : [],
  ])
  const todas = [...mensagens, ...(fio ? [fio.principal, ...fio.respostas] : [])]
  const titulos = await titulosReferencias(sb, referenciasInternas(todas.map((m) => m.texto))).catch(() => ({}))
  const pessoas = equipe.map((p) => ({ id: p.id, nome: p.nome, avatar: p.avatar }))
  const outros = pessoas.filter((p) => p.id !== eu.id)
  const admin = eu.papel === 'admin'
  const hoje = dataDeHoje(new Date())
  const base = `/chat/${canal.nome}`

  const lista = (msgs: Mensagem[], comFio: boolean) =>
    msgs.map((m, i) => {
      const dia = dataDeHoje(new Date(m.criadoEm))
      const novoDia = i === 0 || dataDeHoje(new Date(msgs[i - 1].criadoEm)) !== dia
      return (
        <div key={m.id}>
          {novoDia && (
            <div className="my-3 flex items-center gap-3 px-3">
              <span className="h-px flex-1 bg-borda" />
              <span className="rounded-full border border-borda bg-white px-2.5 py-0.5 text-legenda font-semibold capitalize text-texto-2">{rotuloDia(dia, hoje)}</span>
              <span className="h-px flex-1 bg-borda" />
            </div>
          )}
          <ItemMensagem m={m} euId={eu.id} admin={admin} continuacao={!novoDia && continuacao(msgs[i - 1], m)} titulos={titulos} hrefFio={comFio ? `${base}?fio=${m.id}` : undefined} pessoas={pessoas} />
        </div>
      )
    })

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] min-h-0">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-borda bg-fundo/40 md:flex" aria-label="Canais">
        <div className="flex items-center justify-between border-b border-borda px-3 py-2.5">
          <p className="flex items-center gap-2 text-rotulo font-semibold text-texto"><MessagesSquare className="h-4 w-4" /> Canais</p>
          <NovoCanal equipe={outros} />
        </div>
        <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto p-2">
          {canais.map((c) => (
            <Link key={c.id} href={`/chat/${c.nome}`} className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-rotulo ${c.id === canal.id ? 'bg-white font-semibold text-texto shadow-sm' : c.naoLidas ? 'font-semibold text-texto hover:bg-hover' : 'text-texto-2 hover:bg-hover'}`}>
              <IconeCanal c={c} className="h-3.5 w-3.5 shrink-0 text-texto-3" />
              <span className="min-w-0 flex-1 truncate">{c.nome}</span>
              {c.naoLidas > 0 && c.id !== canal.id && <span className="rounded-full bg-perigo px-1.5 text-micro font-bold text-white">{c.naoLidas > 99 ? '99+' : c.naoLidas}</span>}
            </Link>
          ))}
        </nav>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col" aria-label={`Canal ${canal.nome}`}>
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-borda px-4 py-2.5">
          <div className="min-w-0">
            <h1 className="flex items-center gap-1.5 text-destaque font-bold text-texto"><IconeCanal c={canal} className="h-4 w-4 text-texto-3" />{canal.nome}</h1>
            {canal.descricao && <p className="truncate text-legenda text-texto-3">{canal.descricao}</p>}
          </div>
          <GerenciarCanal canalId={canal.id} privado={canal.privado} membros={membros} equipe={outros} podeGerir={canal.nome !== 'geral' && (canal.criadoPor === eu.id || admin)} />
        </header>
        {/* No celular os canais viram uma faixa rolável. */}
        <nav className="flex gap-1 overflow-x-auto border-b border-borda px-3 py-2 md:hidden" aria-label="Canais">
          {canais.map((c) => (
            <Link key={c.id} href={`/chat/${c.nome}`} className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-legenda ${c.id === canal.id ? 'bg-petroleo text-white' : 'border border-borda text-texto-2'}`}>
              <IconeCanal c={c} className="h-3 w-3" /> {c.nome}{c.naoLidas > 0 && c.id !== canal.id ? ` (${c.naoLidas})` : ''}
            </Link>
          ))}
          <NovoCanal equipe={outros} />
        </nav>
        <AoVivo canalId={canal.id} total={mensagens.length + (fio?.respostas.length ?? 0)} className="min-h-0 flex-1 overflow-y-auto pb-3">
          {mensagens.length === 0 ? (
            <p className="px-6 py-16 text-center text-corpo text-texto-3">Nenhuma mensagem em #{canal.nome} ainda. Comece a conversa!</p>
          ) : (
            lista(mensagens, true)
          )}
        </AoVivo>
        <div className="border-t border-borda p-3">
          <CaixaChat canalId={canal.id} canalNome={canal.nome} pessoas={pessoas} />
        </div>
      </section>

      {fio && (
        <aside className="fixed inset-0 z-40 flex flex-col bg-white md:static md:z-auto md:w-[380px] md:shrink-0 md:border-l md:border-borda" aria-label="Tópico">
          <header className="flex items-center justify-between border-b border-borda px-4 py-2.5">
            <p className="text-corpo font-semibold text-texto">Tópico <span className="font-normal text-texto-3">· #{canal.nome}</span></p>
            <Link href={base} scroll={false} aria-label="Fechar tópico" className="rounded p-1 text-texto-3 hover:bg-hover hover:text-texto"><X className="h-4 w-4" /></Link>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto pb-3">
            <ItemMensagem m={fio.principal} euId={eu.id} admin={admin} continuacao={false} titulos={titulos} pessoas={pessoas} />
            <div className="my-2 flex items-center gap-3 px-3">
              <span className="text-legenda font-semibold text-texto-3">{fio.respostas.length} {fio.respostas.length === 1 ? 'resposta' : 'respostas'}</span>
              <span className="h-px flex-1 bg-borda" />
            </div>
            {lista(fio.respostas, false)}
          </div>
          <div className="border-t border-borda p-3">
            <CaixaChat canalId={canal.id} paiId={fio.principal.id} canalNome={canal.nome} pessoas={pessoas} />
          </div>
        </aside>
      )}
    </div>
  )
}
