import Link from 'next/link'
import { PERIODOS_PAINEL, formatarDuracao, type LinhaPainel, type Painel, type Saude } from '@/dominio/painel-projetos'

const SAUDE: Record<Saude, { rotulo: string; classe: string }> = {
  saudavel: { rotulo: 'Em foco', classe: 'bg-sucesso-fundo text-sucesso-forte' },
  atencao: { rotulo: 'Precisa de atenção', classe: 'bg-perigo-fundo text-perigo-forte' },
  concluido: { rotulo: 'Tudo entregue', classe: 'bg-fundo text-texto-2' },
  vazio: { rotulo: 'Sem tarefas', classe: 'bg-fundo text-texto-3' },
}
const dia = (iso: string) => iso.split('-').reverse().slice(0, 2).join('/')

function Cartao({ rotulo, valor, detalhe, tom }: { rotulo: string; valor: string; detalhe?: string; tom?: 'bom' | 'ruim' }) {
  return (
    <div className="rounded-lg border border-borda p-3">
      <p className="text-legenda font-medium text-texto-3">{rotulo}</p>
      <p className={`mt-1 text-xl font-bold tabular-nums ${tom === 'bom' ? 'text-sucesso' : tom === 'ruim' ? 'text-perigo' : 'text-texto'}`}>{valor}</p>
      {detalhe && <p className="mt-0.5 text-legenda text-texto-3">{detalhe}</p>}
    </div>
  )
}

/** Barra com as tarefas concluídas, em andamento e pendentes. */
function Andamento({ l }: { l: Pick<LinhaPainel, 'total' | 'concluidas' | 'emAndamento' | 'pendentes'> }) {
  if (!l.total) return <span className="text-legenda text-texto-3">—</span>
  const pct = (n: number) => `${(n / l.total) * 100}%`
  return (
    <div className="min-w-28">
      <div className="flex h-1.5 overflow-hidden rounded-full bg-fundo" title={`${l.concluidas} concluídas, ${l.emAndamento} em andamento, ${l.pendentes} pendentes`}>
        <span className="bg-sucesso" style={{ width: pct(l.concluidas) }} />
        <span className="bg-aviso" style={{ width: pct(l.emAndamento) }} />
      </div>
      <p className="mt-0.5 text-micro tabular-nums text-texto-3">{l.concluidas}/{l.total} concluídas · {Math.round((l.concluidas / l.total) * 100)}%</p>
    </div>
  )
}

/**
 * Relatório de foco e andamento. `rotulo` diz o que é cada linha ("Projeto" ou "Tarefa"); `href` monta os links de
 * período e de "meu tempo / equipe" mantendo o resto da URL.
 */
