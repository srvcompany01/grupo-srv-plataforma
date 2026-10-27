import { Eye, Link2, MousePointerClick, Sparkles, Star, Target, Users } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { BlocoAnalise, Numeros } from '@/componentes/insights/BlocoAnalise'
import { GraficoDiario } from '@/componentes/insights/GraficoDiario'
import { Modulo } from '@/componentes/Modulo'
import { NomeCliente } from '@/componentes/NomeCliente'
import { analisarBio, analisarQuiz, ROTULO_ORIGEM, type ResumoBio } from '@/dominio/bio'
import { MODULOS, type ModuloBiolytics } from '@/dominio/biolytics'
import { consultaPeriodo, diasDoPeriodo, rotuloPeriodo, type PeriodoAnuncios } from '@/dominio/periodo-anuncios'
import type { Cliente } from '@/servicos/clientes-plataforma'

const n = (v: number) => v.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
const pct = (v: number) => `${n(v)}%`
const q = (periodo: PeriodoAnuncios) => (consultaPeriodo(periodo) ? `&${consultaPeriodo(periodo)}` : '')
export const hrefBiolytics = (aba: string, c: Cliente, periodo: PeriodoAnuncios) => `/biolytics?aba=${aba}&cliente=${c.id}${q(periodo)}`

export const Vazio = ({ children }: { children: ReactNode }) => <p className="rounded-xl border border-dashed border-borda py-8 text-center text-rotulo text-texto-3">{children}</p>

