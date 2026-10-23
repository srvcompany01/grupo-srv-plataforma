import { AlertTriangle, CalendarClock, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Clock, ExternalLink, Hourglass, List, Video } from 'lucide-react'
import Link from 'next/link'
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

function Linha({ a, agora, soHora, hoje }: { a: Agendamento; agora: Date; soHora?: boolean; hoje: string }) {
  const situacao = situacaoPublicacao({ status: a.status, em: a.em, modo: a.modo, aprovacao: a.aprovacao }, agora)
  const cor = a.status === 'publicado' ? 'text-sucesso-forte' : a.status === 'falhou' || a.aprovacao === 'ajuste' ? 'text-perigo-forte' : a.modo === 'aprovacao' && a.aprovacao !== 'aprovado' ? 'text-aviso-forte' : 'text-texto-2'
  return (
    <li className="flex items-center gap-3 px-3 py-2.5 hover:bg-hover/50">
      <span className="w-14 shrink-0 text-center text-rotulo font-semibold tabular-nums text-texto">
        {a.status === 'publicado' && a.publicadoEm ? diaHora.format(new Date(a.publicadoEm)) : a.em ? (soHora ? hora.format(new Date(a.em)) : diaHora.format(new Date(a.em))) : '—'}
      </span>
      <Link href={`/tarefas/${a.id}`} className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-fundo">
        {a.capa && (a.capa.tipo === 'video' ? <><video src={a.capa.url} muted className="h-full w-full object-cover" /><Video className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 text-white drop-shadow" /></> : (
          // eslint-disable-next-line @next/next/no-img-element -- URL assinada do R2
          <img src={a.capa.url} alt="" className="h-full w-full object-cover" />
        ))}
      </Link>
      <div className="min-w-0 flex-1">
        <Link href={`/tarefas/${a.id}`} className="block truncate text-corpo font-semibold text-texto hover:underline">{a.titulo}</Link>
        <p className="flex flex-wrap items-center gap-x-2 text-legenda text-texto-3">
          {a.cliente && <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: a.cliente.cor }} /><NomeCliente nome={a.cliente.nome} href={`/clientes/${a.cliente.id}`} /></span>}
          <span>{ROTULO_FORMATO[a.formato]}</span>
          {a.alvos.length > 0 && <span>{a.alvos.map((x) => ROTULO_ALVO[x]).join(' + ')}</span>}
          <span className={`font-semibold ${cor}`}>{situacao}</span>
        </p>
        {a.status === 'falhou' && a.erro && <p className="truncate text-legenda text-perigo-forte" title={a.erro}>{a.erro}</p>}
      </div>
      {(a.igLink || a.fbLink) && (
        <div className="flex shrink-0 flex-col items-end gap-0.5 text-legenda">
          {a.igLink && <a href={a.igLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-marca hover:underline">Instagram <ExternalLink className="h-3 w-3" /></a>}
          {a.fbLink && <a href={a.fbLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-marca hover:underline">Facebook <ExternalLink className="h-3 w-3" /></a>}
        </div>
      )}
      <AcoesAgendamento id={a.id} em={a.em} alvos={a.alvos} modo={a.modo} status={a.status} hoje={hoje} />
    </li>
  )
}

const Lista = ({ itens, agora, soHora, hoje }: { itens: Agendamento[]; agora: Date; soHora?: boolean; hoje: string }) => (
  <ul className="divide-y divide-borda rounded-lg border border-borda">{itens.map((a) => <Linha key={a.id} a={a} agora={agora} soHora={soHora} hoje={hoje} />)}</ul>
)

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
      <nav className="flex items-center gap-1">
        <Link href={href(mesVizinho(mes, -1))} aria-label="Mês anterior" className="rounded-lg p-1.5 text-texto-2 hover:bg-hover"><ChevronLeft className="h-4 w-4" /></Link>
        <Link href={href(hoje.slice(0, 7))} className="rounded-lg border border-borda px-2 py-0.5 text-rotulo font-semibold text-texto-2 hover:bg-hover">Hoje</Link>
        <Link href={href(mesVizinho(mes, 1))} aria-label="Próximo mês" className="rounded-lg p-1.5 text-texto-2 hover:bg-hover"><ChevronRight className="h-4 w-4" /></Link>
      </nav>
    }>
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-borda bg-borda">
        {SEMANA.map((d) => <div key={d} className="bg-fundo px-1 py-1 text-center text-micro font-semibold text-texto-3">{d}</div>)}
        {dias.map((dia) => {
          const lista = porDia.get(dia) ?? []
          const fora = !dia.startsWith(mes)
          return (
            <div key={dia} className={`min-h-24 min-w-0 p-1 md:min-h-32 ${fora ? 'bg-fundo/60' : 'bg-white'}`}>
              <span className={`mb-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-micro font-semibold ${dia === hoje ? 'bg-petroleo text-white' : fora ? 'text-texto-3/60' : 'text-texto-2'}`}>{Number(dia.slice(8))}</span>
              <ul className="space-y-0.5">
                {lista.slice(0, 4).map((a) => (
                  <li key={a.id}>
                    <Link href={`/tarefas/${a.id}`} title={`${a.titulo}${a.cliente ? ` · ${a.cliente.nome}` : ''}`} className={`flex items-center gap-1 rounded border-l-2 bg-fundo px-1 py-0.5 text-micro hover:bg-hover ${corDoItem(a)}`}>
                      {a.cliente && <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: a.cliente.cor }} />}
                      {a.em && <span className="tabular-nums text-texto-3">{hora.format(new Date(a.status === 'publicado' ? a.publicadoEm ?? a.em : a.em))}</span>}
                      <span className="truncate text-texto">{a.titulo}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              {lista.length > 4 && <p className="mt-0.5 text-micro font-semibold text-texto-3">+{lista.length - 4} mais</p>}
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
  if (!todos) return <div className="page-shell"><EstadoVazio icone={CalendarClock} titulo="Agendamentos ainda não ativados" descricao="Falta rodar a migration de publicação no banco." /></div>

  const agora = new Date()
  const hoje = dataDeHoje(agora)
  const clientes = [...new Map(todos.flatMap((a) => (a.cliente ? [[a.cliente.id, a.cliente]] : []))).values()].sort((a, b) => a.nome.localeCompare(b.nome))
  const filtro = texto(sp.cliente)
  const visao = texto(sp.visao) === 'calendario' ? 'calendario' : 'lista'
  const mes = lerMes(texto(sp.mes), hoje)
  const url = (p: { visao?: string; mes?: string; cliente?: string | null }) => {
    const q = new URLSearchParams()
    const v = p.visao ?? visao
    if (v === 'calendario') q.set('visao', v)
    if (v === 'calendario' && (p.mes ?? mes) !== hoje.slice(0, 7)) q.set('mes', p.mes ?? mes)
    const c = p.cliente === undefined ? filtro : p.cliente
    if (c) q.set('cliente', c)
    return q.size ? `/agendamentos?${q}` : '/agendamentos'
  }
  const itens = filtro ? todos.filter((a) => a.cliente?.id === filtro) : todos

  const atencao = itens.filter((a) => a.status === 'falhou' || (a.aprovacao === 'ajuste' && a.status !== 'publicado'))
  const esperandoCliente = itens.filter((a) => a.aprovacao === 'aguardando' && a.status !== 'publicado' && a.status !== 'falhou')
  const proximos = itens.filter((a) => (a.status === 'agendado' || a.status === 'publicando') && (a.modo === 'direto' || a.aprovacao === 'aprovado'))
  const publicados = itens.filter((a) => a.status === 'publicado').sort((x, y) => (y.publicadoEm ?? '').localeCompare(x.publicadoEm ?? '')).slice(0, 30)
  const porDia = new Map<string, Agendamento[]>()
  for (const a of proximos) {
    const dia = a.em ? dataDeHoje(new Date(a.em)) : hoje
    porDia.set(dia, [...(porDia.get(dia) ?? []), a])
  }
  const chip = (ativo: boolean) => `rounded-full px-3 py-1 text-rotulo font-medium ${ativo ? 'bg-petroleo text-white' : 'border border-borda bg-white text-texto-2 hover:bg-hover'}`

  return (
    <div className="page-shell">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Conteúdo</p>
          <h1 className="page-title mt-1">Agendamentos</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <nav className="flex gap-0.5 rounded-lg bg-fundo p-0.5" aria-label="Visão">
            <Link href={url({ visao: 'lista' })} className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-rotulo font-semibold ${visao === 'lista' ? 'bg-white text-texto shadow-sm' : 'text-texto-2 hover:text-texto'}`}><List className="h-3.5 w-3.5" /> Lista</Link>
            <Link href={url({ visao: 'calendario' })} className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-rotulo font-semibold ${visao === 'calendario' ? 'bg-white text-texto shadow-sm' : 'text-texto-2 hover:text-texto'}`}><CalendarDays className="h-3.5 w-3.5" /> Calendário</Link>
          </nav>
          {listaConteudo[0] && <NovoPostDialog listaId={listaConteudo[0].id} maes={maes} clientes={todosClientes.filter((c) => !c.interno && c.status !== 'encerrado').map((c) => ({ id: c.id, nome: c.nome }))} />}
        </div>
      </div>
      <p className="text-rotulo text-texto-3">{proximos.length} para sair · {esperandoCliente.length} com o cliente · {atencao.length} pedindo atenção</p>
      {clientes.length > 1 && (
        <nav className="flex flex-wrap gap-1.5" aria-label="Filtrar por cliente">
          <Link href={url({ cliente: null })} className={chip(!filtro)}>Todos</Link>
          {clientes.map((c) => <Link key={c.id} href={url({ cliente: c.id })} className={chip(filtro === c.id)}>{c.nome}</Link>)}
        </nav>
      )}

      {visao === 'calendario' ? (
        <Calendario itens={itens} mes={mes} hoje={hoje} href={(m) => url({ mes: m })} />
      ) : itens.length === 0 ? (
        <EstadoVazio icone={CalendarClock} titulo="Nenhum post agendado" descricao='Abra um post da lista de conteúdo e use o bloco "Publicação no Instagram e Facebook".' />
      ) : (
        <div className="grid items-start gap-5 xl:grid-cols-2">
          <div className="space-y-5">
            {atencao.length > 0 && (
              <Modulo icone={AlertTriangle} titulo="Pedindo atenção" descricao="Falhou ao publicar ou o cliente pediu ajuste" perigo>
                <Lista itens={atencao} agora={agora} hoje={hoje} />
              </Modulo>
            )}
            <Modulo icone={Clock} titulo="Próximos" descricao="Prontos para sair (aprovados ou sem aprovação), na ordem">
              {proximos.length === 0 ? <p className="py-6 text-center text-rotulo text-texto-3">Nada na fila agora.</p> : (
                <div className="space-y-3">
                  {[...porDia.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([dia, lista]) => (
                    <div key={dia} className="space-y-1.5">
                      <p className="text-legenda font-semibold capitalize text-texto-2">{dia < hoje ? 'Atrasados (saem na próxima rodada)' : rotuloDia(dia, hoje)}</p>
                      <Lista itens={lista} agora={agora} soHora={dia >= hoje} hoje={hoje} />
                    </div>
                  ))}
                </div>
              )}
            </Modulo>
          </div>
          <div className="space-y-5">
            <Modulo icone={Hourglass} titulo="Aguardando o cliente" descricao="Enviados para aprovação no portal; publicam no horário depois do sim">
              {esperandoCliente.length === 0 ? <p className="py-6 text-center text-rotulo text-texto-3">Nenhum post esperando o cliente.</p> : <Lista itens={esperandoCliente} agora={agora} hoje={hoje} />}
            </Modulo>
            <Modulo icone={CheckCircle2} titulo="Publicados" descricao="Os 30 mais recentes">
              {publicados.length === 0 ? <p className="py-6 text-center text-rotulo text-texto-3">Nada publicado pela plataforma ainda.</p> : <Lista itens={publicados} agora={agora} hoje={hoje} />}
            </Modulo>
          </div>
        </div>
      )}
    </div>
  )
}