export function PainelProjetos({ painel, rotulo, periodo, quem, href, vazio }: { painel: Painel; rotulo: string; periodo: number; quem: 'eu' | 'equipe'; href: (p: { periodo?: number; quem?: 'eu' | 'equipe' }) => string; vazio: string }) {
  const { linhas, totais, semanas } = painel
  const maiorSemana = Math.max(1, ...semanas.map((s) => s.segundos))
  const maiorLinha = Math.max(1, ...linhas.map((l) => l.segundosPeriodo))
  const atencao = linhas.filter((l) => l.saude === 'atencao')
  const ativas = linhas.filter((l) => l.saude !== 'vazio')
  const chip = (ativo: boolean) => `rounded-md px-2.5 py-1 text-rotulo font-semibold ${ativo ? 'bg-white text-texto shadow-sm' : 'text-texto-2 hover:text-texto'}`

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <nav className="flex gap-0.5 rounded-lg bg-fundo p-0.5" aria-label="Período">
          {PERIODOS_PAINEL.map((p) => <Link key={p} href={href({ periodo: p })} scroll={false} className={chip(p === periodo)}>{p} dias</Link>)}
        </nav>
        <nav className="flex gap-0.5 rounded-lg bg-fundo p-0.5" aria-label="Tempo de quem">
          <Link href={href({ quem: 'eu' })} scroll={false} className={chip(quem === 'eu')}>Meu tempo</Link>
          <Link href={href({ quem: 'equipe' })} scroll={false} className={chip(quem === 'equipe')}>Equipe toda</Link>
        </nav>
        <span className="text-legenda text-texto-3">desde {dia(painel.inicioPeriodo)}</span>
      </div>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-5" aria-label="Resumo">
        <Cartao rotulo="Tempo investido" valor={formatarDuracao(totais.segundosPeriodo)} detalhe={`${formatarDuracao(totais.segundosTotal)} desde o início`} />
        <Cartao rotulo="Concluídas no período" valor={String(totais.concluidasPeriodo)} detalhe={`${totais.concluidas} de ${totais.total} no total`} tom="bom" />
        <Cartao rotulo="Em andamento" valor={String(totais.emAndamento)} />
        <Cartao rotulo="Pendentes" valor={String(totais.pendentes)} />
        <Cartao rotulo="Atrasadas" valor={String(totais.atrasadas)} tom={totais.atrasadas ? 'ruim' : undefined} detalhe="prazo vencido, não concluídas" />
      </section>

      <section className="grid gap-3 lg:grid-cols-[1fr_2fr]">
        <div className="rounded-lg border border-borda p-3">
          <h2 className="mb-2 text-rotulo font-semibold text-texto">Tempo por semana</h2>
          <div className="flex h-32 items-end gap-1.5">
            {semanas.map((s) => (
              <div key={s.inicio} className="flex h-full min-w-0 flex-1 flex-col justify-end gap-1" title={`Semana de ${dia(s.inicio)}: ${formatarDuracao(s.segundos)}`}>
                <span className="text-center text-micro tabular-nums text-texto-3">{s.segundos ? formatarDuracao(s.segundos).split(' ')[0] : ''}</span>
                <span className="mx-auto w-full max-w-7 rounded-t bg-petroleo" style={{ height: `${(s.segundos / maiorSemana) * 100}%` }} />
                <span className="truncate text-center text-micro text-texto-3">{dia(s.inicio)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-borda p-3">
          <h2 className="mb-2 text-rotulo font-semibold text-texto">Onde está o foco <span className="font-normal text-texto-3">· tempo no período</span></h2>
          {totais.segundosPeriodo === 0 ? (
            <p className="py-6 text-center text-rotulo text-texto-3">Nenhum tempo lançado no período. Use o cronômetro ou &quot;Lançar tempo&quot; nas tarefas.</p>
          ) : (
            <ol className="space-y-1.5">
              {linhas.filter((l) => l.segundosPeriodo > 0).map((l) => (
                <li key={l.id} className="text-rotulo">
                  <div className="flex justify-between gap-2">
                    <Link href={l.href} className="flex min-w-0 items-center gap-2 text-texto hover:underline"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: l.cor }} /><span className="truncate">{l.nome}</span></Link>
                    <span className="shrink-0 tabular-nums text-texto-2">{formatarDuracao(l.segundosPeriodo)} <span className="text-texto-3">· {Math.round(l.participacao * 100)}%</span></span>
                  </div>
                  <div className="mt-0.5 h-1.5 rounded-full bg-fundo"><div className="h-1.5 rounded-full" style={{ width: `${(l.segundosPeriodo / maiorLinha) * 100}%`, background: l.cor }} /></div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      {atencao.length > 0 && (
        <section className="rounded-lg border border-perigo-borda bg-perigo-fundo/40 p-3">
          <h2 className="mb-1 text-rotulo font-semibold text-perigo-forte">Precisando de atenção ({atencao.length})</h2>
          <p className="mb-2 text-legenda text-texto-2">Com tarefas abertas e sem tempo lançado nem entrega nos últimos 7 dias.</p>
          <ul className="flex flex-wrap gap-1.5">
            {atencao.map((l) => (
              <li key={l.id}>
                <Link href={l.href} className="flex items-center gap-1.5 rounded-full border border-borda bg-white px-2.5 py-1 text-rotulo hover:bg-hover">
                  <span className="h-2 w-2 rounded-full" style={{ background: l.cor }} /> {l.nome}
                  <span className="text-legenda text-texto-3">{l.ultimaAtividade ? `última atividade ${dia(l.ultimaAtividade)}` : 'sem atividade'}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {ativas.length === 0 ? (
        <p className="rounded-lg border border-dashed border-borda py-12 text-center text-corpo text-texto-3">{vazio}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-borda">
          <table className="w-full min-w-[820px] text-left text-rotulo">
            <thead className="bg-fundo/70 text-legenda font-medium text-texto-3">
              <tr>
                <th className="px-3 py-2">{rotulo}</th>
                <th className="px-3 py-2 text-right">Tempo no período</th>
                <th className="px-3 py-2 text-right">Tempo total</th>
                <th className="px-3 py-2">Andamento</th>
                <th className="px-3 py-2 text-right">Em andamento</th>
                <th className="px-3 py-2 text-right">Pendentes</th>
                <th className="px-3 py-2 text-right">Atrasadas</th>
                <th className="px-3 py-2">Última atividade</th>
                <th className="px-3 py-2">Situação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borda">
              {ativas.map((l) => (
                <tr key={l.id} className="hover:bg-hover/50">
                  <td className="max-w-64 px-3 py-2">
                    <Link href={l.href} className="flex min-w-0 items-center gap-2 font-medium text-texto hover:underline"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: l.cor }} /><span className="truncate">{l.nome}</span></Link>
                    {l.detalhe && <span className="block truncate pl-[18px] text-legenda text-texto-3">{l.detalhe}</span>}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-texto">{formatarDuracao(l.segundosPeriodo)}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-texto-2">{formatarDuracao(l.segundosTotal)}</td>
                  <td className="px-3 py-2"><Andamento l={l} /></td>
                  <td className="px-3 py-2 text-right tabular-nums">{l.emAndamento}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{l.pendentes}</td>
                  <td className={`px-3 py-2 text-right tabular-nums ${l.atrasadas ? 'font-semibold text-perigo' : ''}`}>{l.atrasadas}</td>
                  <td className="px-3 py-2 tabular-nums text-texto-2">{l.ultimaAtividade ? dia(l.ultimaAtividade) : '—'}</td>
                  <td className="px-3 py-2"><span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-legenda font-medium ${SAUDE[l.saude].classe}`}>{SAUDE[l.saude].rotulo}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
