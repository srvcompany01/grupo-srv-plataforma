import Link from 'next/link'
import { Ic } from '@/componentes/app/Ic'
import { QuadroEstrategia } from '@/componentes/estrategia/Quadros'
import { SeletorCliente } from '@/componentes/insights/SeletorCliente'
import { NomeCliente } from '@/componentes/NomeCliente'
import { METODOS, ehMetodo, preenchimento, type Metodo } from '@/dominio/estrategia'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { listarClientes } from '@/servicos/clientes-plataforma'
import { dataDeHoje } from '@/dominio/filtros'
import { estrategiaDoCliente, estrategiasDeTodos, numerosReaisDoCliente } from '@/servicos/estrategia'
import type { Cliente as ClienteDaPlataforma } from '@/servicos/clientes-plataforma'

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
    <div>
      <div>
        <div>
          <p>Estratégia do cliente</p>
          <h1>{escolhido ? <>Estratégia · <NomeCliente nome={escolhido.nome} /></> : 'Estratégia'}</h1>
        </div>
        <SeletorCliente base={`/estrategia?secao=${secao}`} clientes={clientes.map((c) => ({ id: c.id, nome: c.nome }))} atual={escolhido?.id ?? null} consultaPeriodo="" />
      </div>

      {escolhido ? <Cliente cliente={escolhido} secao={secao} link={link} /> : <Panorama clientes={clientes} link={link} />}
    </div>
  )
}

async function Cliente({ cliente, secao, link }: { cliente: ClienteDaPlataforma; secao: Metodo; link: (m: Metodo) => string }) {
  const sb = await criarClienteServidor()
  const clienteId = cliente.id
  // Só a Arquitetura de Receita usa os números reais (último mês fechado de anúncios e resultado).
  const [est, reais] = await Promise.all([estrategiaDoCliente(sb, clienteId), secao === 'receita' ? numerosReaisDoCliente(sb, cliente, dataDeHoje(new Date())) : null])
  return (
    <>
      <nav aria-label="Seções da estratégia">
        {METODOS.map((m) => (
          <Link key={m.id} href={link(m.id)} aria-current={secao === m.id ? 'page' : undefined}>
            <Ic n={m.icone} s={16} /> {m.rotulo}
            <span>{pct(preenchimento(m.id, est[m.id]))}</span>
          </Link>
        ))}
      </nav>
      <QuadroEstrategia metodo={secao} clienteId={clienteId} inicial={est[secao]} reais={reais} />
    </>
  )
}

async function Panorama({ clientes, link }: { clientes: { id: string; nome: string }[]; link: (m: Metodo, clienteId?: string) => string }) {
  const todas = await estrategiasDeTodos(await criarClienteServidor())
  return (
    <section>
      <div>
        <header><h2>Quanto cada cliente já tem construído</h2><p>Escolha um cliente acima ou clique numa porcentagem para abrir a seção.</p></header>
        <div>
          <table>
            <thead><tr><th>Cliente</th>{METODOS.map((m) => <th key={m.id}>{m.curto}</th>)}</tr></thead>
            <tbody>
              {clientes.map((c) => (
                <tr key={c.id}>
                  <td><Link href={link('publico', c.id)}><NomeCliente nome={c.nome} /></Link></td>
                  {METODOS.map((m) => {
                    const p = todas[c.id] ? preenchimento(m.id, todas[c.id][m.id]) : 0
                    return (
                      <td key={m.id}>
                        <Link href={link(m.id, c.id)}>
                          <span><span style={{ width: pct(p) }} /></span>
                          <span>{pct(p)}</span>
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
