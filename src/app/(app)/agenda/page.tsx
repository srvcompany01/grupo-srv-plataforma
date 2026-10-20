import { CalendarDays, ChevronLeft, ChevronRight, Lock, UserCheck, Users } from 'lucide-react'
import Link from 'next/link'
import { BotaoGoogle } from '@/componentes/agenda/BotaoGoogle'
import { CompromissoDialog } from '@/componentes/agenda/CompromissoDialog'
import { dataLocal, gradeDoMes, horaLocal, ocorrencias, semanaDe, somarDias, type Ocorrencia } from '@/dominio/agenda'
import { lerMes, mesVizinho } from '@/dominio/financeiro'
import { dataDeHoje } from '@/dominio/filtros'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { listarCompromissos, listarTagsAgenda } from '@/servicos/agenda'
import { listarClientes } from '@/servicos/clientes-plataforma'
import { eventosDoGoogle, googleConfigurado, statusGoogle } from '@/servicos/google-agenda'
import { listarEquipe } from '@/servicos/usuarios'

const textoParam = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)
const DATA = /^\d{4}-\d{2}-\d{2}$/
const nomeDia = (iso: string) => new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`)).replace('.', '')
const AVISO_GOOGLE: Record<string, string> = {
  ok: 'Google Agenda conectado. Seus compromissos já foram enviados para lá.',
  cancelado: 'Conexão com o Google cancelada.',
  erro: 'Não foi possível conectar o Google Agenda. Tente de novo.',
  'sem-config': 'A integração com o Google ainda não foi configurada (GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET).',
}
const ICONE = { privado: Lock, equipe: Users, selecionados: UserCheck }
const nomeMes = (mes: string) => new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${mes}-01T00:00:00Z`))
const SEMANA = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
const horario = (o: Ocorrencia) => (o.diaInteiro ? 'Dia todo' : `${horaLocal(o.inicio)}–${horaLocal(o.fim)}`)

