import { Briefcase, Settings2 } from 'lucide-react'
import Link from 'next/link'
import { EstadoVazio } from '@/componentes/EstadoVazio'
import { PainelDoEscopo } from '@/componentes/projetos/PainelDoEscopo'
import { formatarDuracao } from '@/dominio/painel-projetos'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { espacoDeProjetos, painelDoEscopo, projetosDoEspaco } from '@/servicos/painel-projetos'
import { BotaoConfigurar } from './BotaoConfigurar'

const texto = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

export default async function Projetos({ searchParams }: PageProps<'/projetos'>) {
  const sp = await searchParams
  const eu = await exigirEquipe()
  const sb = await criarClienteServidor()
  // Sem a migration (coluna is_projects), a página explica em vez de quebrar.
  const espaco = await espacoDeProjetos(sb).catch(() => null)
  const aba = texto(sp.aba) === 'painel' ? 'painel' : 'projetos'

  if (!espaco) {
    return (
      <div className="page-shell">
        <div>
          <p className="eyebrow">Acompanhamento</p>
          <h1 className="page-title mt-1">Projetos</h1>
        </div>
        <EstadoVazio
          icone={Briefcase}
          titulo="Os projetos ainda não foram configurados"
          descricao={eu.papel === 'admin' ? 'Vamos usar um espaço "Projetos": cada lista dele é um projeto (um por cliente) e as tarefas e subtarefas são o que está sendo desenvolvido. Se já existir um espaço com esse nome, ele é aproveitado.' : 'Peça ao admin para configurar o espaço de projetos.'}
        >
          {eu.papel === 'admin' && <BotaoConfigurar />}
        </EstadoVazio>
      </div>
    )
  }

  const abaLink = (a: 'projetos' | 'painel', rotulo: string) => (
    <Link href={a === 'painel' ? '/projetos?aba=painel' : '/projetos'} className={`-mb-px border-b-2 pb-2.5 text-corpo font-semibold ${aba === a ? 'border-texto text-texto' : 'border-transparent text-texto-2 hover:text-texto'}`}>{rotulo}</Link>
  )

  return (
    <div className="page-shell">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Acompanhamento</p>
          <h1 className="page-title mt-1">Projetos</h1>
        </div>
        <Link href={`/espacos/${espaco.id}?aba=estrutura`} className="flex items-center gap-1.5 rounded-full border border-borda px-3 py-1.5 text-rotulo font-semibold text-texto-2 transition hover:bg-hover hover:text-texto">
          <Settings2 className="h-3.5 w-3.5" /> Novo projeto / organizar
        </Link>
      </div>
      <nav className="flex gap-6 border-b border-borda">{abaLink('projetos', 'Projetos')}{abaLink('painel', 'Painel')}</nav>
      {aba === 'painel' ? <PainelDoEscopo escopo={{ espacoId: espaco.id }} caminho="/projetos" sp={{ ...sp, aba: 'painel' }} euId={eu.id} /> : <Cartoes espacoId={espaco.id} euId={eu.id} />}
    </div>
  )
}

/** Um cartão por projeto: andamento das tarefas e o seu tempo nos últimos 30 dias. */
async function Cartoes({ espacoId, euId }: { espacoId: string; euId: string }) {
  const sb = await criarClienteServidor()
  const projetos = await projetosDoEspaco(sb, espacoId)
  if (!projetos.length) {
    return <EstadoVazio icone={Briefcase} titulo="Nenhum projeto ainda" descricao='Use "Novo projeto / organizar" para criar uma lista para cada cliente ou projeto.' />
  }
  const { linhas } = await painelDoEscopo(sb, { espacoId }, { dias: 30, usuarioId: euId, agora: new Date() })
  const porId = new Map(linhas.map((l) => [l.id, l]))
  return (
    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {projetos.map((p) => {
        const l = porId.get(p.id)!
        const pct = l.total ? Math.round((l.concluidas / l.total) * 100) : 0
        return (
          <li key={p.id}>
            <Link href={`/listas/${p.id}`} className="block h-full rounded-xl border border-borda bg-white p-4 transition hover:-translate-y-0.5 hover:border-borda-forte">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 truncate text-corpo font-semibold text-texto"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: p.cor }} />{p.nome}</p>
                  {p.clienteNome && <p className="truncate pl-[18px] text-legenda text-texto-3">{p.clienteNome}</p>}
                </div>
                {l.saude === 'atencao' && <span className="shrink-0 rounded-full bg-perigo-fundo px-2 py-0.5 text-legenda font-medium text-perigo-forte">Atenção</span>}
              </div>
              <div className="mt-3 flex h-1.5 overflow-hidden rounded-full bg-fundo">
                <span className="bg-sucesso" style={{ width: `${l.total ? (l.concluidas / l.total) * 100 : 0}%` }} />
                <span className="bg-aviso" style={{ width: `${l.total ? (l.emAndamento / l.total) * 100 : 0}%` }} />
              </div>
              <p className="mt-1 text-legenda text-texto-3">{l.total ? `${l.concluidas} de ${l.total} concluídas (${pct}%) · ${l.emAndamento} em andamento · ${l.pendentes} pendentes` : 'Nenhuma tarefa ainda'}</p>
              <p className="mt-2 text-rotulo text-texto-2">Seu tempo em 30 dias: <span className="font-semibold tabular-nums text-texto">{formatarDuracao(l.segundosPeriodo)}</span></p>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
