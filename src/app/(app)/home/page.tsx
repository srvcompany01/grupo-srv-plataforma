import { ArrowRight, ChevronRight, PartyPopper, TriangleAlert } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'
import { Ic } from '@/componentes/app/Ic'
import { ChipCliente, NomeCliente } from '@/componentes/NomeCliente'
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
    { rotulo: 'Minhas tarefas abertas', valor: pendentes.length, meta: `${paraHoje} para hoje`, href: '/inicio', vermelho: false, icone: 'task_alt', cor: '#1d6fe0' },
    { rotulo: 'Em atraso', valor: atrasadas, meta: `${atrasadasDaOperacao} na operação`, href: '/inicio', vermelho: atrasadas > 0, icone: 'schedule', cor: '#d80d12' },
    { rotulo: 'Aguardando aprovação', valor: aguardando.length, meta: 'em todos os clientes', href: '/painel-de-gestao', vermelho: false, icone: 'fact_check', cor: '#8b5cf6' },
    { rotulo: 'Reuniões hoje', valor: reunioesHoje.length, meta: reunioesHoje[0] ? `próxima às ${horaLocal(reunioesHoje[0].inicio)}` : 'nenhuma agendada', href: '/reunioes', vermelho: false, icone: 'videocam', cor: '#0d9488' },
  ]

  return (
    <div>
      <header>
        <h1><Ic n="home" s={16} style={{ color: 'var(--text-2)' }} /> Home</h1>
        <span>{formatar(hoje, { weekday: 'long', day: 'numeric', month: 'long' })}</span>
      </header>
      <div>
        <BoasVindas nome={eu.nome} atrasadas={atrasadas} hoje={paraHoje} semana={semana} />

        <div>
          {blocos.map((b) => (
            <Link key={b.rotulo} href={b.href}>
              <p><span style={{ background: b.cor }}><Ic n={b.icone} s={14} fill /></span><span>{b.rotulo}</span></p>
              <p>{b.valor}</p>
              <p>{b.meta}</p>
            </Link>
          ))}
        </div>

        {atencao.length > 0 && (
          <ul>
            {atencao.map((a, i) => (
              <li key={i}><Link href={a.href}><TriangleAlert />{a.texto}</Link></li>
            ))}
          </ul>
        )}

        <div>
          <section>
            <div>
              <h2>Panorama dos clientes</h2>
              <Link href="/clientes">Ver Clientes</Link>
            </div>
            {clientesEmFoco.length === 0 ? (
              <p>Sem tarefas de clientes para mostrar.</p>
            ) : (
              <div>
                <div>
                  <div>
                    <span>Cliente</span><span>Responsável</span><span>Abertas</span><span>Em atraso</span><span>Aprovação</span><span>Próx. entrega</span><span>Progresso do mês</span>
                  </div>
                  {clientesEmFoco.map((l) => {
                    const c = clientes.find((x) => x.id === l.id)
                    const pronto = l.total ? Math.round((l.concluidas / l.total) * 100) : 0
                    const prox = proximaEntrega(l.id)
                    return (
                      <Link key={l.id} href={`/clientes/${l.id}`}>
                        <span><NomeCliente nome={l.nome} />{c && c.status !== 'ativo' && <span>{ROTULO_STATUS_CLIENTE[c.status]}</span>}</span>
                        <span>{responsavelDe(l.id)}</span>
                        <span>{l.total - l.concluidas}</span>
                        <span>{l.atrasadas}</span>
                        <span>{aprovacaoDe(l.id)}</span>
                        <span>{prox ? formatar(prox, { day: '2-digit', month: 'short' }) : '—'}</span>
                        <span title={`${pronto}% concluído`}>
                          <span><span style={{ width: `${pronto}%` }} /></span>
                          <span>{pronto}%</span>
                        </span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}
          </section>

          <div>
            <section>
              <div>
                <h2>Agenda de hoje</h2>
                <Link href="/agenda" aria-label="Abrir a agenda"><ChevronRight /></Link>
              </div>
              {proximos.length === 0 ? (
                <p>Nenhum compromisso nos próximos {DIAS_A_FRENTE} dias.</p>
              ) : (
                <ul>
                  {proximos.map((e) => (
                    <li key={e.id}>
                      <span>{e.diaInteiro ? 'Dia todo' : horaLocal(e.inicio)}</span>
                      <span><span>{e.titulo}</span><span>{rotuloDia(dataLocal(e.inicio), hoje)}</span></span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <div>
                <h2>Minhas tarefas</h2>
                <Link href="/inicio" aria-label="Ver todas as tarefas"><ArrowRight /></Link>
              </div>
              {lista.length === 0 ? (
                <p>Nada urgente por enquanto.</p>
              ) : (
                <ul>
                  {lista.map((t) => {
                    const atrasada = !!t.prazo && t.prazo < hoje
                    return (
                      <li key={t.id}>
                        <Link href={`/tarefas/${t.id}`}>
                          <span />
                          <span>{t.titulo}</span>
                          <ChipCliente nome={t.clienteNome} />
                          <span>{t.prazo === hoje ? 'Hoje' : t.prazo ? formatar(t.prazo, { day: '2-digit', month: 'short' }) : ''}</span>
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

        <section aria-label="Calendário do mês">
          <div>
            <div>
              <p>{formatar(`${mes}-01`, { month: 'long', year: 'numeric' })}</p>
              <div>
                {SEMANA.map((d, i) => <span key={i}>{d}</span>)}
                {grade.map((dia) => {
                  const doMes = dia.startsWith(mes)
                  const feriado = feriados.get(dia)
                  return (
                    <span key={dia} title={feriado}>
                      {Number(dia.slice(8))}
                      {comEvento.has(dia) && <span />}
                    </span>
                  )
                })}
              </div>
            </div>
            <div>
              <p><PartyPopper /> Próximo feriado</p>
              <p>{proxFeriado?.nome ?? '—'}</p>
              <p>{proxFeriado ? (diasAteFeriado === 0 ? 'É hoje' : `em ${diasAteFeriado} dia${diasAteFeriado > 1 ? 's' : ''} · ${formatar(proxFeriado.data, { day: '2-digit', month: 'short' })}`) : ''}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

