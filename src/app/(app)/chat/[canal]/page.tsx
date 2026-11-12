import { CalendarDays, FileText, Hash, ListChecks, Lock, MessagesSquare, X } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AoVivo } from '@/componentes/chat/AoVivo'
import { CaixaChat, GerenciarCanal, NovoCanal, type ListaChat } from '@/componentes/chat/ControlesChat'
import { ConversasDiretas, type PessoaConversa } from '@/componentes/chat/ConversasDiretas'
import { ItemMensagem } from '@/componentes/chat/ItemMensagem'
import { EstadoVazio } from '@/componentes/EstadoVazio'
import { continuacao, referenciasInternas, rotuloDia } from '@/dominio/chat'
import { dataDeHoje } from '@/dominio/filtros'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { fioDaMensagem, listarCanais, membrosDoCanal, mensagensDoCanal, titulosReferencias, type Canal, type Mensagem } from '@/servicos/chat'
import { listarEquipe } from '@/servicos/usuarios'
import { situacao } from '@/dominio/time'
import { quadroDoTime } from '@/servicos/time'
import { listarArvore } from '@/servicos/espacos'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const texto = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

function IconeCanal({ c, className = 'h-3.5 w-3.5' }: { c: Pick<Canal, 'privado'>; className?: string }) {
  return c.privado ? <Lock /> : <Hash />
}

