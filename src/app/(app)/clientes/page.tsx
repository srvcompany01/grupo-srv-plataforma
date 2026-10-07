import { formatarCampoCliente } from '@/dominio/clientes-galeria'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { capasDosClientes, listarCamposCliente, valoresDosClientes } from '@/servicos/clientes-galeria'
import { listarClientes } from '@/servicos/clientes-plataforma'
import { criarCliente } from './acoes'
import { CartaoCliente } from './CartaoCliente'
import { FormCliente } from './FormCliente'

export default async function Clientes() {
  const eu = await exigirEquipe()
  const sb = await criarClienteServidor()
  const [clientes, campos, valores, capas] = await Promise.all([listarClientes(sb), listarCamposCliente(sb), valoresDosClientes(sb), capasDosClientes(sb)])
  const podeCriar = eu.papel === 'admin' || eu.papel === 'gestor'
  const camposNaCapa = campos.filter((c) => c.naCapa)
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
      {clientes.length === 0 && <p className="rounded-xl border border-dashed border-borda px-4 py-10 text-center text-[13px] text-texto-3">Nenhum cliente cadastrado ainda.</p>}
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {clientes.map((c) => {
          const info = camposNaCapa.flatMap((campo) => {
            const valor = valores[c.id]?.[campo.id]
            return valor ? [{ id: campo.id, nome: campo.nome, texto: formatarCampoCliente(campo.tipo, valor) }] : []
          })
          return (
            <li key={c.id}>
              <CartaoCliente cliente={c} capa={capas[c.id]} info={info} />
            </li>
          )
        })}
      </ul>
    </div>
  )
}