/** Sem cliente escolhido: todos os clientes lado a lado. */
export function VisaoTodos({ linhas, periodo }: { linhas: { c: Cliente; r: ResumoBio | null }[]; periodo: PeriodoAnuncios }) {
  const ativos = linhas.filter((l) => l.r && (l.r.cliques > 0 || l.r.visualizacoes > 0 || l.r.toques > 0 || l.r.leadsOrganicos > 0)).sort((a, b) => (b.r?.leadsOrganicos ?? 0) - (a.r?.leadsOrganicos ?? 0) || (b.r?.cliques ?? 0) - (a.r?.cliques ?? 0))
  const sem = linhas.filter((l) => !l.r)
  return (
    <>
      <Modulo icone={Link2} titulo="Todos os clientes" descricao={`${rotuloPeriodo(periodo)} · o que o Biolytics captou em cada cliente`}>
        {ativos.length === 0 ? <Vazio>Nenhuma atividade nas páginas neste período.</Vazio> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[44rem] text-rotulo">
              <thead>
                <tr className="border-b border-borda text-left text-legenda text-texto-3">
                  <th className="py-2 pr-3 font-medium">Cliente</th>
                  {['Cliques no link', 'Visualizações', 'Abriram o quiz', 'Leads orgânicos', 'Conclusão do quiz'].map((h) => <th key={h} className="py-2 pr-3 text-right font-medium last:pr-0">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {ativos.map(({ c, r }) => (
                  <tr key={c.id} className="border-b border-borda/60 last:border-0">
                    <td className="py-2 pr-3"><NomeCliente nome={c.nome} href={hrefBiolytics('geral', c, periodo)} /></td>
                    {[n(r!.cliques), n(r!.visualizacoes), n(r!.quiz.iniciaram), n(r!.leadsOrganicos), r!.quiz.iniciaram ? pct((r!.quiz.concluiram / r!.quiz.iniciaram) * 100) : '—'].map((x, i) => <td key={i} className="py-2 pr-3 text-right tabular-nums last:pr-0">{x}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modulo>
      {sem.length > 0 && (
        <Modulo icone={Sparkles} titulo="Ainda sem Biolytics" descricao="Clientes que ainda não têm página criada">
          <ul className="flex flex-wrap gap-2">{sem.map(({ c }) => <li key={c.id}><Link href={hrefBiolytics('bio', c, periodo)} className="inline-block rounded-lg border border-borda bg-white px-3 py-1.5 hover:bg-hover"><NomeCliente nome={c.nome} /></Link></li>)}</ul>
        </Modulo>
      )}
    </>
  )
}

/** Visão geral de um cliente: os módulos dele com os números principais e o caminho para cada um. */
export function GeralCliente({ c, periodo, r, ativos }: { c: Cliente; periodo: PeriodoAnuncios; r: ResumoBio | null; ativos: ModuloBiolytics[] }) {
  return (
    <>
      {r && (
        <Modulo icone={Link2} titulo="Visão geral" descricao={<><NomeCliente nome={c.nome} href={`/clientes/${c.id}`} /> · {rotuloPeriodo(periodo)}</>}>
          <Numeros itens={[
            { rotulo: 'Leads orgânicos', valor: n(r.leadsOrganicos), extra: 'quiz concluído', icone: Users, cor: '#eb6834' },
            { rotulo: 'Cliques no link da bio', valor: n(r.cliques), extra: r.cliques ? `${pct((r.visualizacoes / r.cliques) * 100)} abriram a página` : undefined, icone: MousePointerClick, cor: '#1baf7a' },
            { rotulo: 'Visualizações', valor: n(r.visualizacoes), icone: Eye, cor: '#2a78d6' },
            { rotulo: 'Abriram o quiz', valor: n(r.quiz.iniciaram), extra: r.quiz.iniciaram ? `${pct((r.quiz.concluiram / r.quiz.iniciaram) * 100)} terminaram` : undefined, icone: Target, cor: '#6250d6' },
          ]} />
        </Modulo>
      )}
      <Modulo icone={Sparkles} titulo="Módulos do cliente" descricao="Tudo que o Biolytics faz por este cliente">
        <ul className="grid gap-3 md:grid-cols-2">
          {MODULOS.map((m) => {
            const ligado = ativos.includes(m.id)
            return (
              <li key={m.id} className="flex flex-col gap-2 rounded-xl border border-borda bg-white p-3">
                <div className="flex items-center justify-between gap-2">
                  <strong className="text-texto">{m.nome}</strong>
                  <span className={`rounded-full px-2 py-0.5 text-micro font-semibold ${ligado ? 'bg-sucesso-fundo text-sucesso-forte' : 'bg-fundo text-texto-3'}`}>{ligado ? 'Ativo' : 'Não criado'}</span>
                </div>
                <p className="text-legenda text-texto-3">{m.descricao}</p>
                <Link href={hrefBiolytics(m.id, c, periodo)} className="text-rotulo font-semibold text-petroleo hover:underline">{ligado ? 'Ver números e configurar' : 'Criar'}</Link>
              </li>
            )
          })}
        </ul>
      </Modulo>
    </>
  )
}

/** Relatório do link da bio: cliques, visualizações, botões e origens. */
export function RelatorioBio({ c, periodo, r }: { c: Cliente; periodo: PeriodoAnuncios; r: ResumoBio }) {
  const dias = diasDoPeriodo(periodo)
  const porDia = new Map(r.porDia.map((d) => [d.dia, d]))
  const maior = Math.max(1, ...r.botoes.map((b) => b.toques))
  return (
    <>
      <Modulo icone={Link2} titulo="Link da bio" descricao={<><NomeCliente nome={c.nome} href={`/clientes/${c.id}`} /> · {rotuloPeriodo(periodo)}</>}>
        <div className="space-y-4">
          <Numeros itens={[
            { rotulo: 'Cliques no link da bio', valor: n(r.cliques), extra: 'vezes que tocaram no link do perfil', icone: MousePointerClick, cor: '#1baf7a' },
            { rotulo: 'Visualizações da página', valor: n(r.visualizacoes), extra: r.cliques ? `${pct((r.visualizacoes / r.cliques) * 100)} dos cliques abriram${r.pessoas ? ` · ${n(r.pessoas)} pessoas distintas por dia` : ''}` : undefined, icone: Eye, cor: '#2a78d6' },
            { rotulo: 'Toques nos botões', valor: n(r.toques), extra: r.visualizacoes ? `${n(r.toques / r.visualizacoes)} por visualização` : undefined, icone: Target, cor: '#6250d6' },
            { rotulo: 'Botão mais tocado', valor: r.toques ? r.botoes[0].rotulo : '—', extra: r.toques ? `${n(r.botoes[0].toques)} toques` : undefined, icone: Star, cor: '#eda100' },
          ]} />
          <GraficoDiario titulo="Cliques, visualizações e toques por dia" dias={dias} series={[{ nome: 'Cliques', valores: dias.map((d) => porDia.get(d)?.cliques ?? 0) }, { nome: 'Visualizações', valores: dias.map((d) => porDia.get(d)?.visualizacoes ?? 0) }, { nome: 'Toques', valores: dias.map((d) => porDia.get(d)?.toques ?? 0) }]} formato={(v) => n(Math.round(v))} />
        </div>
      </Modulo>
      <Modulo icone={MousePointerClick} titulo="Toques por botão" descricao="Quantas vezes cada botão da página foi tocado no período">
        {r.botoes.length === 0 ? <Vazio>A página não tem botões ainda.</Vazio> : (
          <ul className="space-y-2">
            {r.botoes.map((b) => (
              <li key={b.id} className="space-y-1">
                <div className="flex items-baseline justify-between gap-3 text-rotulo">
                  <span className="font-semibold text-texto">{b.rotulo}{!b.ativo && <span className="ml-1.5 text-legenda font-normal text-texto-3">(removido)</span>}</span>
                  <span className="tabular-nums text-texto-2"><strong className="text-texto">{n(b.toques)}</strong>{r.toques ? ` · ${pct((b.toques / r.toques) * 100)} dos toques` : ''}{r.visualizacoes ? ` · ${pct((b.toques / r.visualizacoes) * 100)} das visualizações` : ''}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-fundo"><div className="h-full rounded-full bg-[#6250d6]" style={{ width: `${(b.toques / maior) * 100}%` }} /></div>
              </li>
            ))}
          </ul>
        )}
      </Modulo>
      {r.porOrigem.length > 0 && (
        <Modulo icone={Link2} titulo="De onde vêm os cliques" descricao="Cada endereço tem uma origem: bio, stories ou anúncios">
          <ul className="space-y-1 text-rotulo">{r.porOrigem.map((o) => <li key={o.origem} className="flex justify-between gap-3"><span className="text-texto-2">{ROTULO_ORIGEM[o.origem] ?? o.origem}</span><span className="tabular-nums"><strong>{n(o.cliques)}</strong> cliques · {n(o.visualizacoes)} visualizações{r.cliques ? ` · ${pct((o.cliques / r.cliques) * 100)}` : ''}</span></li>)}</ul>
        </Modulo>
      )}
      <Modulo icone={Star} titulo="Insights e recomendações do link da bio" descricao="O que os números mostram e o que fazer">
        <BlocoAnalise analise={analisarBio(r)} />
      </Modulo>
    </>
  )
}

/** Relatório do quiz: funil (abriram → terminaram), leads por dia e o que as pessoas responderam. */
export function RelatorioQuiz({ c, periodo, r }: { c: Cliente; periodo: PeriodoAnuncios; r: ResumoBio }) {
  const dias = diasDoPeriodo(periodo)
  const porDia = new Map(r.porDia.map((d) => [d.dia, d]))
  const { iniciaram, concluiram } = r.quiz
  return (
    <>
      <Modulo icone={Target} titulo="Quiz do WhatsApp" descricao={<><NomeCliente nome={c.nome} href={`/clientes/${c.id}`} /> · {rotuloPeriodo(periodo)} · lead orgânico = quiz concluído (uma vez por pessoa por dia)</>}>
        <div className="space-y-4">
          <Numeros itens={[
            { rotulo: 'Leads orgânicos', valor: n(concluiram), extra: 'responderam e abriram o WhatsApp', icone: Users, cor: '#eb6834' },
            { rotulo: 'Abriram o quiz', valor: n(iniciaram), extra: r.visualizacoes ? `${pct((iniciaram / r.visualizacoes) * 100)} das visualizações da página` : undefined, icone: MousePointerClick, cor: '#6250d6' },
            { rotulo: 'Conclusão', valor: iniciaram ? pct((concluiram / iniciaram) * 100) : '—', extra: iniciaram ? `${n(iniciaram - concluiram)} desistiram no meio` : undefined, icone: Target, cor: '#1baf7a' },
          ]} />
          <GraficoDiario titulo="Leads orgânicos por dia" dias={dias} series={[{ nome: 'Leads', valores: dias.map((d) => porDia.get(d)?.leads ?? 0) }]} formato={(v) => n(Math.round(v))} />
        </div>
      </Modulo>
      {r.quiz.respostas.length > 0 && (
        <Modulo icone={Users} titulo="Respostas do quiz" descricao="O que as pessoas disseram antes de abrir o WhatsApp">
          <div className="grid gap-4 md:grid-cols-2">
            {r.quiz.respostas.map((p) => (
              <div key={p.pergunta} className="space-y-1.5">
                <h3 className="text-rotulo font-semibold">{p.pergunta}</h3>
                <ul className="space-y-1 text-rotulo">{p.opcoes.map((o) => <li key={o.opcao} className="flex justify-between gap-3"><span className="text-texto-2">{o.opcao}</span><span className="tabular-nums"><strong>{n(o.n)}</strong> · {pct((o.n / p.total) * 100)}</span></li>)}</ul>
              </div>
            ))}
          </div>
        </Modulo>
      )}
      <Modulo icone={Star} titulo="Insights e recomendações do quiz" descricao="O que os números mostram e o que fazer">
        <BlocoAnalise analise={analisarQuiz(r)} />
      </Modulo>
    </>
  )
}
