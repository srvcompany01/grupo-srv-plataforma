import { BarChart3, Users } from 'lucide-react'
import Link from 'next/link'
import { EstadoVazio } from '@/componentes/EstadoVazio'
import { formatarCampoCliente, ordenarGaleriaClientes } from '@/dominio/clientes-galeria'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { capasDosClientes, listarCamposCliente, valoresDosClientes } from '@/servicos/clientes-galeria'
import { clientesTrabalhadosEm, listarClientes } from '@/servicos/clientes-plataforma'
import { dataDeHoje } from '@/dominio/filtros'
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
  // Sem a migration das marcas, a galeria abre normalmente (só sem o botão marcado).
  const hoje = dataDeHoje(new Date())
  const trabalhados = await clientesTrabalhadosEm(sb, hoje).catch(() => new Set<string>())
  const podeCriar = eu.papel === 'admin' || eu.papel === 'gestor'
  const camposNaCapa = campos.filter((c) => c.naCapa)
  return (
    <div className="page-shell">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Relacionamento</p>
          <h1 className="page-title mt-1">Clientes</h1>
        </div>
        <Link href="/clientes/relatorio" className="flex items-center gap-1.5 rounded-full border border-borda px-3 py-1.5 text-rotulo font-semibold text-texto-2 transition hover:bg-hover hover:text-texto">
          <BarChart3 className="h-3.5 w-3.5" /> Relatório de trabalho
        </Link>
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
        hoje={hoje}
        itens={ordenarGaleriaClientes(clientes).map((c) => {
          const info = camposNaCapa.flatMap((campo) => {
            const valor = valores[c.id]?.[campo.id]
            return valor ? [{ id: campo.id, nome: campo.nome, texto: formatarCampoCliente(campo.tipo, valor), cor: campo.tipo === 'selecao' ? campo.opcoes.find((o) => o.nome === valor)?.cor : undefined }] : []
          })
          return { id: c.id, no: <CartaoCliente cliente={c} capa={capas[c.id]} info={info} trabalhadoHoje={trabalhados.has(c.id)} /> }
        })}
      />
    </div>
  )
}
