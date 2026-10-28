import { ArrowRight, CalendarDays, ChevronRight, PartyPopper } from 'lucide-react'
import Link from 'next/link'
import { NomeCliente } from '@/componentes/NomeCliente'
import { dataLocal, gradeDoMes, horaLocal, ocorrencias, somarDias, type Ocorrencia } from '@/dominio/agenda'
import { dataDeHoje, lerFiltros } from '@/dominio/filtros'
import { feriadosDoAno, feriadosEntre } from '@/dominio/feriados'
import { grupoDePrazo } from '@/dominio/kanban'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { listarCompromissos } from '@/servicos/agenda'
import { eventosDoGoogle } from '@/servicos/google-agenda'
import { listarTarefas } from '@/servicos/tarefas'
import { BoasVindas } from './BoasVindas'
import { CircleCheck } from 'lucide-react'

const SEMANA = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D']
const DIAS_A_FRENTE = 14
const rotuloDia = (dia: string, hoje: string) => (dia === hoje ? 'Hoje' : dia === somarDias(hoje, 1) ? 'Amanhã' : formatar(dia, { day: '2-digit', month: 'short' }))
const formatar = (iso: string, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('pt-BR', { ...o, timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`)).replace('.', '')

export default async function Home() {
  const eu = await exigirEquipe()
  const hoje = dataDeHoje(new Date())
  const mes = hoje.slice(0, 7)
  const grade = gradeDoMes(mes)
  const ate = somarDias(hoje, DIAS_A_FRENTE)
  const [de, fim] = [grade[0] < hoje ? grade[0] : hoje, grade[grade.length - 1] > ate ? grade[grade.length - 1] : ate]

  const sb = await criarClienteServidor()
  const [todas, compromissos, doGoogle] = await Promise.all([
    listarTarefas(sb, { responsavelId: eu.id }, lerFiltros({}), hoje).catch(() => []),
    listarCompromissos(sb, de, fim).catch(() => []),
    eventosDoGoogle(eu.id, de, fim).catch(() => [] as Ocorrencia[]),
  ])

  const eventos = [...ocorrencias(compromissos, de, fim), ...doGoogle].sort((a, b) => a.inicio.localeCompare(b.inicio))
  const comEvento = new Set(eventos.map((e) => dataLocal(e.inicio)))
  const feriados = new Map([...feriadosDoAno(Number(mes.slice(0, 4)))])
  const proximos = eventos.filter((e) => dataLocal(e.fim) >= hoje && dataLocal(e.inicio) <= ate).slice(0, 8)
  const proximosFeriados = feriadosEntre(hoje, somarDias(hoje, 90)).slice(0, 3)

  const pendentes = todas.filter((t) => !t.concluidaEm)
  const grupos = pendentes.map((t) => ({ t, g: grupoDePrazo(t.prazo, t.concluidaEm, hoje) }))
  const atrasadas = grupos.filter((x) => x.g === 'atrasadas').length
  const paraHoje = grupos.filter((x) => x.g === 'hoje').length
  const semana = grupos.filter((x) => x.g === 'semana').length
  const emDia = pendentes.length ? Math.round(((pendentes.length - atrasadas) / pendentes.length) * 100) : 100
  const proxEvento = proximos[0]
  const proxFeriado = proximosFeriados[0]
  const diasAteFeriado = proxFeriado ? Math.round((Date.parse(proxFeriado.data) - Date.parse(hoje)) / 86_400_000) : 0
  const lista = pendentes
    .filter((t) => ['atrasadas', 'hoje', 'semana'].includes(grupoDePrazo(t.prazo, t.concluidaEm, hoje)))
    .sort((a, b) => (a.prazo ?? '9').localeCompare(b.prazo ?? '9'))
    .slice(0, 8)

  return (
    <div className="home-ui min-h-full p-4 md:p-6">
      <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-2">
        <div className="space-y-5">
          <BoasVindas nome={eu.nome} atrasadas={atrasadas} hoje={paraHoje} semana={semana} />

          <section className="rounded-[2rem] bg-[var(--h-claro)] p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="home-titulo">Tarefas pendentes</h2>
              <Link href="/inicio" aria-label="Ver todas as tarefas" className="flex h-9 w-9 items-center justify-center rounded-full border border-black/15 text-black/70 transition hover:bg-black/5"><ArrowRight className="h-4 w-4" /></Link>
            </div>
            <div className="flex items-center justify-between gap-4 rounded-[1.5rem] bg-[var(--h-verde)] p-5 text-black">
              <div>
                <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-white"><CircleCheck className="h-5 w-5" /></span>
                <p className="text-3xl font-medium leading-none">{emDia}%</p>
                <p className="mt-1 text-rotulo text-black/60">em dia · {pendentes.length} pendente{pendentes.length === 1 ? '' : 's'}</p>
              </div>
              <Medidor pct={emDia} total={pendentes.length} />
            </div>
            {lista.length === 0 ? (
              <p className="px-1 pt-4 text-corpo text-black/50">Nada urgente por enquanto. 🎉</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {lista.map((t) => {
                  const atrasada = !!t.prazo && t.prazo < hoje
                  return (
                    <li key={t.id}>
                      <Link href={`/tarefas/${t.id}`} className="flex items-center justify-between gap-3 rounded-2xl bg-white/70 px-4 py-2.5 transition hover:bg-white">
                        <span className="min-w-0">
                          <span className="block truncate text-corpo font-medium text-black">{t.titulo}</span>
                          <NomeCliente nome={t.clienteNome} className="text-rotulo" />
                        </span>
                        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-legenda font-medium ${atrasada ? 'bg-[var(--h-roxo)] text-white' : 'bg-black/5 text-black/60'}`}>
                          {t.prazo === hoje ? 'Hoje' : t.prazo ? formatar(t.prazo, { day: '2-digit', month: 'short' }) : ''}
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </div>

        <div className="space-y-5">
          <section className="rounded-[2rem] bg-[var(--h-claro)] p-5">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--h-preto)] text-white"><CalendarDays className="h-5 w-5" /></span>
              <div className="min-w-0">
                <p className="home-titulo">Próximo compromisso</p>
                <p className="truncate text-rotulo text-black/50">{proxEvento ? proxEvento.titulo : 'Nada marcado nos próximos dias'}</p>
              </div>
            </div>
            <Link href="/agenda" className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-black/10 px-4 py-3 text-rotulo text-black/80 transition hover:bg-black/15">
              <span className="tabular-nums">{proxEvento ? `${rotuloDia(dataLocal(proxEvento.inicio), hoje)} · ${proxEvento.diaInteiro ? 'Dia todo' : `${horaLocal(proxEvento.inicio)}–${horaLocal(proxEvento.fim)}`}` : 'Abrir a agenda'}</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </section>

          <section className="rounded-[2rem] bg-white p-5">
            <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_14.5rem]">
              <div>
                <div className="mb-5 flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--h-verde)] text-black"><CalendarDays className="h-4 w-4" /></span>
                  <h2 className="home-titulo">Agenda</h2>
                </div>
                {proximos.length === 0 ? (
                  <p className="text-corpo text-black/50">Nenhum compromisso nos próximos {DIAS_A_FRENTE} dias.</p>
                ) : (
                  <ol className="relative space-y-5 pl-8 before:absolute before:bottom-2 before:left-[0.4375rem] before:top-2 before:w-px before:bg-black/20">
                    {proximos.slice(0, 5).map((e, i, a) => (
                      <li key={e.id} className="relative">
                        <span className={`absolute -left-8 top-1 h-3.5 w-3.5 rounded-full border ${i === a.length - 1 ? 'border-black bg-black' : 'border-black/30 bg-white'}`} />
                        <p className="text-corpo font-medium text-black">{rotuloDia(dataLocal(e.inicio), hoje)}</p>
                        <p className="text-rotulo text-black/50"><span className="tabular-nums">{e.diaInteiro ? 'Dia todo' : horaLocal(e.inicio)}</span> · {e.titulo}</p>
                      </li>
                    ))}
                  </ol>
                )}
              </div>

              <div className="space-y-4">
                <div className="rounded-[1.5rem] bg-[var(--h-verde)] p-4 text-black">
                  <p className="flex items-center justify-between text-rotulo text-black/60">Próximo feriado <PartyPopper className="h-4 w-4" /></p>
                  <p className="mt-1 text-xl font-medium leading-tight">{proxFeriado?.nome ?? '—'}</p>
                  <p className="text-rotulo text-black/60">{proxFeriado ? (diasAteFeriado === 0 ? 'É hoje' : `em ${diasAteFeriado} dia${diasAteFeriado > 1 ? 's' : ''} · ${formatar(proxFeriado.data, { day: '2-digit', month: 'short' })}`) : ''}</p>
                  <div className="mt-3 h-3 rounded-full border border-black/40 p-px"><div className="h-full rounded-full bg-[repeating-linear-gradient(135deg,rgba(0,0,0,.55)_0_1px,transparent_1px_4px)]" style={{ width: `${Math.max(6, 100 - Math.min(90, diasAteFeriado) * (100 / 90))}%` }} /></div>
                </div>
                <div className="rounded-[1.5rem] bg-[var(--h-roxo)] p-4 text-white" aria-label="Calendário do mês">
                  <p className="mb-2 text-center text-rotulo font-medium capitalize">{formatar(`${mes}-01`, { month: 'long', year: 'numeric' })}</p>
                  <div className="grid grid-cols-7 gap-y-0.5 text-center text-legenda">
                    {SEMANA.map((d, i) => <span key={i} className="text-white/60">{d}</span>)}
                    {grade.map((dia) => {
                      const doMes = dia.startsWith(mes)
                      const feriado = feriados.get(dia)
                      return (
                        <span key={dia} title={feriado} className={`relative mx-auto flex h-6 w-6 items-center justify-center rounded-full tabular-nums ${dia === hoje ? 'bg-white font-semibold text-black' : doMes ? (feriado ? 'font-semibold text-[var(--h-verde)]' : '') : 'text-white/30'}`}>
                          {Number(dia.slice(8))}
                          {comEvento.has(dia) && <span className={`absolute -bottom-0.5 h-1 w-1 rounded-full ${dia === hoje ? 'bg-black' : 'bg-white'}`} />}
                        </span>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

/** Semicírculo: parte cheia em preto, o resto hachurado (referência do cartão "Current balance"). */
function Medidor({ pct, total }: { pct: number; total: number }) {
  const arco = 'M 24 104 A 76 76 0 0 1 176 104'
  return (
    <svg viewBox="0 0 200 116" className="h-auto w-44 shrink-0" role="img" aria-label={`${pct}% das tarefas em dia`}>
      <defs>
        <pattern id="hachura" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="rgba(0,0,0,.55)" strokeWidth="1.5" /></pattern>
      </defs>
      <path d={arco} fill="none" stroke="url(#hachura)" strokeWidth="26" strokeLinecap="round" />
      <path d={arco} pathLength={100} fill="none" stroke="#1a1a1a" strokeWidth="26" strokeLinecap="round" strokeDasharray={`${Math.max(0, pct - 1)} 100`} />
      <text x="100" y="108" textAnchor="middle" fontSize="26" fontWeight="500" fill="#000">{total}</text>
    </svg>
  )
}
