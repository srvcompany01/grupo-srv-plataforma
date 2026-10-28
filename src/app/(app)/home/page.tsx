import { ArrowRight, ChevronRight, PartyPopper, TriangleAlert } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'
import { NomeCliente } from '@/componentes/NomeCliente'
import { dataLocal, gradeDoMes, horaLocal, ocorrencias, somarDias, type Ocorrencia } from '@/dominio/agenda'
import { dataDeHoje, lerFiltros } from '@/dominio/filtros'
import { feriadosDoAno, feriadosEntre } from '@/dominio/feriados'
import { grupoDePrazo } from '@/dominio/kanban'
import { resumirPor } from '@/dominio/resumo'
import type { Categoria } from '@/dominio/tarefas'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { listarCompromissos } from '@/servicos/agenda'
import { listarClientes, ROTULO_STATUS_CLIENTE } from '@/servicos/clientes-plataforma'
import { eventosDoGoogle } from '@/servicos/google-agenda'
import { statusDasListas } from '@/servicos/listas'
import { listarTarefas } from '@/servicos/tarefas'
import { BoasVindas } from './BoasVindas'
import { ResumoMes, ResumoMesCarregando } from './ResumoMes'

const SEMANA = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D']
const DIAS_A_FRENTE = 14
const formatar = (iso: string, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('pt-BR', { ...o, timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`)).replace('.', '')
const rotuloDia = (dia: string, hoje: string) => (dia === hoje ? 'Hoje' : dia === somarDias(hoje, 1) ? 'Amanhã' : formatar(dia, { day: '2-digit', month: 'short' }))

export default async function Home() {
  const eu = await exigirEquipe()
  const hoje = dataDeHoje(new Date())
  const mes = hoje.slice(0, 7)
  const grade = gradeDoMes(mes)
  const ate = somarDias(hoje, DIAS_A_FRENTE)
  const [de, fim] = [grade[0] < hoje ? grade[0] : hoje, grade[grade.length - 1] > ate ? grade[grade.length - 1] : ate]

  const sb = await criarClienteServidor()
  const [minhas, compromissos, doGoogle, clientes, todasTarefas] = await Promise.all([
    listarTarefas(sb, { responsavelId: eu.id }, lerFiltros({}), hoje).catch(() => []),
    listarCompromissos(sb, de, fim).catch(() => []),
    eventosDoGoogle(eu.id, de, fim).catch(() => [] as Ocorrencia[]),
    listarClientes(sb).catch(() => []),
    listarTarefas(sb, { todas: true }, lerFiltros({}), hoje).catch(() => []),
  ])
  const statusPorLista = await statusDasListas(sb, [...new Set(todasTarefas.map((t) => t.listaId))]).catch(() => ({} as Awaited<ReturnType<typeof statusDasListas>>))
  const categoria = (t: { listaId: string; statusId: string }): Categoria => statusPorLista[t.listaId]?.find((s) => s.id === t.statusId)?.categoria ?? 'todo'

  // Agenda e calendário.
  const eventos = [...ocorrencias(compromissos, de, fim), ...doGoogle].sort((a, b) => a.inicio.localeCompare(b.inicio))
  const comEvento = new Set(eventos.map((e) => dataLocal(e.inicio)))
  const feriados = feriadosDoAno(Number(mes.slice(0, 4)))
  const proximos = eventos.filter((e) => dataLocal(e.fim) >= hoje && dataLocal(e.inicio) <= ate).slice(0, 6)
  const doDia = proximos.filter((e) => dataLocal(e.inicio) === hoje).length
  const proxFeriado = feriadosEntre(hoje, somarDias(hoje, 120))[0]
  const diasAteFeriado = proxFeriado ? Math.round((Date.parse(proxFeriado.data) - Date.parse(hoje)) / 86_400_000) : 0

  // Minhas tarefas.
  const pendentes = minhas.filter((t) => !t.concluidaEm)
  const prazo = (t: (typeof pendentes)[number]) => grupoDePrazo(t.prazo, t.concluidaEm, hoje)
  const atrasadas = pendentes.filter((t) => prazo(t) === 'atrasadas').length
  const paraHoje = pendentes.filter((t) => prazo(t) === 'hoje').length
  const semana = pendentes.filter((t) => prazo(t) === 'semana').length
  const emDia = pendentes.length ? Math.round(((pendentes.length - atrasadas) / pendentes.length) * 100) : 100
  const lista = pendentes.filter((t) => ['atrasadas', 'hoje', 'semana'].includes(prazo(t))).sort((a, b) => (a.prazo ?? '9').localeCompare(b.prazo ?? '9')).slice(0, 6)

  // Panorama dos clientes: tarefas de toda a operação por cliente.
  const porCliente = resumirPor(todasTarefas.filter((t) => !t.paiId), (t) => ({ id: t.clienteId, nome: t.clienteNome }), categoria, hoje)
  const ativos = clientes.filter((c) => c.status === 'ativo' && !c.interno)
  const pausados = clientes.filter((c) => c.status === 'pausado' && !c.interno).length
  const tarefasDeCliente = porCliente.filter((l) => clientes.some((c) => c.id === l.id && !c.interno))
  const clientesEmFoco = [...tarefasDeCliente].sort((a, b) => b.atrasadas - a.atrasadas || b.total - a.total).slice(0, 6)
  const atrasadasDaOperacao = tarefasDeCliente.reduce((s, l) => s + l.atrasadas, 0)
  const clientesComAtraso = tarefasDeCliente.filter((l) => l.atrasadas > 0)

  const atencao: { texto: React.ReactNode; href: string }[] = [
    ...(atrasadas ? [{ texto: <>Você tem <b>{atrasadas}</b> tarefa{atrasadas > 1 ? 's' : ''} atrasada{atrasadas > 1 ? 's' : ''}.</>, href: '/inicio' }] : []),
    ...(doDia ? [{ texto: <><b>{doDia}</b> compromisso{doDia > 1 ? 's' : ''} hoje na agenda.</>, href: '/agenda' }] : []),
    ...(clientesComAtraso.length ? [{ texto: <><b>{clientesComAtraso.length}</b> cliente{clientesComAtraso.length > 1 ? 's' : ''} com tarefas atrasadas ({atrasadasDaOperacao} no total).</>, href: '/painel-de-gestao' }] : []),
    ...(pausados ? [{ texto: <><b>{pausados}</b> cliente{pausados > 1 ? 's' : ''} pausado{pausados > 1 ? 's' : ''}.</>, href: '/clientes' }] : []),
  ]

  // Blocos de resumo e colunas extras do panorama.
  const nomeStatus = (t: { listaId: string; statusId: string }) => statusPorLista[t.listaId]?.find((s) => s.id === t.statusId)?.nome ?? ''
  const abertasTodas = todasTarefas.filter((t) => !t.paiId && !t.concluidaEm && categoria(t) !== 'done')
  const aguardando = abertasTodas.filter((t) => /aprova/i.test(nomeStatus(t)) && !/aprovado/i.test(nomeStatus(t)))
  const aprovacaoDe = (id: string) => aguardando.filter((t) => t.clienteId === id).length
  const proximaEntrega = (id: string) => abertasTodas.filter((t) => t.clienteId === id && t.prazo && t.prazo >= hoje).map((t) => t.prazo as string).sort()[0]
  const responsavelDe = (id: string) => {
    const cont = new Map<string, { nome: string; n: number }>()
    for (const t of abertasTodas.filter((x) => x.clienteId === id)) for (const r of t.responsaveis) cont.set(r.id, { nome: r.nome, n: (cont.get(r.id)?.n ?? 0) + 1 })
    return [...cont.values()].sort((a, b) => b.n - a.n)[0]?.nome ?? '—'
  }
  const reunioesHoje = eventos.filter((e) => dataLocal(e.inicio) === hoje)
  const blocos = [
    { rotulo: 'Minhas tarefas abertas', valor: pendentes.length, meta: `${paraHoje} para hoje`, href: '/inicio', vermelho: false },
    { rotulo: 'Em atraso', valor: atrasadas, meta: `${atrasadasDaOperacao} na operação`, href: '/inicio', vermelho: atrasadas > 0 },
    { rotulo: 'Aguardando aprovação', valor: aguardando.length, meta: 'em todos os clientes', href: '/painel-de-gestao', vermelho: false },
    { rotulo: 'Reuniões hoje', valor: reunioesHoje.length, meta: reunioesHoje[0] ? `próxima às ${horaLocal(reunioesHoje[0].inicio)}` : 'nenhuma agendada', href: '/reunioes', vermelho: false },
  ]
  const cab = 'sticky top-0 z-10 flex h-10 items-center justify-between border-b border-borda-fraca bg-white px-3'

  return (
    <div className="home-ui min-h-full">
      <header className={cab}>
        <h1 className="text-destaque font-semibold">Home</h1>
        <span className="text-rotulo capitalize text-texto-3">{formatar(hoje, { weekday: 'long', day: 'numeric', month: 'long' })}</span>
      </header>
      <div className="mx-auto flex max-w-[1240px] flex-col gap-4 px-5 pb-12 pt-4 max-md:px-3">
        <BoasVindas nome={eu.nome} atrasadas={atrasadas} hoje={paraHoje} semana={semana} />

        <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-2">
          {blocos.map((b) => (
            <Link key={b.rotulo} href={b.href} className="rounded-lg border border-borda px-3 py-2.5 transition-colors hover:border-borda-forte">
              <p className="text-rotulo text-texto-2">{b.rotulo}</p>
              <p className={`text-xl font-semibold tabular-nums ${b.vermelho ? 'text-[var(--red)]' : ''}`}>{b.valor}</p>
              <p className="text-rotulo text-texto-3">{b.meta}</p>
            </Link>
          ))}
        </div>

        {atencao.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {atencao.map((a, i) => (
              <li key={i}><Link href={a.href} className="inline-flex h-7 items-center gap-1.5 rounded-md border border-borda px-2.5 text-rotulo text-texto-2 transition-colors hover:bg-hover"><TriangleAlert className="h-3.5 w-3.5 text-[var(--red)]" />{a.texto}</Link></li>
            ))}
          </ul>
        )}

        <div className="grid gap-4 lg:grid-cols-[1.7fr_minmax(300px,1fr)]">
          <section className="min-w-0 rounded-lg border border-borda">
            <div className="flex h-10 items-center justify-between px-3">
              <h2 className="text-corpo font-semibold">Panorama dos clientes</h2>
              <Link href="/clientes" className="inline-flex h-6 items-center rounded px-2 text-rotulo text-texto-2 hover:bg-hover">Ver Clientes</Link>
            </div>
            {clientesEmFoco.length === 0 ? (
              <p className="px-3 pb-3 text-corpo text-texto-3">Sem tarefas de clientes para mostrar.</p>
            ) : (
              <div className="overflow-x-auto">
                <div className="min-w-[680px]">
                  <div className="grid h-7 grid-cols-[minmax(140px,1.4fr)_minmax(90px,1fr)_64px_76px_80px_96px_minmax(100px,1fr)] items-center border-y border-borda-fraca bg-[var(--bg-subtle)] px-3 text-[11px] font-medium text-texto-3">
                    <span>Cliente</span><span>Responsável</span><span>Abertas</span><span>Em atraso</span><span>Aprovação</span><span>Próx. entrega</span><span>Progresso do mês</span>
                  </div>
                  {clientesEmFoco.map((l) => {
                    const c = clientes.find((x) => x.id === l.id)
                    const pronto = l.total ? Math.round((l.concluidas / l.total) * 100) : 0
                    const prox = proximaEntrega(l.id)
                    return (
                      <Link key={l.id} href={`/clientes/${l.id}`} className="grid h-9 grid-cols-[minmax(140px,1.4fr)_minmax(90px,1fr)_64px_76px_80px_96px_minmax(100px,1fr)] items-center border-b border-borda-fraca px-3 text-corpo transition-colors last:border-b-0 hover:bg-hover">
                        <span className="min-w-0 truncate"><NomeCliente nome={l.nome} className="truncate" />{c && c.status !== 'ativo' && <span className="ml-1.5 text-legenda text-texto-3">{ROTULO_STATUS_CLIENTE[c.status]}</span>}</span>
                        <span className="truncate text-texto-2">{responsavelDe(l.id)}</span>
                        <span className="tabular-nums">{l.total - l.concluidas}</span>
                        <span className={`tabular-nums ${l.atrasadas ? 'font-semibold text-[var(--red)]' : 'text-texto-3'}`}>{l.atrasadas}</span>
                        <span className="tabular-nums text-texto-2">{aprovacaoDe(l.id)}</span>
                        <span className="text-texto-2">{prox ? formatar(prox, { day: '2-digit', month: 'short' }) : '—'}</span>
                        <span className="flex items-center gap-2" title={`${pronto}% concluído`}>
                          <span className="h-1 flex-1 overflow-hidden rounded-full bg-[var(--bg-active)]"><span className="block h-full rounded-full bg-texto" style={{ width: `${pronto}%` }} /></span>
                          <span className="w-8 text-right text-rotulo tabular-nums text-texto-2">{pronto}%</span>
                        </span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}
          </section>

          <div className="flex min-w-0 flex-col gap-4">
            <section className="rounded-lg border border-borda">
              <div className="flex h-10 items-center justify-between px-3">
                <h2 className="text-corpo font-semibold">Agenda de hoje</h2>
                <Link href="/agenda" aria-label="Abrir a agenda" className="flex h-6 w-6 items-center justify-center rounded text-texto-2 hover:bg-hover"><ChevronRight className="h-4 w-4" /></Link>
              </div>
              {proximos.length === 0 ? (
                <p className="px-3 pb-3 text-corpo text-texto-3">Nenhum compromisso nos próximos {DIAS_A_FRENTE} dias.</p>
              ) : (
                <ul>
                  {proximos.map((e) => (
                    <li key={e.id} className="flex items-baseline gap-3 border-t border-borda-fraca px-3 py-2">
                      <span className="w-14 shrink-0 text-rotulo font-semibold tabular-nums">{e.diaInteiro ? 'Dia todo' : horaLocal(e.inicio)}</span>
                      <span className="min-w-0"><span className="block truncate text-corpo">{e.titulo}</span><span className="text-rotulo text-texto-3">{rotuloDia(dataLocal(e.inicio), hoje)}</span></span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-lg border border-borda">
              <div className="flex h-10 items-center justify-between px-3">
                <h2 className="text-corpo font-semibold">Minhas tarefas</h2>
                <Link href="/inicio" aria-label="Ver todas as tarefas" className="flex h-6 w-6 items-center justify-center rounded text-texto-2 hover:bg-hover"><ArrowRight className="h-4 w-4" /></Link>
              </div>
              {lista.length === 0 ? (
                <p className="px-3 pb-3 text-corpo text-texto-3">Nada urgente por enquanto.</p>
              ) : (
                <ul>
                  {lista.map((t) => {
                    const atrasada = !!t.prazo && t.prazo < hoje
                    return (
                      <li key={t.id}>
                        <Link href={`/tarefas/${t.id}`} className="flex h-9 items-center gap-2 border-t border-borda-fraca px-3 transition-colors hover:bg-hover">
                          <span className="h-3.5 w-3.5 shrink-0 rounded-full border-2 border-[var(--border-strong)]" />
                          <span className="min-w-0 flex-1 truncate text-corpo">{t.titulo}</span>
                          <NomeCliente nome={t.clienteNome} className="shrink-0 text-rotulo" />
                          <span className={`w-14 shrink-0 text-right text-rotulo ${atrasada ? 'text-[var(--red)]' : 'text-texto-3'}`}>{t.prazo === hoje ? 'Hoje' : t.prazo ? formatar(t.prazo, { day: '2-digit', month: 'short' }) : ''}</span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
          </div>
        </div>

        <Suspense fallback={<ResumoMesCarregando />}>
          <ResumoMes clientes={ativos} mes={mes} hoje={hoje} />
        </Suspense>

        <section className="rounded-lg border border-borda p-3" aria-label="Calendário do mês">
          <div className="grid gap-4 sm:grid-cols-[minmax(0,320px)_1fr]">
            <div>
              <p className="mb-1 text-center text-corpo font-semibold capitalize">{formatar(`${mes}-01`, { month: 'long', year: 'numeric' })}</p>
              <div className="grid grid-cols-7 gap-y-0.5 text-center text-rotulo">
                {SEMANA.map((d, i) => <span key={i} className="text-texto-3">{d}</span>)}
                {grade.map((dia) => {
                  const doMes = dia.startsWith(mes)
                  const feriado = feriados.get(dia)
                  return (
                    <span key={dia} title={feriado} className={`relative mx-auto flex h-7 w-7 items-center justify-center rounded-full tabular-nums ${dia === hoje ? 'bg-[#d80d12] font-semibold text-white' : doMes ? (feriado ? 'font-semibold text-[var(--client)]' : '') : 'text-texto-3/50'}`}>
                      {Number(dia.slice(8))}
                      {comEvento.has(dia) && <span className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-texto-3" />}
                    </span>
                  )
                })}
              </div>
            </div>
            <div className="self-center">
              <p className="flex items-center gap-1.5 text-rotulo text-texto-3"><PartyPopper className="h-3.5 w-3.5" /> Próximo feriado</p>
              <p className="text-destaque font-semibold">{proxFeriado?.nome ?? '—'}</p>
              <p className="text-rotulo text-texto-3">{proxFeriado ? (diasAteFeriado === 0 ? 'É hoje' : `em ${diasAteFeriado} dia${diasAteFeriado > 1 ? 's' : ''} · ${formatar(proxFeriado.data, { day: '2-digit', month: 'short' })}`) : ''}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

