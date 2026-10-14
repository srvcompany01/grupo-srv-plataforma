import { Users } from 'lucide-react'
import { EstadoVazio } from '@/componentes/EstadoVazio'
import { formatarCampoCliente, ordenarGaleriaClientes } from '@/dominio/clientes-galeria'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { capasDosClientes, listarCamposCliente, valoresDosClientes } from '@/servicos/clientes-galeria'
import { listarClientes } from '@/servicos/clientes-plataforma'
import { criarCliente } from './acoes'
import { CartaoCliente } from './CartaoCliente'
import { FormCliente } from './FormCliente'
import { GaleriaOrdenavel } from './GaleriaOrdenavel'

export default async function Clientes() {
  const eu = await exigirEquipe()
  const sb = await criarClienteServidor()
  const [todosClientes, campos, valores, capas] = await Promise.all([listarClientes(sb), listarCamposCliente(sb), valoresDosClientes(sb), capasDosClientes(sb)])
  // O cliente interno (Grupo SRV) continua existindo para as listas internas, mas não aparece na galeria.
  const clientes = todosClientes.filter((c) => !c.interno)
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
          <summary className="w-fit cursor-pointer rounded-full bg-texto px-4 py-2 text-corpo font-semibold text-white transition hover:bg-carbon">+ Novo cliente</summary>
          <div className="mt-2">
            <FormCliente acao={criarCliente} podeEditar />
          </div>
        </details>
      )}
      {clientes.length === 0 && <EstadoVazio icone={Users} titulo="Nenhum cliente cadastrado ainda" descricao={podeCriar ? 'Use "Novo cliente" acima para cadastrar o primeiro.' : undefined} />}
      <GaleriaOrdenavel
        podeOrdenar={podeCriar}
        itens={ordenarGaleriaClientes(clientes).map((c) => {
          const info = camposNaCapa.flatMap((campo) => {
            const valor = valores[c.id]?.[campo.id]
            return valor ? [{ id: campo.id, nome: campo.nome, texto: formatarCampoCliente(campo.tipo, valor), cor: campo.tipo === 'selecao' ? campo.opcoes.find((o) => o.nome === valor)?.cor : undefined }] : []
          })
          return { id: c.id, no: <CartaoCliente cliente={c} capa={capas[c.id]} info={info} /> }
        })}
      />
    </div>
  )
}
