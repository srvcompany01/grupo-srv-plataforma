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
    <div className="page-shell">
      <h1 className="text-xl font-semibold">Redes sociais</h1>
      <p className="mt-1 text-sm text-[var(--text-2)]">Cada rede com suas funções e relatórios. As que ainda não estão conectadas já têm o espaço pronto.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {REDES.map((r) => {
          const n = clientes.filter((c) => ligadaNoCliente(c, r.slug)).length
          return (
            <Link key={r.slug} href={`/redes/${r.slug}`} className="group flex flex-col gap-3 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-elev)] p-4 transition-colors hover:border-[var(--border)]">
              <div className="flex items-center gap-3">
                <LogoRede slug={r.slug} tamanho={36} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{r.nome}</p>
                  <p className="text-xs text-[var(--text-3)]">{r.conectada ? `${n} de ${clientes.length} clientes` : 'Em breve'}</p>
                </div>
              </div>
              <p className="text-xs leading-relaxed text-[var(--text-2)]">{r.resumo}</p>
            </Link>
          )
        })}
      </div>
      <h2 className="mt-8 text-sm font-semibold">Panorama dos clientes</h2>
      <div className="mt-2 overflow-x-auto rounded-lg border border-[var(--border-soft)] bg-[var(--bg-elev)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-[var(--text-3)]">
              <th className="px-3 py-2 font-medium">Cliente</th>
              {REDES.map((r) => <th key={r.slug} className="px-3 py-2"><Link href={`/redes/${r.slug}`} title={r.nome} className="inline-flex"><LogoRede slug={r.slug} tamanho={18} /></Link></th>)}
            </tr>
          </thead>
          <tbody>
            {clientes.map((c) => (
              <tr key={c.id} className="border-t border-[var(--border-soft)]">
                <td className="px-3 py-2"><NomeCliente nome={c.nome} /></td>
                {REDES.map((r) => <td key={r.slug} className="px-3 py-2">{ligadaNoCliente(c, r.slug) ? <span className="text-emerald-600">●</span> : <span className="text-[var(--text-3)]">—</span>}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
