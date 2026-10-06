import Link from 'next/link'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { listarClientes, ROTULO_STATUS_CLIENTE } from '@/servicos/clientes-plataforma'
import { criarCliente } from './acoes'
import { FormCliente } from './FormCliente'

export default async function Clientes() {
  const eu = await exigirEquipe()
  const clientes = await listarClientes(await criarClienteServidor())
  const podeCriar = eu.papel === 'admin' || eu.papel === 'gestor'
  return (
    <div className="mx-auto max-w-5xl space-y-4 p-4 md:p-6">
      <h1 className="text-lg font-semibold">Clientes</h1>
      {podeCriar && (
        <details className="group">
          <summary className="cursor-pointer text-[13px] font-medium text-marca">+ Novo cliente</summary>
          <div className="mt-2">
            <FormCliente acao={criarCliente} podeEditar />
          </div>
        </details>
      )}
      <div className="overflow-hidden rounded-lg border border-borda bg-white">
        {clientes.map((c) => (
          <Link key={c.id} href={`/clientes/${c.id}`} className="flex items-center gap-3 border-t border-borda px-3 py-2.5 text-[13px] first:border-t-0 hover:bg-hover">
            <span className="flex-1 font-medium">{c.nome}</span>
            {c.interno && <span className="rounded bg-marca-fundo px-1.5 py-0.5 text-[11px] text-marca">Interno</span>}
            <span className="text-texto-3">{ROTULO_STATUS_CLIENTE[c.status]}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