export default async function Agenda({ searchParams }: PageProps<'/agenda'>) {
  const sp = await searchParams
  const eu = await exigirEquipe()
  const hoje = dataDeHoje(new Date())
  const visao = textoParam(sp.visao) === 'mes' ? 'mes' : 'semana'
  const base = textoParam(sp.semana)
  const mes = lerMes(textoParam(sp.mes), hoje)
  const dias = visao === 'mes' ? gradeDoMes(mes) : semanaDe(base && DATA.test(base) && !Number.isNaN(Date.parse(base)) ? base : hoje)
  const [de, ate] = [dias[0], dias[dias.length - 1]]
  const sb = await criarClienteServidor()
  const [compromissos, equipe, clientes, tags, google, doGoogle] = await Promise.all([
    // Sem as migrations da agenda, a página abre vazia em vez de quebrar.
    listarCompromissos(sb, de, ate).catch(() => []),
    listarEquipe(sb),
    listarClientes(sb),
    listarTagsAgenda(sb).catch(() => []),
    statusGoogle(eu.id).catch(() => null),
    eventosDoGoogle(eu.id, de, ate),
  ])
  const todas = [...ocorrencias(compromissos, de, ate), ...doGoogle]
  const podeCompartilhar = eu.papel === 'admin' || eu.papel === 'gestor'
  const outros = equipe.filter((p) => p.id !== eu.id)
  const nomes = new Map(equipe.map((p) => [p.id, p.nome]))
  const opcoesClientes = clientes.filter((c) => !c.interno).map((c) => ({ id: c.id, nome: c.nome }))
  const nomeCliente = new Map(clientes.map((c) => [c.id, c.nome]))
  const tagPorId = new Map(tags.map((t) => [t.id, t]))
  const aviso = AVISO_GOOGLE[textoParam(sp.google) ?? '']
  const semana = (dia: string) => `/agenda?semana=${dia}`
  const doMes = (m: string) => `/agenda?visao=mes&mes=${m}`
  const [anterior, proximo] = visao === 'mes' ? [doMes(mesVizinho(mes, -1)), doMes(mesVizinho(mes, 1))] : [semana(somarDias(de, -7)), semana(somarDias(de, 7))]
  const dialogo = { equipe: outros, clientes: opcoesClientes, tags, podeCompartilhar, hoje }

  const item = (o: Ocorrencia, compacto: boolean) => {
    const c = o.compromisso
    if (!c) {
      return (
        <li key={o.id}>
          <a href={o.google!.link} target="_blank" rel="noreferrer" className="block rounded-md border border-dashed border-borda px-1.5 py-1 text-left hover:bg-hover" title={`${horario(o)} · ${o.titulo} (Google Agenda)`}>
            {compacto ? (
              <span className="block truncate text-micro text-texto-2">{o.diaInteiro ? '' : `${horaLocal(o.inicio)} `}{o.titulo}</span>
            ) : (
              <>
                <span className="block text-micro tabular-nums text-texto-3">{horario(o)} · Google</span>
                <span className="block truncate text-legenda text-texto-2">{o.titulo}</span>
              </>
            )}
          </a>
        </li>
      )
    }
    const Icone = ICONE[c.visibilidade]
    const criador = c.criadoPor === eu.id ? 'você' : nomes.get(c.criadoPor) ?? 'outra pessoa'
    const tagsDoItem = c.tags.flatMap((t) => tagPorId.get(t) ?? [])
    const cliente = c.clienteId ? nomeCliente.get(c.clienteId) : undefined
    return (
      <li key={o.id}>
        <CompromissoDialog
          {...dialogo}
          compromisso={c}
          podeEditar={c.criadoPor === eu.id || eu.papel === 'admin'}
          className="block w-full rounded-md border-l-[3px] bg-fundo px-1.5 py-1 text-left hover:bg-hover"
          estilo={{ borderLeftColor: tagsDoItem[0]?.cor ?? 'transparent' }}
        >
          {compacto ? (
            <span className="block truncate text-micro text-texto" title={`${horario(o)} · ${o.titulo}${cliente ? ` · ${cliente}` : ''}`}>
              {o.diaInteiro ? '' : <span className="tabular-nums text-texto-3">{horaLocal(o.inicio)} </span>}{o.titulo}
            </span>
          ) : (
            <>
              <span className="flex items-center gap-1 text-micro tabular-nums text-texto-3" title={`Criado por ${criador}`}>
                <Icone className="h-3 w-3 shrink-0" /> {horario(o)}
              </span>
              <span className="block truncate text-legenda font-medium text-texto">{o.titulo}</span>
              {cliente && <span className="block truncate text-micro text-texto-2">{cliente}</span>}
              {tagsDoItem.length > 0 && (
                <span className="mt-0.5 flex flex-wrap gap-0.5">
                  {tagsDoItem.map((t) => <span key={t.id} className="rounded px-1 text-micro font-medium text-white" style={{ background: t.cor }}>{t.nome}</span>)}
                </span>
              )}
            </>
          )}
        </CompromissoDialog>
      </li>
    )
  }
  const doDia = (dia: string) => todas.filter((o) => dataLocal(o.inicio) === dia)

  return (
    <div className="min-h-full bg-white">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-borda px-4 py-3 md:px-5">
        <h1 className="flex items-center gap-2 text-destaque font-bold text-texto"><CalendarDays className="h-4 w-4" /> Agenda</h1>
        <div className="flex flex-wrap items-center gap-2">
          <nav className="flex gap-0.5 rounded-lg bg-fundo p-0.5" aria-label="Visão">
            <Link href={visao === 'mes' ? semana(dias.includes(hoje) && hoje.startsWith(mes) ? hoje : `${mes}-01`) : semana(de)} className={`rounded-md px-2.5 py-1 text-rotulo font-semibold ${visao === 'semana' ? 'bg-white text-texto shadow-sm' : 'text-texto-2 hover:text-texto'}`}>Semana</Link>
            <Link href={doMes(visao === 'mes' ? mes : dias[3].slice(0, 7))} className={`rounded-md px-2.5 py-1 text-rotulo font-semibold ${visao === 'mes' ? 'bg-white text-texto shadow-sm' : 'text-texto-2 hover:text-texto'}`}>Mês</Link>
          </nav>
          <nav className="flex items-center gap-1" aria-label={visao === 'mes' ? 'Mês' : 'Semana'}>
            <Link href={anterior} aria-label={visao === 'mes' ? 'Mês anterior' : 'Semana anterior'} className="rounded-lg p-1.5 text-texto-2 hover:bg-hover"><ChevronLeft className="h-4 w-4" /></Link>
            <Link href={visao === 'mes' ? doMes(hoje.slice(0, 7)) : '/agenda'} className="rounded-lg px-2 py-1 text-rotulo font-semibold text-texto-2 hover:bg-hover">Hoje</Link>
            <Link href={proximo} aria-label={visao === 'mes' ? 'Próximo mês' : 'Próxima semana'} className="rounded-lg p-1.5 text-texto-2 hover:bg-hover"><ChevronRight className="h-4 w-4" /></Link>
          </nav>
          {googleConfigurado() && <BotaoGoogle email={google ? google.email : null} />}
          <CompromissoDialog {...dialogo} hoje={dias.includes(hoje) ? hoje : visao === 'mes' ? `${mes}-01` : de} />
        </div>
      </header>

      <main className="space-y-3 p-4 md:p-5">
        {aviso && <p className="rounded-lg border border-borda bg-fundo px-3 py-2 text-rotulo text-texto-2">{aviso}</p>}
        {visao === 'mes' ? (
          <section aria-label={nomeMes(mes)}>
            <h2 className="mb-2 text-rotulo font-semibold capitalize text-texto">{nomeMes(mes)}</h2>
            <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-borda bg-borda">
              {SEMANA.map((d) => <div key={d} className="bg-fundo px-1 py-1 text-center text-micro font-semibold text-texto-3">{d}</div>)}
              {dias.map((dia) => {
                const lista = doDia(dia)
                const fora = !dia.startsWith(mes)
                return (
                  <div key={dia} className={`min-h-20 min-w-0 p-1 md:min-h-28 ${fora ? 'bg-fundo/60' : 'bg-white'}`}>
                    <Link href={semana(dia)} className={`mb-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-micro font-semibold ${dia === hoje ? 'bg-petroleo text-white' : fora ? 'text-texto-3/60' : 'text-texto-2 hover:bg-hover'}`}>
                      {Number(dia.slice(8))}
                    </Link>
                    <ul className="space-y-0.5">{lista.slice(0, 3).map((o) => item(o, true))}</ul>
                    {lista.length > 3 && <Link href={semana(dia)} className="mt-0.5 block text-micro font-semibold text-petroleo hover:underline">+{lista.length - 3} mais</Link>}
                  </div>
                )
              })}
            </div>
          </section>
        ) : (
          <section className="grid gap-2 md:grid-cols-7" aria-label="Semana">
            {dias.map((dia) => {
              const lista = doDia(dia)
              return (
                <div key={dia} className={`min-h-28 rounded-xl border p-2 ${dia === hoje ? 'border-petroleo bg-petroleo/5' : 'border-borda'}`}>
                  <p className={`mb-1.5 text-legenda font-semibold capitalize ${dia === hoje ? 'text-petroleo' : 'text-texto-3'}`}>{nomeDia(dia)}</p>
                  {lista.length === 0 && <p className="text-micro text-texto-3 md:hidden">Livre</p>}
                  <ul className="space-y-1">{lista.map((o) => item(o, false))}</ul>
                </div>
              )
            })}
          </section>
        )}
        <p className="flex flex-wrap gap-x-3 gap-y-1 text-legenda text-texto-3">
          <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> só você</span>
          <span className="flex items-center gap-1"><Users className="h-3 w-3" /> toda a equipe</span>
          <span className="flex items-center gap-1"><UserCheck className="h-3 w-3" /> pessoas selecionadas</span>
          <span>faixa colorida: primeira tag</span>
          <span>tracejado: evento do seu Google Agenda</span>
        </p>
      </main>
    </div>
  )
}
