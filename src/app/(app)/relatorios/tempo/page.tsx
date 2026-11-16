import { dataDeHoje } from '@/dominio/filtros'
import { lerFiltrosTempo } from '@/dominio/tempo-faturavel'
import { exigirGestorOuAdmin } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { listarClientes } from '@/servicos/clientes-plataforma'
import { resumoTempo } from '@/servicos/tempo'
import { listarEquipe } from '@/servicos/usuarios'
import { ResumoTempo } from './ResumoTempo'

/** Horas por cliente e por pessoa, com faturável e não faturável. Só admin e gestor (os demais veem 404). */
export default async function Tempo({ searchParams }: PageProps<'/relatorios/tempo'>) {
  await exigirGestorOuAdmin()
  const filtros = lerFiltrosTempo(await searchParams, dataDeHoje(new Date()))
  const sb = await criarClienteServidor()
  const [linhas, clientes, equipe] = await Promise.all([resumoTempo(sb, filtros), listarClientes(sb), listarEquipe(sb)])
  return (
    <ResumoTempo
      filtros={filtros}
      linhas={linhas}
      clientes={clientes.map((c) => ({ id: c.id, nome: c.nome, cor: c.cor }))}
      equipe={equipe.map((p) => ({ id: p.id, nome: p.nome }))}
    />
  )
}
