import { Briefcase } from 'lucide-react'
import { EstadoVazio } from '@/componentes/EstadoVazio'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { listaDeProjetos } from '@/servicos/painel-projetos'
import { PaginaLista } from '../listas/PaginaLista'
import { BotaoConfigurar } from './BotaoConfigurar'

/** Projetos é uma lista: cada tarefa é um projeto (cliente) e as subtarefas, o que está sendo desenvolvido. */
export default async function Projetos({ searchParams }: PageProps<'/projetos'>) {
  const sp = await searchParams
  const eu = await exigirEquipe()
  const sb = await criarClienteServidor()
  // Sem a migration (coluna is_projects), a página explica em vez de quebrar.
  const lista = await listaDeProjetos(sb).catch(() => null)
  if (lista) return <PaginaLista id={lista.id} caminho="/projetos" sp={sp} rotuloPainel="Projeto" />

  return (
    <div className="page-shell relatorio">
      <div>
        <p className="eyebrow">Acompanhamento</p>
        <h1 className="page-title mt-1">Projetos</h1>
      </div>
      <EstadoVazio
        icone={Briefcase}
        titulo="Os projetos ainda não foram configurados"
        descricao={eu.papel === 'admin' ? 'Projetos é uma lista: cada tarefa é um projeto (um por cliente) e as subtarefas são o que está sendo desenvolvido. O Painel mostra o tempo investido e o andamento de cada um.' : 'Peça ao admin para configurar os projetos.'}
      >
        {eu.papel === 'admin' && <BotaoConfigurar />}
      </EstadoVazio>
    </div>
  )
}
