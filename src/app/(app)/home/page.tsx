import { CalendarDays, CheckSquare, PartyPopper } from 'lucide-react'
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

const SEMANA = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D']
const DIAS_A_FRENTE = 14
const formatar = (iso: string, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('pt-BR', { ...o, timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`)).replace('.', '')
const cartao = 'rounded-xl border border-borda bg-white p-4'

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
  const lista = pendentes
    .filter((t) => ['atrasadas', 'hoje', 'semana'].includes(grupoDePrazo(t.prazo, t.concluidaEm, hoje)))
    .sort((a, b) => (a.prazo ?? '9').localeCompare(b.prazo ?? '9'))
    .slice(0, 8)

  return (
    <div className="page-shell">
      <BoasVindas nome={eu.nome} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-4">
          <section className={cartao}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-corpo font-semibold text-texto"><CheckSquare className="h-4 w-4" /> Tarefas pendentes</h2>
              <Link href="/inicio" className="text-rotulo font-semibold text-texto-2 hover:text-texto">Ver todas ({pendentes.length})</Link>
            </div>
            <p className="mb-3 text-rotulo text-texto-3">
              {atrasadas > 0 && <span className="font-semibold text-perigo">{atrasadas} atrasada{atrasadas > 1 ? 's' : ''} · </span>}
              {paraHoje} para hoje
            </p>
            {lista.length === 0 ? (
              <p className="text-corpo text-texto-3">Nada urgente por enquanto. 🎉</p>
            ) : (
              <ul className="divide-y divide-borda">
                {lista.map((t) => {
                  const atrasada = !!t.prazo && t.prazo < hoje
                  return (
                    <li key={t.id}>
                      <Link href={`/tarefas/${t.id}`} className="flex items-center justify-between gap-3 py-2 hover:bg-hover">
                        <span className="min-w-0">
                          <span className="block truncate text-corpo text-texto">{t.titulo}</span>
                          <NomeCliente nome={t.clienteNome} className="text-rotulo" />
                        </span>
                        <span className={`shrink-0 text-rotulo ${atrasada ? 'font-semibold text-perigo' : 'text-texto-3'}`}>
                          {t.prazo === hoje ? 'Hoje' : t.prazo ? formatar(t.prazo, { day: '2-digit', month: 'short' }) : ''}
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          <section className={cartao}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-corpo font-semibold text-texto"><CalendarDays className="h-4 w-4" /> Próximos compromissos</h2>
              <Link href="/agenda" className="text-rotulo font-semibold text-texto-2 hover:text-texto">Abrir agenda</Link>
            </div>
            {proximos.length === 0 ? (
              <p className="text-corpo text-texto-3">Nenhum compromisso nos próximos {DIAS_A_FRENTE} dias.</p>
            ) : (
              <ul className="divide-y divide-borda">
                {proximos.map((e) => {
                  const dia = dataLocal(e.inicio)
                  return (
                    <li key={e.id} className="flex items-center gap-3 py-2">
                      <span className="w-16 shrink-0 text-rotulo font-semibold text-texto-2">{dia === hoje ? 'Hoje' : dia === somarDias(hoje, 1) ? 'Amanhã' : formatar(dia, { day: '2-digit', month: 'short' })}</span>
                      <span className="w-24 shrink-0 text-rotulo tabular-nums text-texto-3">{e.diaInteiro ? 'Dia todo' : `${horaLocal(e.inicio)}–${horaLocal(e.fim)}`}</span>
                      <span className="min-w-0 truncate text-corpo text-texto">{e.titulo}</span>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <section className={cartao} aria-label="Calendário do mês">
            <h2 className="mb-2 text-center text-corpo font-semibold capitalize text-texto">{formatar(`${mes}-01`, { month: 'long', year: 'numeric' })}</h2>
            <div className="grid grid-cols-7 gap-y-1 text-center text-rotulo">
              {SEMANA.map((d, i) => <span key={i} className="font-semibold text-texto-3">{d}</span>)}
              {grade.map((dia) => {
                const doMes = dia.startsWith(mes)
                const feriado = feriados.get(dia)
                return (
                  <span key={dia} title={feriado} className={`relative mx-auto flex h-8 w-8 items-center justify-center rounded-full tabular-nums ${dia === hoje ? 'bg-texto font-bold text-white' : doMes ? (feriado ? 'font-semibold text-perigo' : 'text-texto') : 'text-texto-3/50'}`}>
                    {Number(dia.slice(8))}
                    {comEvento.has(dia) && <span className={`absolute bottom-0.5 h-1 w-1 rounded-full ${dia === hoje ? 'bg-white' : 'bg-[#2a78d6]'}`} />}
                  </span>
                )
              })}
            </div>
            <p className="mt-3 flex items-center gap-3 text-[11px] text-texto-3"><span className="flex items-center gap-1"><i className="h-1.5 w-1.5 rounded-full bg-[#2a78d6]" /> compromisso</span><span className="flex items-center gap-1"><i className="h-1.5 w-1.5 rounded-full bg-perigo" /> feriado</span></p>
          </section>

          <section className={cartao}>
            <h2 className="mb-2 flex items-center gap-2 text-corpo font-semibold text-texto"><PartyPopper className="h-4 w-4" /> Próximos feriados</h2>
            <ul className="space-y-1.5">
              {proximosFeriados.map((f) => (
                <li key={f.data} className="flex items-center justify-between gap-3 text-rotulo">
                  <span className="truncate text-texto">{f.nome}</span>
                  <span className="shrink-0 text-texto-3">{f.data === hoje ? 'Hoje' : formatar(f.data, { day: '2-digit', month: 'short', weekday: 'short' })}</span>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  )
}
