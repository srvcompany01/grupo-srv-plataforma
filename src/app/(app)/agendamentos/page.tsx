import { AlertTriangle, BarChart3, CalendarClock, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Clock, Columns3, ExternalLink, Hourglass, List, Video } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'
import { MetricasMini, PainelInsight, SeloNota } from '@/componentes/conteudo/InsightPost'
import type { MetricasPost, Nota } from '@/dominio/insights-post'
import { metricasDosPosts, notasDosPosts } from '@/servicos/insights-post'
import { AcoesAgendamento } from '@/componentes/conteudo/AcoesAgendamento'
import { NovoPostDialog } from '@/componentes/conteudo/NovoPostDialog'
import { EstadoVazio } from '@/componentes/EstadoVazio'
import { Modulo } from '@/componentes/Modulo'
import { gradeDoMes } from '@/dominio/agenda'
import { rotuloDia } from '@/dominio/chat'
import { lerMes, mesVizinho } from '@/dominio/financeiro'
import { ROTULO_FORMATO } from '@/dominio/conteudo'
import { dataDeHoje } from '@/dominio/filtros'
import { ROTULO_ALVO, situacaoPublicacao } from '@/dominio/publicacao'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { listarClientes } from '@/servicos/clientes-plataforma'
import { listarAgendamentos, tarefasMaeDeConteudo, type Agendamento } from '@/servicos/conteudo'
import { dados } from '@/servicos/resultado'
import { NomeCliente } from '@/componentes/NomeCliente'

const hora = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Belem' })
const diaHora = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'America/Belem' })
const texto = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

// A análise com IA (botão no painel do post) assiste o vídeo: pode levar 1 ou 2 minutos.
export const maxDuration = 300

/** Métricas e nota de cada post publicado, e o link do painel de insight. */
type Extras = { metricas: Map<string, MetricasPost>; notas: Map<string, Nota>; insight: (id: string) => string }

function Linha({ a, agora, soHora, hoje, x }: { a: Agendamento; agora: Date; soHora?: boolean; hoje: string; x: Extras }) {
  const m = a.igMediaId ? x.metricas.get(a.igMediaId) : undefined
  const nota = x.notas.get(a.id)
  const situacao = situacaoPublicacao({ status: a.status, em: a.em, modo: a.modo, aprovacao: a.aprovacao }, agora)
  return (
    <li>
      <span>
        {a.status === 'publicado' && a.publicadoEm ? diaHora.format(new Date(a.publicadoEm)) : a.em ? (soHora ? hora.format(new Date(a.em)) : diaHora.format(new Date(a.em))) : '—'}
      </span>
      <Link href={`/tarefas/${a.id}`}>
        {a.capa && (a.capa.tipo === 'video' ? <><video src={a.capa.url} muted /><Video /></> : (
          // eslint-disable-next-line @next/next/no-img-element -- URL assinada do R2
          <img loading="lazy" decoding="async" src={a.capa.url} alt="" />
        ))}
      </Link>
      <div>
        <Link href={`/tarefas/${a.id}`}>{a.titulo}</Link>
        <p>
          {a.cliente && <span><span style={{ background: a.cliente.cor }} /><NomeCliente nome={a.cliente.nome} href={`/clientes/${a.cliente.id}`} /></span>}
          <span>{ROTULO_FORMATO[a.formato]}</span>
          {a.alvos.length > 0 && <span>{a.alvos.map((x) => ROTULO_ALVO[x]).join(' + ')}</span>}
          <span>{situacao}</span>
        </p>
        {a.status === 'falhou' && a.erro && <p title={a.erro}>{a.erro}</p>}
        {a.status === 'publicado' && (
          <p>
            {m ? <MetricasMini m={m} /> : a.igMediaId && <span>sem métricas do Instagram</span>}
            {nota && <SeloNota nota={nota} />}
            {a.igMediaId && <Link href={x.insight(a.id)} scroll={false}><BarChart3 /> Insights</Link>}
          </p>
        )}
      </div>
      {(a.igLink || a.fbLink) && (
        <div>
          {a.igLink && <a href={a.igLink} target="_blank" rel="noreferrer">Instagram <ExternalLink /></a>}
          {a.fbLink && <a href={a.fbLink} target="_blank" rel="noreferrer">Facebook <ExternalLink /></a>}
        </div>
      )}
      <AcoesAgendamento id={a.id} em={a.em} alvos={a.alvos} modo={a.modo} status={a.status} hoje={hoje} />
    </li>
  )
}

