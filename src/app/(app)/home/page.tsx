import { ArrowRight, CalendarDays, ChevronRight, CircleCheck, PartyPopper, TriangleAlert } from 'lucide-react'
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
const cartao = 'rounded-[2rem] bg-[var(--h-claro)] p-5'

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

  return (
    <div className="home-ui min-h-full p-4 md:p-6">
      <div className="grid w-full gap-5 lg:grid-cols-12">
        <div className="lg:col-span-12 xl:col-span-5"><BoasVindas nome={eu.nome} atrasadas={atrasadas} hoje={paraHoje} semana={semana} /></div>

        <section className={`${cartao} lg:col-span-7 xl:col-span-4`}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="home-titulo">Minhas tarefas</h2>
            <Link href="/inicio" aria-label="Ver todas as tarefas" className="flex h-9 w-9 items-center justify-center rounded-full border border-black/15 text-black/70 transition hover:bg-black/5"><ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-[1.5rem] bg-[var(--h-vermelho)] p-5 text-white">
            <div>
              <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-[var(--h-vermelho)]"><CircleCheck className="h-5 w-5" /></span>
              <p className="text-3xl font-medium leading-none">{emDia}%</p>
              <p className="mt-1 text-rotulo text-white/75">em dia · {pendentes.length} pendente{pendentes.length === 1 ? '' : 's'}</p>
            </div>
            <Medidor pct={emDia} total={pendentes.length} />
          </div>
          {lista.length === 0 ? (
            <p className="px-1 pt-4 text-corpo text-black/50">Nada urgente por enquanto.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {lista.map((t) => {
                const atrasada = !!t.prazo && t.prazo < hoje
                return (
                  <li key={t.id}>
                    <Link href={`/tarefas/${t.id}`} className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-2.5 transition hover:bg-black/5">
                      <span className="min-w-0">
                        <span className="block truncate text-corpo font-medium text-black">{t.titulo}</span>
                        <NomeCliente nome={t.clienteNome} className="text-rotulo" />
                      </span>
                      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-legenda font-medium ${atrasada ? 'bg-[var(--h-vermelho)] text-white' : 'bg-black/5 text-black/60'}`}>
                        {t.prazo === hoje ? 'Hoje' : t.prazo ? formatar(t.prazo, { day: '2-digit', month: 'short' }) : ''}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section className={`${cartao} bg-white ring-1 ring-black/10 lg:col-span-5 xl:col-span-3`}>
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black text-white"><CalendarDays className="h-4 w-4" /></span>
              <h2 className="home-titulo">Agenda</h2>
            </div>
            <Link href="/agenda" aria-label="Abrir a agenda" className="flex h-9 w-9 items-center justify-center rounded-full border border-black/15 text-black/70 transition hover:bg-black/5"><ChevronRight className="h-4 w-4" /></Link>
          </div>
          {proximos.length === 0 ? (
            <p className="text-corpo text-black/50">Nenhum compromisso nos próximos {DIAS_A_FRENTE} dias.</p>
          ) : (
            <ol className="relative space-y-5 pl-8 before:absolute before:bottom-2 before:left-[0.4375rem] before:top-2 before:w-px before:bg-black/20">
              {proximos.map((e, i) => (
                <li key={e.id} className="relative">
                  <span className={`absolute -left-8 top-1 h-3.5 w-3.5 rounded-full border ${i === 0 ? 'border-[var(--h-vermelho)] bg-[var(--h-vermelho)]' : 'border-black/30 bg-white'}`} />
                  <p className="text-corpo font-medium text-black">{rotuloDia(dataLocal(e.inicio), hoje)}</p>
                  <p className="text-rotulo text-black/50"><span className="tabular-nums">{e.diaInteiro ? 'Dia todo' : horaLocal(e.inicio)}</span> · {e.titulo}</p>
                </li>
              ))}
            </ol>
          )}
        </section>

        <div className="lg:col-span-12 xl:col-span-8">
          <Suspense fallback={<ResumoMesCarregando />}>
            <ResumoMes clientes={ativos} mes={mes} hoje={hoje} />
          </Suspense>
        </div>

        <section className={`${cartao} lg:col-span-12 xl:col-span-4`}>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-[1.5rem] bg-black p-4 text-white" aria-label="Calendário do mês">
              <p className="mb-2 text-center text-rotulo font-medium capitalize">{formatar(`${mes}-01`, { month: 'long', year: 'numeric' })}</p>
              <div className="grid grid-cols-7 gap-y-0.5 text-center text-legenda">
                {SEMANA.map((d, i) => <span key={i} className="text-white/50">{d}</span>)}
                {grade.map((dia) => {
                  const doMes = dia.startsWith(mes)
                  const feriado = feriados.get(dia)
                  return (
                    <span key={dia} title={feriado} className={`relative mx-auto flex h-7 w-7 items-center justify-center rounded-full tabular-nums ${dia === hoje ? 'bg-[var(--h-vermelho)] font-semibold text-white' : doMes ? (feriado ? 'font-semibold text-[#ff6b6f]' : '') : 'text-white/25'}`}>
                      {Number(dia.slice(8))}
                      {comEvento.has(dia) && <span className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-white" />}
                    </span>
                  )
                })}
              </div>
            </div>
            <div className="rounded-[1.5rem] bg-white p-4 text-black">
              <p className="flex items-center justify-between text-rotulo text-black/50">Próximo feriado <PartyPopper className="h-4 w-4" /></p>
              <p className="mt-1 text-xl font-medium leading-tight">{proxFeriado?.nome ?? '—'}</p>
              <p className="text-rotulo text-black/50">{proxFeriado ? (diasAteFeriado === 0 ? 'É hoje' : `em ${diasAteFeriado} dia${diasAteFeriado > 1 ? 's' : ''} · ${formatar(proxFeriado.data, { day: '2-digit', month: 'short' })}`) : ''}</p>
              <div className="mt-3 h-2.5 rounded-full bg-black/10"><div className="h-full rounded-full bg-[var(--h-vermelho)]" style={{ width: `${Math.max(6, 100 - Math.min(90, diasAteFeriado) * (100 / 90))}%` }} /></div>
            </div>
          </div>
        </section>

        <section className={`${cartao} bg-white ring-1 ring-black/10 lg:col-span-7 xl:col-span-8`}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="home-titulo">Panorama dos clientes</h2>
              <p className="text-rotulo text-black/50">{ativos.length} ativo{ativos.length === 1 ? '' : 's'}{pausados ? ` · ${pausados} pausado${pausados > 1 ? 's' : ''}` : ''} · tarefas por cliente</p>
            </div>
            <Link href="/clientes" className="rounded-full border border-black/15 px-3.5 py-1 text-rotulo text-black/70 transition hover:bg-black/5">Clientes</Link>
          </div>
          {clientesEmFoco.length === 0 ? (
            <p className="text-corpo text-black/50">Sem tarefas de clientes para mostrar.</p>
          ) : (
            <div className="space-y-2">
              {clientesEmFoco.map((l) => {
                const c = clientes.find((x) => x.id === l.id)
                const pronto = l.total ? Math.round((l.concluidas / l.total) * 100) : 0
                return (
                  <div key={l.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5 rounded-2xl bg-[var(--h-claro)] px-4 py-3 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)_auto]">
                    <NomeCliente nome={l.nome} href={`/clientes/${l.id}`} className="truncate" />
                    <div className="order-last col-span-2 sm:order-none sm:col-span-1" title={`${pronto}% concluído`}>
                      <div className="h-2 overflow-hidden rounded-full bg-black/10"><div className="h-full rounded-full bg-black" style={{ width: `${pronto}%` }} /></div>
                    </div>
                    <p className="flex items-center gap-2 text-legenda tabular-nums text-black/60">
                      <span>{l.total} tarefas</span>
                      <span>{l.emAndamento} em andamento</span>
                      <span className={`rounded-full px-2 py-0.5 font-medium ${l.atrasadas ? 'bg-[var(--h-vermelho)] text-white' : 'bg-black/5'}`}>{l.atrasadas} atrasada{l.atrasadas === 1 ? '' : 's'}</span>
                      {c && c.status !== 'ativo' && <span className="rounded-full bg-black/10 px-2 py-0.5">{ROTULO_STATUS_CLIENTE[c.status]}</span>}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <section className={`${cartao} lg:col-span-5 xl:col-span-4`}>
          <h2 className="home-titulo mb-4 flex items-center gap-2"><TriangleAlert className="h-4 w-4 text-[var(--h-vermelho)]" /> Pontos de atenção</h2>
          {atencao.length === 0 ? (
            <p className="text-corpo text-black/50">Tudo em ordem por aqui.</p>
          ) : (
            <ul className="space-y-2">
              {atencao.map((a, i) => (
                <li key={i}>
                  <Link href={a.href} className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 text-corpo text-black/80 transition hover:bg-black/5">
                    <span>{a.texto}</span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-black/40" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}

/** Semicírculo: parte cheia em preto, o resto hachurado. */
function Medidor({ pct, total }: { pct: number; total: number }) {
  const arco = 'M 24 104 A 76 76 0 0 1 176 104'
  return (
    <svg viewBox="0 0 200 116" className="h-auto w-40 shrink-0" role="img" aria-label={`${pct}% das tarefas em dia`}>
      <defs>
        <pattern id="hachura" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="rgba(255,255,255,.55)" strokeWidth="1.5" /></pattern>
      </defs>
      <path d={arco} fill="none" stroke="url(#hachura)" strokeWidth="26" strokeLinecap="round" />
      <path d={arco} pathLength={100} fill="none" stroke="#111" strokeWidth="26" strokeLinecap="round" strokeDasharray={`${Math.max(0, pct - 1)} 100`} />
      <text x="100" y="108" textAnchor="middle" fontSize="26" fontWeight="500" fill="#fff">{total}</text>
    </svg>
  )
}
