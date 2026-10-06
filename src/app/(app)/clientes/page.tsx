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
    <div className="page-shell">
      <div>
        <p className="eyebrow">Relacionamento</p>
        <h1 className="page-title mt-1">Clientes</h1>
      </div>
      {podeCriar && (
        <details className="group">
          <summary className="w-fit cursor-pointer rounded-full bg-texto px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-carbon">+ Novo cliente</summary>
          <div className="mt-2">
            <FormCliente acao={criarCliente} podeEditar />
          </div>
        </details>
      )}
      <div className="overflow-hidden rounded-xl border border-borda bg-white">
        {clientes.map((c) => (
          <Link key={c.id} href={`/clientes/${c.id}`} className="flex items-center gap-3 border-t border-borda px-3 py-2.5 text-[13px] first:border-t-0 hover:bg-hover">
            <span className="flex-1 font-medium">{c.nome}</span>
            {c.interno && <span className="rounded-full bg-marca-fundo px-2 py-0.5 text-[10px] font-semibold text-marca">Interno</span>}
            <span className="text-texto-3">{ROTULO_STATUS_CLIENTE[c.status]}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
