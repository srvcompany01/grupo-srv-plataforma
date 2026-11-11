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
    <div>
      <p>{rotulo}</p>
      <p>{valor}</p>
      {detalhe && <p>{detalhe}</p>}
    </div>
  )
}

/** Barra com as tarefas concluídas, em andamento e pendentes. */
function Andamento({ l }: { l: Pick<LinhaPainel, 'total' | 'concluidas' | 'emAndamento' | 'pendentes'> }) {
  if (!l.total) return <span>—</span>
  const pct = (n: number) => `${(n / l.total) * 100}%`
  return (
    <div>
      <div title={`${l.concluidas} concluídas, ${l.emAndamento} em andamento, ${l.pendentes} pendentes`}>
        <span style={{ width: pct(l.concluidas) }} />
        <span style={{ width: pct(l.emAndamento) }} />
      </div>
      <p>{l.concluidas}/{l.total} concluídas · {Math.round((l.concluidas / l.total) * 100)}%</p>
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
    <div>
      <div>
        <nav aria-label="Período">
          {PERIODOS_PAINEL.map((p) => <Link key={p} href={href({ periodo: p })} scroll={false}>{p} dias</Link>)}
        </nav>
        <nav aria-label="Tempo de quem">
          <Link href={href({ quem: 'eu' })} scroll={false}>Meu tempo</Link>
          <Link href={href({ quem: 'equipe' })} scroll={false}>Equipe toda</Link>
        </nav>
        <span>desde {dia(painel.inicioPeriodo)}</span>
      </div>

      <section aria-label="Resumo">
        <Cartao rotulo="Tempo investido" valor={formatarDuracao(totais.segundosPeriodo)} detalhe={`${formatarDuracao(totais.segundosTotal)} desde o início`} />
        <Cartao rotulo="Concluídas no período" valor={String(totais.concluidasPeriodo)} detalhe={`${totais.concluidas} de ${totais.total} no total`} tom="bom" />
        <Cartao rotulo="Em andamento" valor={String(totais.emAndamento)} />
        <Cartao rotulo="Pendentes" valor={String(totais.pendentes)} />
        <Cartao rotulo="Atrasadas" valor={String(totais.atrasadas)} tom={totais.atrasadas ? 'ruim' : undefined} detalhe="prazo vencido, não concluídas" />
      </section>

      <section>
        <div>
          <h2>Tempo por semana</h2>
          <div>
            {semanas.map((s) => (
              <div key={s.inicio} title={`Semana de ${dia(s.inicio)}: ${formatarDuracao(s.segundos)}`}>
                <span>{s.segundos ? formatarDuracao(s.segundos).split(' ')[0] : ''}</span>
                <span style={{ height: `${(s.segundos / maiorSemana) * 100}%` }} />
                <span>{dia(s.inicio)}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h2>Onde está o foco <span>· tempo no período</span></h2>
          {totais.segundosPeriodo === 0 ? (
            <p>Nenhum tempo lançado no período. Use o cronômetro ou &quot;Lançar tempo&quot; nas tarefas.</p>
          ) : (
            <ol>
              {linhas.filter((l) => l.segundosPeriodo > 0).map((l) => (
                <li key={l.id}>
                  <div>
                    <Link href={l.href}><span style={{ background: l.cor }} /><span>{l.nome}</span></Link>
                    <span>{formatarDuracao(l.segundosPeriodo)} <span>· {Math.round(l.participacao * 100)}%</span></span>
                  </div>
                  <div><div style={{ width: `${(l.segundosPeriodo / maiorLinha) * 100}%`, background: l.cor }} /></div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      {atencao.length > 0 && (
        <section>
          <h2>Precisando de atenção ({atencao.length})</h2>
          <p>Com tarefas abertas e sem tempo lançado nem entrega nos últimos 7 dias.</p>
          <ul>
            {atencao.map((l) => (
              <li key={l.id}>
                <Link href={l.href}>
                  <span style={{ background: l.cor }} /> {l.nome}
                  <span>{l.ultimaAtividade ? `última atividade ${dia(l.ultimaAtividade)}` : 'sem atividade'}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {ativas.length === 0 ? (
        <p>{vazio}</p>
      ) : (
        <div>
          <table>
            <thead>
              <tr>
                <th>{rotulo}</th>
                <th>Tempo no período</th>
                <th>Tempo total</th>
                <th>Andamento</th>
                <th>Em andamento</th>
                <th>Pendentes</th>
                <th>Atrasadas</th>
                <th>Última atividade</th>
                <th>Situação</th>
              </tr>
            </thead>
            <tbody>
              {ativas.map((l) => (
                <tr key={l.id}>
                  <td>
                    <Link href={l.href}><span style={{ background: l.cor }} /><span>{l.nome}</span></Link>
                    {l.detalhe && <span>{l.detalhe}</span>}
                  </td>
                  <td>{formatarDuracao(l.segundosPeriodo)}</td>
                  <td>{formatarDuracao(l.segundosTotal)}</td>
                  <td><Andamento l={l} /></td>
                  <td>{l.emAndamento}</td>
                  <td>{l.pendentes}</td>
                  <td>{l.atrasadas}</td>
                  <td>{l.ultimaAtividade ? dia(l.ultimaAtividade) : '—'}</td>
                  <td><span>{SAUDE[l.saude].rotulo}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
