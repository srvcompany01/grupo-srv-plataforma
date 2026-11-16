import { ArrowRight, ArrowUpRight, CalendarDays, CalendarCheck2, CheckCheck, ChevronRight, CircleAlert, ClipboardCheck, Clock3, FileText, FolderKanban, Layers3, PartyPopper, Send, Users, type LucideIcon } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { dataLocal, gradeDoMes, horaLocal, somarDias, type Ocorrencia } from '@/dominio/agenda'
import { feriadosDoAno, feriadosEntre } from '@/dominio/feriados'
import type { resumirAgendaHome, resumirHome } from '@/dominio/home'
import { BoasVindas } from './BoasVindas'
import { Prioridades, RecarregarHome } from './Prioridades'

export type ClienteHome = { id: string; nome: string; cor: string; responsavel: string; abertas: number; atrasadas: number; aprovacao: number; proxima: string | null; concluidas: number; total: number; pausado: boolean }
export type PropsPainelHome = {
  nome: string; agora: string; hoje: string
  resumo: ReturnType<typeof resumirHome>
  agenda: ReturnType<typeof resumirAgendaHome>
  eventos: Ocorrencia[]; clientes: ClienteHome[]; ativos: number
  atrasadasOperacao: number; semResponsavel: number; erros: string[]
  children?: ReactNode
}
const formatar = (dia: string, opcoes: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('pt-BR', { ...opcoes, timeZone: 'UTC' }).format(new Date(`${dia}T00:00:00Z`)).replace('.', '')
const diaCurto = (dia: string, hoje: string) => dia === hoje ? 'Hoje' : dia === somarDias(hoje, 1) ? 'Amanhã' : formatar(dia, { day: '2-digit', month: 'short' })
const plural = (n: number, um: string, muitos: string) => `${n} ${n === 1 ? um : muitos}`
const atalhos: { nome: string; texto: string; href: string; icone: LucideIcon }[] = [
  { nome: 'Clientes', texto: 'Relacionamento e entregas', href: '/clientes', icone: Users },
  { nome: 'Agendamentos', texto: 'Sua fila de publicações', href: '/agendamentos', icone: Send },
  { nome: 'Painel de gestão', texto: 'A operação em detalhes', href: '/painel-de-gestao', icone: FolderKanban },
  { nome: 'Documentos', texto: 'Briefings e referências', href: '/documentos', icone: FileText },
]

export function PainelHome({ nome, agora, hoje, resumo: r, agenda, eventos, clientes, ativos, atrasadasOperacao, semResponsavel, erros, children }: PropsPainelHome) {
  const minhasOk = !erros.includes('tarefas') && !erros.includes('status')
  const clientesOk = !erros.includes('clientes') && !erros.includes('operacao') && !erros.includes('status')
  const conteudoOk = !erros.includes('conteudo') && !erros.includes('operacao')
  const agendaOk = !erros.includes('agenda') && !erros.includes('google')
  const mes = hoje.slice(0, 7)
  const grade = gradeDoMes(mes)
  const feriados = feriadosDoAno(Number(hoje.slice(0, 4)))
  const feriado = feriadosEntre(hoje, somarDias(hoje, 120))[0]
  const diasAte = feriado ? Math.round((Date.parse(feriado.data) - Date.parse(hoje)) / 86_400_000) : 0
  const proximos = agenda.proximos.slice(0, 4)
  const emAndamento = agenda.proximo && !agenda.proximo.diaInteiro && Date.parse(agenda.proximo.inicio) <= Date.parse(agora)
  const proximoTexto = agenda.proximo
    ? emAndamento ? `Em andamento até ${horaLocal(agenda.proximo.fim)}` : `${diaCurto(dataLocal(agenda.proximo.inicio), hoje)}${agenda.proximo.diaInteiro ? ' · dia todo' : ` às ${horaLocal(agenda.proximo.inicio)}`}`
    : agendaOk ? agenda.doDia.length > 0 ? 'Compromissos de hoje encerrados' : 'Seu dia sem compromissos' : 'Dados indisponíveis'
  const indicadores = [
    { titulo: 'Minhas tarefas', numero: minhasOk ? r.pessoais.length : null, meta: minhasOk ? `${r.hoje} para hoje · ${r.semana} em 7 dias` : 'Dados indisponíveis', icone: CheckCheck, href: '/inicio', tom: 'neutro' },
    { titulo: 'Em atraso', numero: minhasOk ? r.atrasadas : null, meta: clientesOk ? `${atrasadasOperacao} nas entregas dos clientes` : 'Minhas tarefas vencidas', icone: Clock3, href: '/inicio', tom: r.atrasadas > 0 && minhasOk ? 'atencao' : 'neutro' },
    { titulo: 'Aprovações pendentes', numero: conteudoOk ? r.aguardando.length : null, meta: 'Posts aguardando o cliente', icone: ClipboardCheck, href: '/agendamentos', tom: 'neutro' },
    { titulo: 'Agenda de hoje', numero: agendaOk ? agenda.doDia.length : null, meta: proximoTexto, icone: CalendarDays, href: `/agenda?data=${hoje}&visao=dia`, tom: 'neutro' },
  ]
  const alertas = [
    ...(minhasOk && r.atrasadas ? [{ titulo: plural(r.atrasadas, 'tarefa em atraso', 'tarefas em atraso'), texto: 'Reorganize os prazos e avance nas entregas.', href: '/inicio', tom: 'perigo' }] : []),
    ...(conteudoOk && r.falhas.length ? [{ titulo: plural(r.falhas.length, 'publicação com falha', 'publicações com falha'), texto: 'Confira o motivo antes de tentar novamente.', href: `/tarefas/${r.falhas[0].tarefaId}`, tom: 'perigo' }] : []),
    ...(conteudoOk && r.ajustes.length ? [{ titulo: plural(r.ajustes.length, 'post com ajuste solicitado', 'posts com ajustes solicitados'), texto: 'O cliente já deixou um retorno.', href: `/tarefas/${r.ajustes[0].tarefaId}`, tom: 'aviso' }] : []),
    ...(clientesOk && semResponsavel ? [{ titulo: plural(semResponsavel, 'entrega sem responsável', 'entregas sem responsável'), texto: 'Defina quem vai conduzir o próximo passo.', href: '/painel-de-gestao', tom: 'aviso' }] : []),
  ]
  const contexto = !minhasOk ? 'Acompanhe suas entregas e o ritmo da operação.' : r.atrasadas ? `${plural(r.atrasadas, 'tarefa precisa', 'tarefas precisam')} de atenção. Comece pelas prioridades abaixo.` : r.hoje ? `Você tem ${plural(r.hoje, 'entrega', 'entregas')} para hoje. Vamos colocar o dia em movimento.` : 'Seu dia está aberto para avançar nas próximas entregas.'

  return <div className="hm">
    <div className="hm-corpo">
      <header className="hm-hero">
        <div><p className="hm-eyebrow"><span />{formatar(hoje, { weekday: 'long', day: 'numeric', month: 'long' })}</p><BoasVindas nome={nome} agora={agora} /><p className="hm-contexto">{contexto}</p></div>
        <div className="hm-hero-acoes"><Link className="hm-botao" href={`/agenda?data=${hoje}&visao=dia`}><CalendarDays size={16} />Abrir agenda</Link><Link className="hm-botao hm-botao-primario" href="/inicio">Minhas tarefas <ArrowUpRight size={16} /></Link></div>
      </header>

      {erros.length > 0 && <div className="hm-aviso-carregamento" role="status"><CircleAlert size={16} /><span>Alguns dados não carregaram. Os demais continuam disponíveis.</span><RecarregarHome /></div>}

      <div className="hm-blocos" aria-label="Resumo do dia">
        {indicadores.map((i) => <Link className="hm-bloco" data-tom={i.tom} href={i.href} key={i.titulo}><span className="hm-bloco-topo"><span>{i.titulo}</span><i.icone size={18} /></span><strong>{i.numero ?? '—'}</strong><span className="hm-bloco-meta">{i.meta}<ArrowUpRight size={14} /></span></Link>)}
      </div>

      {alertas.length > 0 && <section className="hm-atencao" aria-labelledby="hm-atencao-titulo"><div className="hm-atencao-titulo"><CircleAlert size={17} /><h2 id="hm-atencao-titulo">Precisa de atenção</h2></div><div className="hm-alertas">{alertas.slice(0, 4).map((a) => <Link href={a.href} key={a.titulo} data-tom={a.tom}><span><strong>{a.titulo}</strong><small>{a.texto}</small></span><ArrowUpRight size={16} /></Link>)}</div></section>}

      <div className="hm-grade">
        <Prioridades hoje={hoje} indisponivel={!minhasOk} tarefas={r.prioridades.map(({ id, titulo, prazo, horario, prioridade, clienteNome, clienteCor, listaNome }) => ({ id, titulo, prazo, horario, prioridade, clienteNome, clienteCor, listaNome }))} />
        <section className="hm-cartao hm-agenda-cartao" aria-labelledby="hm-agenda-titulo">
          <div className="hm-cab"><div><h2 id="hm-agenda-titulo">Na sua agenda</h2><p>Hoje e os próximos compromissos.</p></div><Link href="/agenda" aria-label="Ver agenda completa"><ArrowUpRight size={17} /></Link></div>
          {proximos.length ? <ul className="hm-agenda">{proximos.map((e, i) => <li key={`${e.id}-${e.inicio}`}><Link href={`/agenda?data=${dataLocal(e.inicio)}&visao=dia`}><span className="hm-agenda-hora"><strong>{e.diaInteiro ? 'Dia todo' : horaLocal(e.inicio)}</strong><small>{diaCurto(dataLocal(e.inicio), hoje)}</small></span><span className="hm-agenda-evento"><span className="hm-agenda-linha" data-proximo={i === 0 || undefined} /><strong>{e.titulo}</strong><small>{e.diaInteiro ? 'Compromisso de dia inteiro' : `${horaLocal(e.inicio)} – ${horaLocal(e.fim)}`}{e.google ? ' · Google Agenda' : ''}</small></span><ChevronRight size={14} /></Link></li>)}</ul> : <div className="hm-vazio hm-vazio-agenda"><CalendarCheck2 /><h3>{agendaOk ? 'Espaço para focar' : 'Agenda parcialmente indisponível'}</h3><p>{agendaOk ? 'Nenhum compromisso nos próximos 14 dias. Que tal reservar um tempo para planejar?' : 'Abra a agenda para conferir seus compromissos.'}</p><Link href="/agenda">Organizar minha agenda <ArrowRight size={14} /></Link></div>}
          <div className="hm-agenda-rodape"><span><i />Horários de Belém</span><Link href="/reunioes">Reuniões <ArrowUpRight size={13} /></Link></div>
        </section>
      </div>

      <div className="hm-grade hm-grade-operacao">
        <section className="hm-cartao hm-panorama" aria-labelledby="hm-clientes-titulo">
          <div className="hm-cab"><div><h2 id="hm-clientes-titulo">Como estão os clientes<span className="hm-contagem">{clientesOk ? ativos : '—'} ativos</span></h2><p>Entregas, pendências e o próximo prazo de cada cliente.</p></div><Link href="/clientes">Ver clientes <ArrowUpRight size={14} /></Link></div>
          {!clientesOk ? <div className="hm-vazio"><Users /><h3>Panorama indisponível no momento</h3><p>Os dados podem ser consultados na área de clientes.</p><Link href="/clientes">Abrir clientes <ArrowRight size={14} /></Link></div> : clientes.length === 0 ? <div className="hm-vazio"><Users /><h3>Seus clientes vão aparecer aqui</h3><p>Acompanhe as entregas assim que os primeiros clientes forem cadastrados.</p><Link href="/clientes">Abrir clientes <ArrowRight size={14} /></Link></div> : <div className="hm-rolagem"><table className="hm-tabela"><thead><tr><th>Cliente / responsável</th><th>Abertas</th><th>Em atraso</th><th>Aprovação</th><th>Próx. prazo</th><th>Concluídas</th></tr></thead><tbody>{clientes.slice(0, 6).map((c) => {
            const porcentagem = c.total ? Math.round(c.concluidas / c.total * 100) : 0
            return <tr key={c.id}><td><Link className="hm-cliente" href={`/clientes/${c.id}`}><span className="hm-cliente-avatar" style={{ background: c.cor }}>{c.nome.split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase()}</span><span><strong>{c.nome}{c.pausado && <small>Pausado</small>}</strong><small>{c.responsavel}</small></span></Link></td><td>{c.abertas || '—'}</td><td><span className="hm-numero-atraso" data-ativo={c.atrasadas > 0 || undefined}>{c.atrasadas || '—'}</span></td><td>{conteudoOk ? c.aprovacao || '—' : '—'}</td><td>{c.proxima ? diaCurto(c.proxima, hoje) : '—'}</td><td><span className="hm-prog" aria-label={`${c.concluidas} de ${c.total} tarefas concluídas`}><span><span style={{ width: `${porcentagem}%` }} /></span><small>{c.total ? `${porcentagem}%` : '—'}</small></span></td></tr>
          })}</tbody></table></div>}
          <div className="hm-panorama-rodape"><span>Tarefas e subtarefas dos clientes visíveis para você.</span>{conteudoOk && <Link href="/agendamentos"><Send size={13} />{plural(r.agendados.length, 'post agendado', 'posts agendados')}<ArrowRight size={13} /></Link>}</div>
        </section>

        <section className="hm-cartao hm-cal" aria-label="Calendário do mês">
          <div className="hm-cab"><div><h2>{formatar(`${mes}-01`, { month: 'long', year: 'numeric' }).replace(/^./, (c) => c.toUpperCase())}</h2><p>Um olhar para as próximas datas.</p></div><CalendarDays size={18} /></div>
          <div className="hm-cal-grade"><div className="hm-cal-semana">{['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((d, i) => <span key={i}>{d}</span>)}</div><div className="hm-cal-dias">{grade.map((dia) => {
            const temEvento = eventos.some((e) => dataLocal(e.inicio) <= dia && Date.parse(e.fim) > Date.parse(`${dia}T00:00:00-03:00`))
            return <Link key={dia} href={`/agenda?data=${dia}&visao=dia`} aria-current={dia === hoje ? 'date' : undefined} aria-label={`${formatar(dia, { day: 'numeric', month: 'long' })}${feriados.get(dia) ? ` · ${feriados.get(dia)}` : ''}${temEvento ? ' · com compromisso' : ''}`} data-fora={!dia.startsWith(mes) || undefined} data-feriado={feriados.has(dia) || undefined}>{Number(dia.slice(8))}{temEvento && <i />}</Link>
          })}</div></div>
          {feriado && <div className="hm-feriado"><PartyPopper size={18} /><span><small>{diasAte === 0 ? 'Feriado de hoje' : `Próximo feriado · ${diasAte === 1 ? 'amanhã' : `em ${diasAte} dias`}`}</small><strong>{feriado.nome}</strong></span><span>{formatar(feriado.data, { day: '2-digit', month: 'short' })}</span></div>}
        </section>
      </div>

      {children}

      <section className="hm-atalhos-secao" aria-labelledby="hm-atalhos-titulo"><div className="hm-secao-titulo"><Layers3 size={16} /><h2 id="hm-atalhos-titulo">Acesso rápido</h2></div><div className="hm-atalhos">{atalhos.map((a) => <Link href={a.href} key={a.href}><span className="hm-atalho-icone"><a.icone size={19} /></span><span><strong>{a.nome}</strong><small>{a.texto}</small></span><ArrowUpRight size={15} /></Link>)}</div></section>
      <footer className="hm-rodape"><span>Grupo SRV <i />Tudo pronto para o próximo passo.</span><span>{formatar(hoje, { day: '2-digit', month: '2-digit', year: 'numeric' })} · Belém</span></footer>
    </div>
  </div>
}
