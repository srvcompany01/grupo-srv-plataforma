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
    <div>
      <h2>{titulo} ({linhas.length})</h2>
      {linhas.length === 0 ? (
        <p>{vazio}</p>
      ) : (
        <ol>
          {linhas.map((c) => (
            <li key={c.id}>
              <div>
                <Link href={`/clientes/${c.id}`}>
                  <span style={{ background: c.cor }} />
                  <NomeCliente nome={c.nome} />
                </Link>
                <span>
                  {c.dias} {c.dias === 1 ? 'dia' : 'dias'}
                  <span>{c.ultimo ? `último ${dia(c.ultimo)}` : 'nenhum no período'}</span>
                </span>
              </div>
              <div><div style={{ width: `${(c.dias / maior) * 100}%` }} /></div>
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
    <div>
      <header>
        <div>
          <Link href="/clientes" aria-label="Voltar para clientes"><ArrowLeft /></Link>
          <h1><BarChart3 /> Clientes trabalhados</h1>
        </div>
        <nav aria-label="Período">
          {PERIODOS.map((p) => (
            <Link key={p} href={`/clientes/relatorio?dias=${p}`}>{p} dias</Link>
          ))}
        </nav>
      </header>

      <main>
        <section>
          <h2>Clientes por dia <span>· média de {media.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} por dia</span></h2>
          <div>
            {porDia.map((d) => (
              <div key={d.dia} title={`${dia(d.dia)}: ${d.total} ${d.total === 1 ? 'cliente' : 'clientes'}`}>
                <span>{d.total || ''}</span>
                <span style={{ height: `${(d.total / maiorDia) * 100}%` }} />
                <span>{periodo === 7 ? semana(d.dia) : dia(d.dia)}</span>
              </div>
            ))}
          </div>
        </section>

        <p>Saudável: trabalhado em pelo menos {minimo} dos últimos {periodo} dias (2 por semana). Só conta as suas marcas no botão ✓ da galeria.</p>

        <section>
          <Lista titulo="Saudáveis" tom="bom" linhas={ranking.filter((c) => c.saudavel)} maior={maior} vazio="Nenhum cliente com ritmo saudável neste período." />
          <Lista titulo="Precisando de atenção" tom="ruim" linhas={ranking.filter((c) => !c.saudavel).reverse()} maior={maior} vazio="Todos os clientes estão em dia." />
        </section>
      </main>
    </div>
  )
}
