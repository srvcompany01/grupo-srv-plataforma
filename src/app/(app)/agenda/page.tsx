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
import './agenda.css'

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
const HORA_PX = 44
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
      <a href={o.google!.link} target="_blank" rel="noreferrer" className={className} style={estilo} title="Evento do seu Google Agenda">
        {conteudo}
      </a>
    )

  // ---------- Dia: lista ----------
  const visaoDia = () => {
    const lista = doDia(todas, data)
    if (!lista.length) return <p className="ag-vazio">Nenhum compromisso neste dia.</p>
    return (
      <ul className="ag-dia">
        {lista.map((o) => {
          const c = o.compromisso
          const categoria = c?.categoriaId ? categoriaPorId.get(c.categoriaId) : undefined
          const cliente = c?.clienteId ? nomeCliente.get(c.clienteId) : undefined
          const tagsDoItem = c ? c.tags.flatMap((t) => tagPorId.get(t) ?? []) : []
          const Icone = c ? ICONE[c.visibilidade] : null
          const criador = c && (c.criadoPor === eu.id ? 'você' : nomes.get(c.criadoPor) ?? 'outra pessoa')
          return (
            <li key={o.id}>
              {abrir(o, 'ag-dia-item', {}, (
                <>
                  <span className="ag-dia-hora">{horario(o)}</span>
                  <span className="ag-dia-cor" style={{ background: corDe(o) }} />
                  <span className="ag-dia-corpo">
                    <span className="ag-dia-titulo">{o.titulo}</span>
                    <span className="ag-dia-meta">
                      {categoria && <span style={{ color: categoria.cor }}>{categoria.nome}</span>}
                      {cliente && <NomeCliente nome={cliente} />}
                      {Icone && <span><Icone /> criado por {criador}</span>}
                      {!c && <span>Google Agenda</span>}
                    </span>
                    {c?.descricao && <span className="ag-dia-desc">{c.descricao}</span>}
                    {tagsDoItem.length > 0 && (
                      <span className="ag-dia-tags">
                        {tagsDoItem.map((t) => <span key={t.id} style={{ background: t.cor }}>{t.nome}</span>)}
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
    <div className="ag-semana">
      <div className="ag-grade ag-cab">
        <span />
        {dias.map((dia, i) => (
          <Link key={dia} href={url({ visao: 'dia', data: dia })} data-hoje={dia === hoje ? '' : undefined}>
            <span>{SEMANA[i]}</span>
            <span>{Number(dia.slice(8))}</span>
          </Link>
        ))}
      </div>
      <div className="ag-grade ag-tarefas">
        <span>Tarefas</span>
        {dias.map((dia) => (
          <ul key={dia}>
            {doDia(todas, dia).filter((o) => o.diaInteiro).map((o) => (
              <li key={o.id}>{abrir(o, 'ag-chip', { background: corDe(o) }, o.titulo)}</li>
            ))}
          </ul>
        ))}
      </div>
      <RolarAoAbrir topo={7 * HORA_PX - 12} className="ag-rolagem">
        <div className="ag-grade ag-horas" style={{ height: 24 * HORA_PX }}>
          <div className="ag-regua">
            {HORAS.slice(1).map((h) => <span key={h} style={{ top: h * HORA_PX }}>{String(h).padStart(2, '0')}:00</span>)}
          </div>
          {dias.map((dia) => (
            <div key={dia} className="ag-coluna" data-hoje={dia === hoje ? '' : undefined}>
              {HORAS.slice(1).map((h) => <span key={h} className="ag-linha-hora" style={{ top: h * HORA_PX }} />)}
              {blocosDoDia(todas, dia).map((b) => {
                const cor = corDe(b.ocorrencia)
                const altura = Math.max(((b.ate - b.de) / 60) * HORA_PX, 18)
                const cliente = b.ocorrencia.compromisso?.clienteId ? nomeCliente.get(b.ocorrencia.compromisso.clienteId) : undefined
                const estilo: CSSProperties = {
                  top: (b.de / 60) * HORA_PX,
                  height: altura - 2,
                  left: `calc(${(b.coluna / b.colunas) * 100}% + 2px)`,
                  width: `calc(${100 / b.colunas}% - 4px)`,
                  background: `color-mix(in srgb, ${cor} 16%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${cor} 45%, transparent)`,
                  borderLeftColor: cor,
                }
                return (
                  <div key={b.ocorrencia.id}>
                    {abrir(b.ocorrencia, 'ag-evento', estilo, (
                      <>
                        <span className="ag-ev-titulo">{b.ocorrencia.titulo}</span>
                        {altura >= 48 && cliente && <span className="ag-ev-cliente">{cliente}</span>}
                        {altura >= 34 && <span className="ag-ev-hora">{horario(b.ocorrencia)}</span>}
                      </>
                    ))}
                  </div>
                )
              })}
              {dia === hoje && (
                <span className="ag-agora" style={{ top: (minutosAgora / 60) * HORA_PX }}>
                  <span />
                </span>
              )}
            </div>
          ))}
        </div>
      </RolarAoAbrir>
    </div>
  )

  // ---------- Mês ----------
  const visaoMes = () => (
    <div className="ag-mes">
      {SEMANA.map((d) => <div key={d} className="ag-mes-sem">{d}</div>)}
      {dias.map((dia) => {
        const lista = doDia(todas, dia)
        const fora = !dia.startsWith(mes)
        return (
          <div key={dia} className="ag-mes-dia" data-fora={fora ? '' : undefined} data-hoje={dia === hoje ? '' : undefined}>
            <Link href={url({ visao: 'dia', data: dia })}>
              {Number(dia.slice(8))}
            </Link>
            <ul>
              {lista.slice(0, 3).map((o) => (
                <li key={o.id}>
                  {abrir(o, 'ag-mes-item', o.diaInteiro ? { background: corDe(o) } : {}, (
                    o.diaInteiro ? (
                      <span>{o.titulo}</span>
                    ) : (
                      <>
                        <span style={{ background: corDe(o) }} />
                        <span><span>{horaLocal(o.inicio)} </span>{o.titulo}</span>
                      </>
                    )
                  ))}
                </li>
              ))}
            </ul>
            {lista.length > 3 && <Link className="ag-mais" href={url({ visao: 'dia', data: dia })}>+{lista.length - 3} mais</Link>}
          </div>
        )
      })}
    </div>
  )

  return (
    <div className="ag">
      <header className="ag-topo">
        <div className="ag-topo-esq">
          <h1><CalendarDays /> {titulo}</h1>
          <nav aria-label="Período">
            <Link href={url({ data: passo(-1) })} aria-label="Anterior"><ChevronLeft /></Link>
            <Link href={url({ data: hoje })}>Hoje</Link>
            <Link href={url({ data: passo(1) })} aria-label="Próximo"><ChevronRight /></Link>
          </nav>
        </div>
        <div className="ag-topo-dir">
          <nav aria-label="Visão" className="ag-visoes">
            {VISOES.map((v) => (
              <Link key={v.valor} href={url({ visao: v.valor })} aria-current={v.valor === visao ? 'page' : undefined}>{v.rotulo}</Link>
            ))}
          </nav>
          {googleConfigurado() && <BotaoGoogle email={google ? google.email : null} />}
          <CompromissoDialog {...dialogo} hoje={dias.includes(hoje) ? hoje : visao === 'mes' ? `${mes}-01` : data} />
        </div>
      </header>

      <div className="ag-corpo">
        <aside className="ag-lado">
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
          <p className="ag-legenda">
            <span><Lock /> só você</span>
            <span><Users /> toda a equipe</span>
            <span><UserCheck /> pessoas selecionadas</span>
          </p>
        </aside>
        <main className="ag-principal">
          {aviso && <p className="ag-aviso">{aviso}</p>}
          {visao === 'dia' ? visaoDia() : visao === 'semana' ? visaoSemana() : visaoMes()}
        </main>
      </div>
    </div>
  )
}