const Lista = ({ itens, agora, soHora, hoje, x }: { itens: Agendamento[]; agora: Date; soHora?: boolean; hoje: string; x: Extras }) => (
  <ul>{itens.map((a) => <Linha key={a.id} a={a} agora={agora} soHora={soHora} hoje={hoje} x={x} />)}</ul>
)

/** Kanban: uma coluna por etapa (atenção, com o cliente, agendado, publicado). */
function Kanban({ colunas, agora, x }: { colunas: { titulo: string; cor: string; itens: Agendamento[] }[]; agora: Date; x: Extras }) {
  return (
    <div>
      {colunas.map((c) => (
        <section key={c.titulo}>
          <h2>
            <span style={{ background: c.cor }} aria-hidden /> {c.titulo}
            <span>{c.itens.length}</span>
          </h2>
          <ul>
            {c.itens.length === 0 && <li>Nada aqui.</li>}
            {c.itens.map((a) => {
              const m = a.igMediaId ? x.metricas.get(a.igMediaId) : undefined
              const nota = x.notas.get(a.id)
              const quando = a.status === 'publicado' ? a.publicadoEm ?? a.em : a.em
              return (
                <li key={a.id}>
                  <Link href={`/tarefas/${a.id}`}>
                    <span>
                      {a.capa && (a.capa.tipo === 'video' ? <><video src={a.capa.url} muted /><Video /></> : (
                        // eslint-disable-next-line @next/next/no-img-element -- URL assinada do R2
                        <img loading="lazy" decoding="async" src={a.capa.url} alt="" />
                      ))}
                    </span>
                    <span>
                      <span>{a.titulo}</span>
                      <span>{ROTULO_FORMATO[a.formato]}{quando ? ` · ${diaHora.format(new Date(quando))}` : ''}</span>
                      <span>{situacaoPublicacao({ status: a.status, em: a.em, modo: a.modo, aprovacao: a.aprovacao }, agora)}</span>
                    </span>
                  </Link>
                  {(a.cliente || m || nota) && (
                    <div>
                      {a.cliente && <p><span style={{ background: a.cliente.cor }} /><NomeCliente nome={a.cliente.nome} href={`/clientes/${a.cliente.id}`} /></p>}
                      {(m || nota) && <div>{m && <MetricasMini m={m} />}{nota && <SeloNota nota={nota} />}</div>}
                      {a.igMediaId && <Link href={x.insight(a.id)} scroll={false}><BarChart3 /> Insights</Link>}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}

const SEMANA = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
const corDoItem = (a: Agendamento) => (a.status === 'publicado' ? 'border-sucesso' : a.status === 'falhou' || a.aprovacao === 'ajuste' ? 'border-perigo' : a.modo === 'aprovacao' && a.aprovacao !== 'aprovado' ? 'border-aviso' : 'border-petroleo')

/** Mês com os posts em cada dia (pelo horário marcado ou, nos publicados, pela data em que saíram). */
function Calendario({ itens, mes, hoje, href }: { itens: Agendamento[]; mes: string; hoje: string; href: (m: string) => string }) {
  const dias = gradeDoMes(mes)
  const porDia = new Map<string, Agendamento[]>()
  for (const a of itens) {
    const quando = a.status === 'publicado' ? a.publicadoEm ?? a.em : a.em
    if (!quando) continue
    const dia = dataDeHoje(new Date(quando))
    porDia.set(dia, [...(porDia.get(dia) ?? []), a].sort((x, y) => (x.em ?? '').localeCompare(y.em ?? '')))
  }
  const nomeMes = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${mes}-01T00:00:00Z`))
  return (
    <Modulo icone={CalendarDays} titulo={nomeMes.replace(/^./, (c) => c.toUpperCase())} descricao="Borda verde: publicado · amarela: esperando o cliente · azul: agendado · vermelha: atenção" acoes={
      <nav>
        <Link href={href(mesVizinho(mes, -1))} aria-label="Mês anterior"><ChevronLeft /></Link>
        <Link href={href(hoje.slice(0, 7))}>Hoje</Link>
        <Link href={href(mesVizinho(mes, 1))} aria-label="Próximo mês"><ChevronRight /></Link>
      </nav>
    }>
      <div>
        {SEMANA.map((d) => <div key={d}>{d}</div>)}
        {dias.map((dia) => {
          const lista = porDia.get(dia) ?? []
          const fora = !dia.startsWith(mes)
          return (
            <div key={dia}>
              <span>{Number(dia.slice(8))}</span>
              <ul>
                {lista.slice(0, 4).map((a) => (
                  <li key={a.id}>
                    <Link href={`/tarefas/${a.id}`} title={`${a.titulo}${a.cliente ? ` · ${a.cliente.nome}` : ''}`}>
                      {a.cliente && <span style={{ background: a.cliente.cor }} />}
                      {a.em && <span>{hora.format(new Date(a.status === 'publicado' ? a.publicadoEm ?? a.em : a.em))}</span>}
                      <span>{a.titulo}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              {lista.length > 4 && <p>+{lista.length - 4} mais</p>}
            </div>
          )
        })}
      </div>
    </Modulo>
  )
}

/** Fila de publicação dos posts de todos os clientes: o que pede atenção, o que espera o cliente, o que vai sair e o que saiu. */
export default async function Agendamentos({ searchParams }: PageProps<'/agendamentos'>) {
  const sp = await searchParams
  await exigirEquipe()
  const sb = await criarClienteServidor()
  const [todos, listaConteudo, todosClientes] = await Promise.all([
    listarAgendamentos(sb).catch(() => null),
    sb.from('lists').select('id').eq('kind', 'conteudo').is('archived_at', null).order('position').limit(1).then(dados, () => [] as { id: string }[]),
    listarClientes(sb),
  ])
  const maes = await tarefasMaeDeConteudo(sb).catch(() => [])
  if (!todos) return <div><EstadoVazio icone={CalendarClock} titulo="Agendamentos ainda não ativados" descricao="Falta rodar a migration de publicação no banco." /></div>

  const agora = new Date()
  const hoje = dataDeHoje(agora)
  const clientes = [...new Map(todos.flatMap((a) => (a.cliente ? [[a.cliente.id, a.cliente]] : []))).values()].sort((a, b) => a.nome.localeCompare(b.nome))
  const filtro = texto(sp.cliente)
  const visao = texto(sp.visao) === 'calendario' ? 'calendario' : texto(sp.visao) === 'kanban' ? 'kanban' : 'lista'
  const postAberto = texto(sp.post)
  const mes = lerMes(texto(sp.mes), hoje)
  const url = (p: { visao?: string; mes?: string; cliente?: string | null; post?: string | null }) => {
    const q = new URLSearchParams()
    const v = p.visao ?? visao
    if (v !== 'lista') q.set('visao', v)
    if (v === 'calendario' && (p.mes ?? mes) !== hoje.slice(0, 7)) q.set('mes', p.mes ?? mes)
    const c = p.cliente === undefined ? filtro : p.cliente
    if (c) q.set('cliente', c)
    if (p.post) q.set('post', p.post)
    return q.size ? `/agendamentos?${q}` : '/agendamentos'
  }
  const itens = filtro ? todos.filter((a) => a.cliente?.id === filtro) : todos

  const atencao = itens.filter((a) => a.status === 'falhou' || (a.aprovacao === 'ajuste' && a.status !== 'publicado'))
  const esperandoCliente = itens.filter((a) => a.aprovacao === 'aguardando' && a.status !== 'publicado' && a.status !== 'falhou')
  const proximos = itens.filter((a) => (a.status === 'agendado' || a.status === 'publicando') && (a.modo === 'direto' || a.aprovacao === 'aprovado'))
  const publicados = itens.filter((a) => a.status === 'publicado').sort((x, y) => (y.publicadoEm ?? '').localeCompare(x.publicadoEm ?? '')).slice(0, 30)
  // Métricas ao vivo dos publicados (até 60, os mais recentes) e as notas das análises já feitas.
  const publicadosTodos = itens.filter((a) => a.status === 'publicado' && a.igMediaId).sort((a, b) => (b.publicadoEm ?? '').localeCompare(a.publicadoEm ?? '')).slice(0, 60)
  const [metricas, notas] = await Promise.all([
    metricasDosPosts(publicadosTodos.map((a) => ({ igId: a.igMediaId!, formato: a.formato }))).catch(() => new Map<string, MetricasPost>()),
    notasDosPosts(sb, publicadosTodos.map((a) => a.id)),
  ])
  const x: Extras = { metricas, notas, insight: (id) => url({ post: id }) }
  const porDia = new Map<string, Agendamento[]>()
  for (const a of proximos) {
    const dia = a.em ? dataDeHoje(new Date(a.em)) : hoje
    porDia.set(dia, [...(porDia.get(dia) ?? []), a])
  }
  const chip = (ativo: boolean) => `rounded-md px-3 py-1 text-rotulo font-medium ${ativo ? 'bg-petroleo text-claro' : 'border border-borda bg-white text-texto-2 hover:bg-hover'}`

  return (
    <div>
      <div>
        <div>
          <p>Conteúdo</p>
          <h1>Posts</h1>
        </div>
        <div>
          <nav aria-label="Visão">
            <Link href={url({ visao: 'lista' })}><List /> Lista</Link>
            <Link href={url({ visao: 'kanban' })}><Columns3 /> Kanban</Link>
            <Link href={url({ visao: 'calendario' })}><CalendarDays /> Calendário</Link>
          </nav>
          {listaConteudo[0] && <NovoPostDialog listaId={listaConteudo[0].id} maes={maes} clientes={todosClientes.filter((c) => !c.interno && c.status !== 'encerrado').map((c) => ({ id: c.id, nome: c.nome }))} />}
        </div>
      </div>
      <p>{proximos.length} para sair · {esperandoCliente.length} com o cliente · {atencao.length} pedindo atenção</p>
      {clientes.length > 1 && (
        <nav aria-label="Filtrar por cliente">
          <Link href={url({ cliente: null })}>Todos</Link>
          {clientes.map((c) => <Link key={c.id} href={url({ cliente: c.id })}>{c.nome}</Link>)}
        </nav>
      )}

      {visao === 'calendario' ? (
        <Calendario itens={itens} mes={mes} hoje={hoje} href={(m) => url({ mes: m })} />
      ) : itens.length === 0 ? (
        <EstadoVazio icone={CalendarClock} titulo="Nenhum post agendado" descricao='Abra um post da lista de conteúdo e use o bloco "Publicação no Instagram e Facebook".' />
      ) : visao === 'kanban' ? (
        <Kanban
          agora={agora}
          x={x}
          colunas={[
            { titulo: 'Pedindo atenção', cor: '#d64545', itens: atencao },
            { titulo: 'Aguardando o cliente', cor: '#eda100', itens: esperandoCliente },
            { titulo: 'Agendados', cor: '#2a78d6', itens: [...proximos].sort((a, b) => (a.em ?? '').localeCompare(b.em ?? '')) },
            { titulo: 'Publicados', cor: '#1baf7a', itens: publicados },
          ]}
        />
      ) : (
        <div>
          <div>
            {atencao.length > 0 && (
              <Modulo icone={AlertTriangle} titulo="Pedindo atenção" descricao="Falhou ao publicar ou o cliente pediu ajuste" perigo>
                <Lista itens={atencao} agora={agora} hoje={hoje} x={x} />
              </Modulo>
            )}
            <Modulo icone={Clock} titulo="Próximos" descricao="Prontos para sair (aprovados ou sem aprovação), na ordem">
              {proximos.length === 0 ? <p>Nada na fila agora.</p> : (
                <div>
                  {[...porDia.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([dia, lista]) => (
                    <div key={dia}>
                      <p>{dia < hoje ? 'Atrasados (saem na próxima rodada)' : rotuloDia(dia, hoje)}</p>
                      <Lista itens={lista} agora={agora} soHora={dia >= hoje} hoje={hoje} x={x} />
                    </div>
                  ))}
                </div>
              )}
            </Modulo>
          </div>
          <div>
            <Modulo icone={Hourglass} titulo="Aguardando o cliente" descricao="Enviados para aprovação no portal; publicam no horário depois do sim">
              {esperandoCliente.length === 0 ? <p>Nenhum post esperando o cliente.</p> : <Lista itens={esperandoCliente} agora={agora} hoje={hoje} x={x} />}
            </Modulo>
            <Modulo icone={CheckCircle2} titulo="Publicados" descricao="Os 30 mais recentes">
              {publicados.length === 0 ? <p>Nada publicado pela plataforma ainda.</p> : <Lista itens={publicados} agora={agora} hoje={hoje} x={x} />}
            </Modulo>
          </div>
        </div>
      )}
      {postAberto && (
        <aside aria-label="Insight do post">
          <Suspense key={postAberto} fallback={<p>Buscando as métricas no Instagram…</p>}>
            <PainelInsight id={postAberto} fechar={url({ post: null })} />
          </Suspense>
        </aside>
      )}
    </div>
  )
}