/** Chat da equipe: canais à esquerda, conversa no meio e o tópico aberto à direita. */
export default async function PaginaCanal({ params, searchParams }: PageProps<'/chat/[canal]'>) {
  const { canal: nome } = await params
  const sp = await searchParams
  const eu = await exigirEquipe()
  const sb = await criarClienteServidor()
  const canais = await listarCanais(sb).catch(() => null)
  if (!canais) {
    return <div><EstadoVazio icone={MessagesSquare} titulo="O chat ainda não foi ativado" descricao="Falta rodar a migration do chat no banco." /></div>
  }
  const canal = canais.find((c) => c.nome === decodeURIComponent(nome))
  if (!canal) notFound()
  const fioId = texto(sp.fio)
  const [mensagens, fio, equipe, membros, quadro, arvore, tipos] = await Promise.all([
    mensagensDoCanal(sb, canal.id),
    fioId && UUID.test(fioId) ? fioDaMensagem(sb, fioId) : null,
    listarEquipe(sb),
    canal.privado ? membrosDoCanal(sb, canal.id) : [],
    quadroDoTime(sb, dataDeHoje(new Date())).catch(() => null),
    listarArvore(sb).catch(() => null),
    sb.from('lists').select('id, kind').is('archived_at', null).then((q) => q.data ?? []),
  ])
  const todas = [...mensagens, ...(fio ? [fio.principal, ...fio.respostas] : [])]
  const titulos = await titulosReferencias(sb, referenciasInternas(todas.map((m) => m.texto))).catch(() => ({}))
  const pessoas = equipe.map((p) => ({ id: p.id, nome: p.nome, avatar: p.avatar }))
  const outros = pessoas.filter((p) => p.id !== eu.id)
  const admin = eu.papel === 'admin'
  const hoje = dataDeHoje(new Date())
  const base = `/chat/${canal.nome}`

  // Mensagens diretas = canais privados de duas pessoas chamados dm-<início dos ids>. Os demais são canais.
  const nomeDm = (outroId: string) => `dm-${[eu.id, outroId].map((id) => id.slice(0, 8)).sort().join('-')}`
  const ehDm = (nome: string) => nome.startsWith('dm-')
  const canaisComuns = canais.filter((c) => !ehDm(c.nome))
  const presenca = new Map((quadro ?? []).map((m) => [m.id, situacao(m, new Date())]))
  const conversas: PessoaConversa[] = outros.map((p) => {
    const dm = canais.find((c) => c.nome === nomeDm(p.id))
    return { id: p.id, nome: p.nome, situacao: presenca.get(p.id) ?? 'offline', canal: dm?.nome, naoLidas: dm?.naoLidas ?? 0, aberta: dm?.id === canal.id }
  })
  const interlocutor = ehDm(canal.nome) ? outros.find((p) => nomeDm(p.id) === canal.nome) : undefined
  const tituloCanal = interlocutor?.nome ?? canal.nome
  const kinds = new Map(tipos.map((t) => [t.id, t.kind]))
  const listas: ListaChat[] = []
  const coletar = (e: NonNullable<typeof arvore>['espacos'][number], prefixo: string) => {
    const nome = prefixo ? `${prefixo} › ${e.nome}` : e.nome
    for (const l of [...e.listas, ...e.pastas.flatMap((pa) => pa.listas)]) listas.push({ id: l.id, nome: `${nome} › ${l.nome}`, post: kinds.get(l.id) === 'conteudo' })
    for (const f of e.filhos) coletar(f, nome)
  }
  for (const e of arvore?.espacos ?? []) coletar(e, '')
  for (const l of arvore?.listasRaiz ?? []) listas.push({ id: l.id, nome: l.nome, post: kinds.get(l.id) === 'conteudo' })

  const lista = (msgs: Mensagem[], comFio: boolean) =>
    msgs.map((m, i) => {
      const dia = dataDeHoje(new Date(m.criadoEm))
      const novoDia = i === 0 || dataDeHoje(new Date(msgs[i - 1].criadoEm)) !== dia
      return (
        <div key={m.id}>
          {novoDia && (
            <div>
              <span />
              <span>{rotuloDia(dia, hoje)}</span>
              <span />
            </div>
          )}
          <ItemMensagem m={m} euId={eu.id} admin={admin} continuacao={!novoDia && continuacao(msgs[i - 1], m)} titulos={titulos} hrefFio={comFio ? `${base}?fio=${m.id}` : undefined} pessoas={pessoas} />
        </div>
      )
    })

  return (
    <div>
      <aside className="hidden md:flex" aria-label="Canais">
        <div>
          <p>Chat</p>
          <NovoCanal equipe={outros} />
        </div>
        <nav>
          <p>Canais</p>
          {canaisComuns.map((c) => (
            <Link key={c.id} href={`/chat/${c.nome}`}>
              <IconeCanal c={c} />
              <span>{c.nome}</span>
              {c.naoLidas > 0 && c.id !== canal.id && <span>{c.naoLidas > 99 ? '99+' : c.naoLidas}</span>}
            </Link>
          ))}
          <p>Mensagens diretas</p>
          <ConversasDiretas pessoas={conversas} />
        </nav>
      </aside>

      <section aria-label={`Canal ${canal.nome}`}>
        <header>
          <div>
            <h1>{!interlocutor && <IconeCanal c={canal} />}{tituloCanal}</h1>
            {canal.descricao && <p>{canal.descricao}</p>}
          </div>
          <GerenciarCanal canalId={canal.id} privado={canal.privado} membros={membros} equipe={outros} podeGerir={canal.nome !== 'geral' && (canal.criadoPor === eu.id || admin)} />
        </header>
        {/* No celular os canais viram uma faixa rolável. */}
        <nav aria-label="Canais">
          {canaisComuns.map((c) => (
            <Link key={c.id} href={`/chat/${c.nome}`}>
              <IconeCanal c={c} /> {c.nome}{c.naoLidas > 0 && c.id !== canal.id ? ` (${c.naoLidas})` : ''}
            </Link>
          ))}
          <NovoCanal equipe={outros} />
        </nav>
        <AoVivo canalId={canal.id} total={mensagens.length + (fio?.respostas.length ?? 0)}>
          {mensagens.length === 0 ? (
            <p>Nenhuma mensagem em #{canal.nome} ainda. Comece a conversa!</p>
          ) : (
            lista(mensagens, true)
          )}
        </AoVivo>
        <div>
          <CaixaChat canalId={canal.id} canalNome={tituloCanal} pessoas={pessoas} listas={listas} />
        </div>
        <nav aria-label="Visualizações vinculadas">
          {[{ href: '/inicio', rotulo: 'Minhas tarefas', Icone: ListChecks }, { href: '/agenda', rotulo: 'Agenda', Icone: CalendarDays }, { href: '/documentos', rotulo: 'Documentos', Icone: FileText }].map(({ href, rotulo, Icone }) => (
            <Link key={href} href={href}><Icone />{rotulo}</Link>
          ))}
        </nav>
      </section>

      {fio && (
        <aside aria-label="Tópico">
          <header>
            <p>Tópico <span>· #{canal.nome}</span></p>
            <Link href={base} scroll={false} aria-label="Fechar tópico"><X /></Link>
          </header>
          <div>
            <ItemMensagem m={fio.principal} euId={eu.id} admin={admin} continuacao={false} titulos={titulos} pessoas={pessoas} />
            <div>
              <span>{fio.respostas.length} {fio.respostas.length === 1 ? 'resposta' : 'respostas'}</span>
              <span />
            </div>
            {lista(fio.respostas, false)}
          </div>
          <div>
            <CaixaChat canalId={canal.id} paiId={fio.principal.id} canalNome={canal.nome} pessoas={pessoas} />
          </div>
        </aside>
      )}
    </div>
  )
}
