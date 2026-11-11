import Link from 'next/link'
import { LogoRede } from '@/componentes/redes/LogoRede'
import { NomeCliente } from '@/componentes/NomeCliente'
import { REDES, ligadaNoCliente } from '@/dominio/redes-sociais'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { listarClientes } from '@/servicos/clientes-plataforma'

export default async function Redes() {
  await exigirEquipe()
  const sb = await criarClienteServidor()
  const clientes = (await listarClientes(sb)).filter((c) => !c.interno && c.status !== 'encerrado')
  return (
    <div>
      <h1>Redes sociais</h1>
      <p>Cada rede com suas funções e relatórios. As que ainda não estão conectadas já têm o espaço pronto.</p>
      <div>
        {REDES.map((r) => {
          const n = clientes.filter((c) => ligadaNoCliente(c, r.slug)).length
          return (
            <Link key={r.slug} href={`/redes/${r.slug}`}>
              <div>
                <LogoRede slug={r.slug} tamanho={36} />
                <div>
                  <p>{r.nome}</p>
                  <p>{r.conectada ? `${n} de ${clientes.length} clientes` : 'Em breve'}</p>
                </div>
              </div>
              <p>{r.resumo}</p>
            </Link>
          )
        })}
      </div>
      <h2>Panorama dos clientes</h2>
      <div>
        <table>
          <thead>
            <tr>
              <th>Cliente</th>
              {REDES.map((r) => <th key={r.slug}><Link href={`/redes/${r.slug}`} title={r.nome}><LogoRede slug={r.slug} tamanho={18} /></Link></th>)}
            </tr>
          </thead>
          <tbody>
            {clientes.map((c) => (
              <tr key={c.id}>
                <td><NomeCliente nome={c.nome} /></td>
                {REDES.map((r) => <td key={r.slug}>{ligadaNoCliente(c, r.slug) ? <span>●</span> : <span>—</span>}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
