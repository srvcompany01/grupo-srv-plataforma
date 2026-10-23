import { ArrowLeft, BarChart3 } from 'lucide-react'
import Link from 'next/link'
import { dataDeHoje } from '@/dominio/filtros'
import { PERIODOS, diasDoPeriodo, lerPeriodo, rankingDeTrabalho, type LinhaRanking } from '@/dominio/trabalho-clientes'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { listarClientes, marcasDeTrabalhoDesde } from '@/servicos/clientes-plataforma'
import { NomeCliente } from '@/componentes/NomeCliente'

const textoParam = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)
const semana = (iso: string) => new Intl.DateTimeFormat('pt-BR', { weekday: 'short', timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`)).replace('.', '')
const dia = (iso: string) => iso.split('-').reverse().slice(0, 2).join('/')

function Lista({ titulo, tom, linhas, maior, vazio }: { titulo: string; tom: 'bom' | 'ruim'; linhas: LinhaRanking[]; maior: number; vazio: string }) {
  return (
    <div className="rounded-xl border border-borda p-3">
      <h2 className={`mb-2 text-rotulo font-semibold ${tom === 'bom' ? 'text-sucesso' : 'text-perigo'}`}>{titulo} ({linhas.length})</h2>
      {linhas.length === 0 ? (
        <p className="py-6 text-center text-rotulo text-texto-3">{vazio}</p>
      ) : (
        <ol className="space-y-2">
          {linhas.map((c) => (
            <li key={c.id} className="text-rotulo">
              <div className="flex items-center justify-between gap-2">
                <Link href={`/clientes/${c.id}`} className="flex min-w-0 items-center gap-2 text-texto hover:underline">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: c.cor }} />
                  <NomeCliente nome={c.nome} className="truncate" />
                </Link>
                <span className="shrink-0 tabular-nums text-texto-2">
                  {c.dias} {c.dias === 1 ? 'dia' : 'dias'}
                  <span className="ml-2 text-legenda text-texto-3">{c.ultimo ? `último ${dia(c.ultimo)}` : 'nenhum no período'}</span>
                </span>
              </div>
              <div className="mt-0.5 h-1.5 rounded-full bg-fundo"><div className={`h-1.5 rounded-full ${tom === 'bom' ? 'bg-sucesso' : 'bg-perigo'}`} style={{ width: `${(c.dias / maior) * 100}%` }} /></div>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

export default async function RelatorioClientes({ searchParams }: PageProps<'/clientes/relatorio'>) {
  const sp = await searchParams
  await exigirEquipe()
  const periodo = lerPeriodo(textoParam(sp.dias))
  const dias = diasDoPeriodo(dataDeHoje(new Date()), periodo)
  const sb = await criarClienteServidor()
  const [clientes, marcas] = await Promise.all([listarClientes(sb), marcasDeTrabalhoDesde(sb, dias[0])])
  const { ranking, minimo, porDia } = rankingDeTrabalho(clientes.filter((c) => !c.interno && c.status !== 'encerrado'), marcas, dias)
  const maior = Math.max(1, ...ranking.map((c) => c.dias))
  const maiorDia = Math.max(1, ...porDia.map((d) => d.total))
  const media = porDia.reduce((s, d) => s + d.total, 0) / periodo

  return (
    <div className="min-h-full bg-white">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-borda px-4 py-3 md:px-5">
        <div className="flex items-center gap-2">
          <Link href="/clientes" aria-label="Voltar para clientes" className="rounded-lg p-1.5 text-texto-2 hover:bg-hover"><ArrowLeft className="h-4 w-4" /></Link>
          <h1 className="flex items-center gap-2 text-destaque font-bold text-texto"><BarChart3 className="h-4 w-4" /> Clientes trabalhados</h1>
        </div>
        <nav className="flex gap-0.5 rounded-lg bg-fundo p-0.5" aria-label="Período">
          {PERIODOS.map((p) => (
            <Link key={p} href={`/clientes/relatorio?dias=${p}`} className={`rounded-md px-2.5 py-1 text-rotulo font-semibold ${p === periodo ? 'bg-white text-texto shadow-sm' : 'text-texto-2 hover:text-texto'}`}>{p} dias</Link>
          ))}
        </nav>
      </header>

      <main className="space-y-4 p-4 md:p-5">
        <section className="rounded-xl border border-borda p-3">
          <h2 className="mb-2 text-rotulo font-semibold text-texto">Clientes por dia <span className="font-normal text-texto-3">· média de {media.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} por dia</span></h2>
          <div className="flex h-32 items-end gap-1">
            {porDia.map((d) => (
              <div key={d.dia} className="flex h-full min-w-0 flex-1 flex-col justify-end gap-1" title={`${dia(d.dia)}: ${d.total} ${d.total === 1 ? 'cliente' : 'clientes'}`}>
                <span className="text-center text-micro tabular-nums text-texto-2">{d.total || ''}</span>
                <span className="mx-auto w-full max-w-6 rounded-t bg-petroleo" style={{ height: `${(d.total / maiorDia) * 100}%` }} />
                <span className="truncate text-center text-micro text-texto-3">{periodo === 7 ? semana(d.dia) : dia(d.dia)}</span>
              </div>
            ))}
          </div>
        </section>

        <p className="text-legenda text-texto-3">Saudável: trabalhado em pelo menos {minimo} dos últimos {periodo} dias (2 por semana). Só conta as suas marcas no botão ✓ da galeria.</p>

        <section className="grid gap-3 lg:grid-cols-2">
          <Lista titulo="Saudáveis" tom="bom" linhas={ranking.filter((c) => c.saudavel)} maior={maior} vazio="Nenhum cliente com ritmo saudável neste período." />
          <Lista titulo="Precisando de atenção" tom="ruim" linhas={ranking.filter((c) => !c.saudavel).reverse()} maior={maior} vazio="Todos os clientes estão em dia." />
        </section>
      </main>
    </div>
  )
}
