import { CalendarDays, ChevronLeft, ChevronRight, Lock, UserCheck, Users } from 'lucide-react'
import Link from 'next/link'
import type { CSSProperties, ReactNode } from 'react'
import { BotaoGoogle } from '@/componentes/agenda/BotaoGoogle'
import { CompromissoDialog } from '@/componentes/agenda/CompromissoDialog'
import { PainelEtiquetas } from '@/componentes/agenda/PainelEtiquetas'
import { RolarAoAbrir } from '@/componentes/agenda/RolarAoAbrir'
import { blocosDoDia, dataLocal, doDia, gradeDoMes, horaLocal, instante, ocorrencias, semanaDe, somarDias, type Ocorrencia } from '@/dominio/agenda'
import { mesVizinho } from '@/dominio/financeiro'
import { dataDeHoje } from '@/dominio/filtros'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { listarCompromissos, listarEtiquetas } from '@/servicos/agenda'
import { listarClientes } from '@/servicos/clientes-plataforma'
import { eventosDoGoogle, googleConfigurado, statusGoogle } from '@/servicos/google-agenda'
import { listarEquipe } from '@/servicos/usuarios'
import { NomeCliente } from '@/componentes/NomeCliente'

type Visao = 'dia' | 'semana' | 'mes'

const textoParam = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)
const DATA = /^\d{4}-\d{2}-\d{2}$/
const formatar = (iso: string, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('pt-BR', { ...o, timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`)).replace('.', '')
const AVISO_GOOGLE: Record<string, string> = {
  ok: 'Google Agenda conectado. Seus compromissos já foram enviados para lá.',
  cancelado: 'Conexão com o Google cancelada.',
  erro: 'Não foi possível conectar o Google Agenda. Tente de novo.',
  'sem-config': 'A integração com o Google ainda não foi configurada (GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET).',
}
const ICONE = { privado: Lock, equipe: Users, selecionados: UserCheck }
const SEMANA = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
const VISOES: { valor: Visao; rotulo: string }[] = [{ valor: 'dia', rotulo: 'Dia' }, { valor: 'semana', rotulo: 'Semana' }, { valor: 'mes', rotulo: 'Mês' }]
const HORA_PX = 48
const HORAS = Array.from({ length: 24 }, (_, h) => h)
const COR_PADRAO = '#18181b'
const COR_GOOGLE = '#64748b'
const horario = (o: Ocorrencia) => (o.diaInteiro ? 'Dia todo' : `${horaLocal(o.inicio)}–${horaLocal(o.fim)}`)

export default async function Agenda({ searchParams }: PageProps<'/agenda'>) {
  const sp = await searchParams
  const eu = await exigirEquipe()
  const agora = new Date()
  const hoje = dataDeHoje(agora)
  const pedida = textoParam(sp.visao)
  const visao: Visao = pedida === 'dia' || pedida === 'mes' ? pedida : 'semana'
  const dataParam = textoParam(sp.data)
  const data = dataParam && DATA.test(dataParam) && !Number.isNaN(Date.parse(dataParam)) ? dataParam : hoje
  const mes = data.slice(0, 7)
  const ocultas = new Set((textoParam(sp.ocultas) ?? '').split(',').filter(Boolean))
  const dias = visao === 'mes' ? gradeDoMes(mes) : visao === 'semana' ? semanaDe(data) : [data]
  const [de, ate] = [dias[0], dias[dias.length - 1]]

  const sb = await criarClienteServidor()
  const [compromissos, equipe, clientes, tags, categorias, google, doGoogle] = await Promise.all([
    // Sem as migrations da agenda, a página abre vazia em vez de quebrar.
    listarCompromissos(sb, de, ate).catch(() => []),
    listarEquipe(sb),
    listarClientes(sb),
    listarEtiquetas(sb, 'tag').catch(() => []),
    listarEtiquetas(sb, 'categoria').catch(() => []),
    statusGoogle(eu.id).catch(() => null),
    eventosDoGoogle(eu.id, de, ate),
  ])
  const todas = [...ocorrencias(compromissos, de, ate), ...doGoogle].filter((o) =>
    o.compromisso ? !ocultas.has(o.compromisso.categoriaId ?? 'nenhuma') : !ocultas.has('google'),
  )

  const nomes = new Map(equipe.map((p) => [p.id, p.nome]))
  const nomeCliente = new Map(clientes.map((c) => [c.id, c.nome]))
  const tagPorId = new Map(tags.map((t) => [t.id, t]))
  const categoriaPorId = new Map(categorias.map((c) => [c.id, c]))
  const aviso = AVISO_GOOGLE[textoParam(sp.google) ?? '']
  const dialogo = {
    equipe: equipe.filter((p) => p.id !== eu.id),
    clientes: clientes.filter((c) => !c.interno).map((c) => ({ id: c.id, nome: c.nome })),
    tags,
    categorias,
    podeCompartilhar: eu.papel === 'admin' || eu.papel === 'gestor',
    hoje,
  }
  const podeMexer = (criadoPor: string | null) => criadoPor === eu.id || eu.papel === 'admin'

  const url = (p: { visao?: Visao; data?: string; ocultas?: Set<string> }) => {
    const q = new URLSearchParams()
    const v = p.visao ?? visao
    if (v !== 'semana') q.set('visao', v)
    const d = p.data ?? data
    if (d !== hoje) q.set('data', d)
    const o = [...(p.ocultas ?? ocultas)]
    if (o.length) q.set('ocultas', o.join(','))
    const s = q.toString()
    return s ? `/agenda?${s}` : '/agenda'
  }
  const alternar = (chave: string) => {
    const novo = new Set(ocultas)
    if (!novo.delete(chave)) novo.add(chave)
    return url({ ocultas: novo })
  }
  const passo = (n: number) => (visao === 'mes' ? `${mesVizinho(mes, n)}-01` : somarDias(data, n * (visao === 'semana' ? 7 : 1)))
  const titulo =
    visao === 'mes' ? formatar(`${mes}-01`, { month: 'long', year: 'numeric' })
    : visao === 'dia' ? formatar(data, { weekday: 'long', day: 'numeric', month: 'long' })
    : `${formatar(de, { day: 'numeric', month: 'short' })} – ${formatar(ate, { day: 'numeric', month: 'short', year: 'numeric' })}`

  const corDe = (o: Ocorrencia) => (o.compromisso ? categoriaPorId.get(o.compromisso.categoriaId ?? '')?.cor ?? COR_PADRAO : COR_GOOGLE)

  /** Abre o compromisso (ou o evento no Google). O conteúdo e o estilo mudam conforme a visão. */
  const abrir = (o: Ocorrencia, className: string, estilo: CSSProperties, conteudo: ReactNode) =>
    o.compromisso ? (
      <CompromissoDialog {...dialogo} compromisso={o.compromisso} dia={dataLocal(o.inicio)} podeEditar={podeMexer(o.compromisso.criadoPor)} className={className} estilo={estilo}>
        {conteudo}
      </CompromissoDialog>
    ) : (
      <a href={o.google!.link} target="_blank" rel="noreferrer" className={`${className} border-dashed`} style={estilo} title="Evento do seu Google Agenda">
        {conteudo}
      </a>
    )

  // ---------- Dia: lista ----------
  const visaoDia = () => {
    const lista = doDia(todas, data)
    if (!lista.length) return <p className="rounded-xl border border-dashed border-borda py-12 text-center text-corpo text-texto-3">Nenhum compromisso neste dia.</p>
    return (
      <ul className="divide-y divide-borda overflow-hidden rounded-xl border border-borda">
        {lista.map((o) => {
          const c = o.compromisso
          const categoria = c?.categoriaId ? categoriaPorId.get(c.categoriaId) : undefined
          const cliente = c?.clienteId ? nomeCliente.get(c.clienteId) : undefined
          const tagsDoItem = c ? c.tags.flatMap((t) => tagPorId.get(t) ?? []) : []
          const Icone = c ? ICONE[c.visibilidade] : null
          const criador = c && (c.criadoPor === eu.id ? 'você' : nomes.get(c.criadoPor) ?? 'outra pessoa')
          return (
            <li key={o.id}>
              {abrir(o, 'flex w-full gap-3 px-3 py-2.5 text-left hover:bg-hover', {}, (
                <>
                  <span className="w-24 shrink-0 pt-0.5 text-rotulo tabular-nums text-texto-2">{horario(o)}</span>
                  <span className="w-1 shrink-0 self-stretch rounded-full" style={{ background: corDe(o) }} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-corpo font-semibold text-texto">{o.titulo}</span>
                    <span className="flex flex-wrap items-center gap-x-2 text-legenda text-texto-3">
                      {categoria && <span className="font-medium" style={{ color: categoria.cor }}>{categoria.nome}</span>}
                      {cliente && <NomeCliente nome={cliente} />}
                      {Icone && <span className="flex items-center gap-1"><Icone className="h-3 w-3" /> criado por {criador}</span>}
                      {!c && <span>Google Agenda</span>}
                    </span>
                    {c?.descricao && <span className="mt-0.5 line-clamp-2 block text-legenda text-texto-2">{c.descricao}</span>}
                    {tagsDoItem.length > 0 && (
                      <span className="mt-1 flex flex-wrap gap-0.5">
                        {tagsDoItem.map((t) => <span key={t.id} className="rounded px-1 text-micro font-medium text-white" style={{ background: t.cor }}>{t.nome}</span>)}
                      </span>
                    )}
                  </span>
                </>
              ))}
            </li>
          )
        })}
      </ul>
    )
  }

  // ---------- Semana: grade de horas ----------
  const minutosAgora = (agora.getTime() - instante(hoje).getTime()) / 60_000
  const visaoSemana = () => (
    <div className="overflow-x-auto rounded-xl border border-borda">
      <div className="min-w-[760px]">
        <div className="grid grid-cols-[3rem_repeat(7,1fr)] border-b border-borda bg-fundo/60">
          <span />
          {dias.map((dia, i) => (
            <Link key={dia} href={url({ visao: 'dia', data: dia })} className="border-l border-borda px-1 py-1.5 text-center hover:bg-hover">
              <span className="block text-micro font-semibold uppercase text-texto-3">{SEMANA[i]}</span>
              <span className={`mx-auto mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-rotulo font-bold ${dia === hoje ? 'bg-petroleo text-white' : 'text-texto'}`}>{Number(dia.slice(8))}</span>
            </Link>
          ))}
        </div>
        <div className="grid grid-cols-[3rem_repeat(7,1fr)] border-b border-borda">
          <span className="py-1 pr-1 text-right text-micro text-texto-3">dia todo</span>
          {dias.map((dia) => (
            <ul key={dia} className="min-h-6 space-y-0.5 border-l border-borda p-0.5">
              {doDia(todas, dia).filter((o) => o.diaInteiro).map((o) => (
                <li key={o.id}>{abrir(o, 'block w-full truncate rounded px-1 py-0.5 text-left text-micro font-medium text-white', { background: corDe(o) }, o.titulo)}</li>
              ))}
            </ul>
          ))}
        </div>
        <RolarAoAbrir topo={7 * HORA_PX} className="max-h-[65vh] overflow-y-auto">
          <div className="relative grid grid-cols-[3rem_repeat(7,1fr)]" style={{ height: 24 * HORA_PX }}>
            <div className="relative">
              {HORAS.slice(1).map((h) => <span key={h} className="absolute right-1 -translate-y-1/2 text-micro tabular-nums text-texto-3" style={{ top: h * HORA_PX }}>{String(h).padStart(2, '0')}:00</span>)}
            </div>
            {dias.map((dia) => (
              <div key={dia} className={`relative border-l border-borda ${dia === hoje ? 'bg-petroleo/[0.03]' : ''}`}>
                {HORAS.slice(1).map((h) => <span key={h} className="pointer-events-none absolute inset-x-0 border-t border-borda" style={{ top: h * HORA_PX }} />)}
                {blocosDoDia(todas, dia).map((b) => {
                  const cor = corDe(b.ocorrencia)
                  const altura = Math.max(((b.ate - b.de) / 60) * HORA_PX, 18)
                  const estilo: CSSProperties = {
                    top: (b.de / 60) * HORA_PX,
                    height: altura - 2,
                    left: `calc(${(b.coluna / b.colunas) * 100}% + 2px)`,
                    width: `calc(${100 / b.colunas}% - 4px)`,
                    background: `${cor}26`,
                    borderLeftColor: cor,
                  }
                  return (
                    <div key={b.ocorrencia.id}>
                      {abrir(b.ocorrencia, 'absolute overflow-hidden rounded-md border-l-[3px] px-1 py-0.5 text-left hover:brightness-95', estilo, (
                        <>
                          <span className="block truncate text-micro font-semibold text-texto">{b.ocorrencia.titulo}</span>
                          {altura >= 34 && <span className="block truncate text-micro tabular-nums text-texto-2">{horario(b.ocorrencia)}</span>}
                        </>
                      ))}
                    </div>
                  )
                })}
                {dia === hoje && (
                  <span className="pointer-events-none absolute inset-x-0 z-10 border-t-2 border-perigo" style={{ top: (minutosAgora / 60) * HORA_PX }}>
                    <span className="absolute -left-1 -top-[5px] h-2 w-2 rounded-full bg-perigo" />
                  </span>
                )}
              </div>
            ))}
          </div>
        </RolarAoAbrir>
      </div>
    </div>
  )

  // ---------- Mês ----------
  const visaoMes = () => (
    <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-borda bg-borda">
      {SEMANA.map((d) => <div key={d} className="bg-fundo px-1 py-1 text-center text-micro font-semibold text-texto-3">{d}</div>)}
      {dias.map((dia) => {
        const lista = doDia(todas, dia)
        const fora = !dia.startsWith(mes)
        return (
          <div key={dia} className={`min-h-20 min-w-0 p-1 md:min-h-28 ${fora ? 'bg-fundo/60' : 'bg-white'}`}>
            <Link href={url({ visao: 'dia', data: dia })} className={`mb-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-micro font-semibold ${dia === hoje ? 'bg-petroleo text-white' : fora ? 'text-texto-3/60' : 'text-texto-2 hover:bg-hover'}`}>
              {Number(dia.slice(8))}
            </Link>
            <ul className="space-y-0.5">
              {lista.slice(0, 3).map((o) => (
                <li key={o.id}>
                  {abrir(o, 'flex w-full min-w-0 items-center gap-1 rounded px-0.5 text-left hover:bg-hover', o.diaInteiro ? { background: corDe(o) } : {}, (
                    o.diaInteiro ? (
                      <span className="truncate text-micro font-medium text-white">{o.titulo}</span>
                    ) : (
                      <>
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: corDe(o) }} />
                        <span className="truncate text-micro text-texto"><span className="tabular-nums text-texto-3">{horaLocal(o.inicio)} </span>{o.titulo}</span>
                      </>
                    )
                  ))}
                </li>
              ))}
            </ul>
            {lista.length > 3 && <Link href={url({ visao: 'dia', data: dia })} className="mt-0.5 block text-micro font-semibold text-petroleo hover:underline">+{lista.length - 3} mais</Link>}
          </div>
        )
      })}
    </div>
  )

  return (
    <div className="min-h-full bg-white">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-borda px-4 py-3 md:px-5">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="flex items-center gap-2 text-destaque font-bold text-texto"><CalendarDays className="h-4 w-4" /> Agenda</h1>
          <nav className="flex items-center gap-1" aria-label="Período">
            <Link href={url({ data: passo(-1) })} aria-label="Anterior" className="rounded-lg p-1.5 text-texto-2 hover:bg-hover"><ChevronLeft className="h-4 w-4" /></Link>
            <Link href={url({ data: hoje })} className="rounded-lg border border-borda px-2 py-0.5 text-rotulo font-semibold text-texto-2 hover:bg-hover">Hoje</Link>
            <Link href={url({ data: passo(1) })} aria-label="Próximo" className="rounded-lg p-1.5 text-texto-2 hover:bg-hover"><ChevronRight className="h-4 w-4" /></Link>
          </nav>
          <span className="text-rotulo font-semibold capitalize text-texto">{titulo}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <nav className="flex gap-0.5 rounded-lg bg-fundo p-0.5" aria-label="Visão">
            {VISOES.map((v) => (
              <Link key={v.valor} href={url({ visao: v.valor })} className={`rounded-md px-2.5 py-1 text-rotulo font-semibold ${visao === v.valor ? 'bg-white text-texto shadow-sm' : 'text-texto-2 hover:text-texto'}`}>{v.rotulo}</Link>
            ))}
          </nav>
          {googleConfigurado() && <BotaoGoogle email={google ? google.email : null} />}
          <CompromissoDialog {...dialogo} hoje={dias.includes(hoje) ? hoje : visao === 'mes' ? `${mes}-01` : data} />
        </div>
      </header>

      <div className="grid gap-4 p-4 md:p-5 lg:grid-cols-[13rem_1fr]">
        <aside className="order-2 space-y-4 lg:order-1">
          <PainelEtiquetas
            tipo="categoria"
            titulo="Categorias"
            linhas={categorias.map((c) => ({ item: c, podeExcluir: podeMexer(c.criadoPor), href: alternar(c.id), visivel: !ocultas.has(c.id) }))}
            extras={[
              { chave: 'nenhuma', nome: 'Sem categoria', cor: COR_PADRAO, href: alternar('nenhuma'), visivel: !ocultas.has('nenhuma') },
              ...(google ? [{ chave: 'google', nome: 'Google Agenda', cor: COR_GOOGLE, href: alternar('google'), visivel: !ocultas.has('google') }] : []),
            ]}
          />
          <PainelEtiquetas tipo="tag" titulo="Tags" linhas={tags.map((t) => ({ item: t, podeExcluir: podeMexer(t.criadoPor) }))} />
          <p className="flex flex-col gap-1 text-legenda text-texto-3">
            <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> só você</span>
            <span className="flex items-center gap-1"><Users className="h-3 w-3" /> toda a equipe</span>
            <span className="flex items-center gap-1"><UserCheck className="h-3 w-3" /> pessoas selecionadas</span>
          </p>
        </aside>
        <main className="order-1 min-w-0 space-y-3 lg:order-2">
          {aviso && <p className="rounded-lg border border-borda bg-fundo px-3 py-2 text-rotulo text-texto-2">{aviso}</p>}
          {visao === 'dia' ? visaoDia() : visao === 'semana' ? visaoSemana() : visaoMes()}
        </main>
      </div>
    </div>
  )
}
