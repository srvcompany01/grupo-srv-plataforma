import Link from 'next/link'
import { Ic } from '@/componentes/app/Ic'
import { QuadroEstrategia } from '@/componentes/estrategia/Quadros'
import { SeletorCliente } from '@/componentes/insights/SeletorCliente'
import { NomeCliente } from '@/componentes/NomeCliente'
import { METODOS, ehMetodo, preenchimento, type Metodo } from '@/dominio/estrategia'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { listarClientes } from '@/servicos/clientes-plataforma'
import { estrategiaDoCliente, estrategiasDeTodos } from '@/servicos/estrategia'

const texto = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? ''
const pct = (n: number) => `${Math.round(n * 100)}%`

/** Estratégia por cliente: estudo de público, jornada, posicionamento, arquitetura de receita e SWOT. */
export default async function Estrategia({ searchParams }: PageProps<'/estrategia'>) {
  await exigirEquipe()
  const sp = await searchParams
  const sb = await criarClienteServidor()
  const clientes = (await listarClientes(sb)).filter((c) => !c.interno && c.status !== 'encerrado')
  const escolhido = clientes.find((c) => c.id === texto(sp.cliente)) ?? null
  const pedida = texto(sp.secao)
  const secao: Metodo = ehMetodo(pedida) ? pedida : 'publico'
  const link = (m: Metodo, clienteId = escolhido?.id) => `/estrategia?secao=${m}${clienteId ? `&cliente=${clienteId}` : ''}`

  return (
    <div className="page-shell relatorio">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Estratégia do cliente</p>
          <h1 className="page-title mt-1">{escolhido ? <>Estratégia · <NomeCliente nome={escolhido.nome} /></> : 'Estratégia'}</h1>
        </div>
        <SeletorCliente base={`/estrategia?secao=${secao}`} clientes={clientes.map((c) => ({ id: c.id, nome: c.nome }))} atual={escolhido?.id ?? null} consultaPeriodo="" />
      </div>

      {escolhido ? <Cliente clienteId={escolhido.id} secao={secao} link={link} /> : <Panorama clientes={clientes} link={link} />}
    </div>
  )
}

async function Cliente({ clienteId, secao, link }: { clienteId: string; secao: Metodo; link: (m: Metodo) => string }) {
  const est = await estrategiaDoCliente(await criarClienteServidor(), clienteId)
  return (
    <>
      <nav className="flex gap-1 overflow-x-auto border-b border-borda [scrollbar-width:none]" aria-label="Seções da estratégia">
        {METODOS.map((m) => (
          <Link key={m.id} href={link(m.id)} aria-current={secao === m.id ? 'page' : undefined} className={`-mb-px inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-rotulo font-semibold ${secao === m.id ? 'border-petroleo text-texto' : 'border-transparent text-texto-2 hover:text-texto'}`}>
            <Ic n={m.icone} s={16} /> {m.rotulo}
            <span className="rounded-full bg-[var(--bg-active)] px-1.5 text-legenda tabular-nums text-texto-3">{pct(preenchimento(m.id, est[m.id]))}</span>
          </Link>
        ))}
      </nav>
      <QuadroEstrategia metodo={secao} clienteId={clienteId} inicial={est[secao]} />
    </>
  )
}

async function Panorama({ clientes, link }: { clientes: { id: string; nome: string }[]; link: (m: Metodo, clienteId?: string) => string }) {
  const todas = await estrategiasDeTodos(await criarClienteServidor())
  return (
    <section className="est">
      <div className="est-bloco">
        <header className="mb-3"><h2 className="text-[15px] font-semibold">Quanto cada cliente já tem construído</h2><p className="text-[12px] text-texto-3">Escolha um cliente acima ou clique numa porcentagem para abrir a seção.</p></header>
        <div className="overflow-x-auto">
          <table className="est-tabela">
            <thead><tr><th>Cliente</th>{METODOS.map((m) => <th key={m.id}>{m.curto}</th>)}</tr></thead>
            <tbody>
              {clientes.map((c) => (
                <tr key={c.id}>
                  <td><Link href={link('publico', c.id)} className="hover:underline"><NomeCliente nome={c.nome} /></Link></td>
                  {METODOS.map((m) => {
                    const p = todas[c.id] ? preenchimento(m.id, todas[c.id][m.id]) : 0
                    return (
                      <td key={m.id}>
                        <Link href={link(m.id, c.id)} className="flex items-center gap-2 tabular-nums">
                          <span className="est-prog w-16"><span style={{ width: pct(p) }} /></span>
                          <span className={p ? 'text-texto' : 'text-texto-3'}>{pct(p)}</span>
                        </Link>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
