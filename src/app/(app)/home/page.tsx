import './home.css'
import { Suspense } from 'react'
import { gradeDoMes, ocorrencias, somarDias, type Ocorrencia } from '@/dominio/agenda'
import { dataDeHoje, lerFiltros } from '@/dominio/filtros'
import { resumirAgendaHome, resumirHome } from '@/dominio/home'
import { resumirPor } from '@/dominio/resumo'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { listarCompromissos } from '@/servicos/agenda'
import { listarClientes } from '@/servicos/clientes-plataforma'
import { eventosDoGoogle } from '@/servicos/google-agenda'
import { listarPostsHome } from '@/servicos/home'
import { statusDasListas } from '@/servicos/listas'
import { listarTarefas } from '@/servicos/tarefas'
import { PainelHome, type ClienteHome } from './PainelHome'
import { ResumoMes, ResumoMesCarregando } from './ResumoMes'

export default async function Home() {
  const eu = await exigirEquipe()
  const agora = new Date()
  const hoje = dataDeHoje(agora)
  const mes = hoje.slice(0, 7)
  const grade = gradeDoMes(mes)
  const de = grade[0] < hoje ? grade[0] : hoje
  const ate = grade[grade.length - 1] > somarDias(hoje, 14) ? grade[grade.length - 1] : somarDias(hoje, 14)
  const sb = await criarClienteServidor()
  const [minhas, tarefas, clientes, compromissos, google, posts] = await Promise.all([
    listarTarefas(sb, { responsavelId: eu.id }, lerFiltros({}), hoje).catch(() => null),
    listarTarefas(sb, { todas: true }, lerFiltros({}), hoje).catch(() => null),
    listarClientes(sb).catch(() => null),
    listarCompromissos(sb, de, ate).catch(() => null),
    eventosDoGoogle(eu.id, de, ate).catch(() => null),
    listarPostsHome(sb).catch(() => null),
  ])
  const status = await statusDasListas(sb, [...new Set([...(tarefas ?? []), ...(minhas ?? [])].map((t) => t.listaId))]).catch(() => null)
  const erros = [!minhas && 'tarefas', !tarefas && 'operacao', !clientes && 'clientes', !compromissos && 'agenda', !google && 'google', !posts && 'conteudo', !status && 'status'].filter((v): v is string => typeof v === 'string')
  const resumo = resumirHome(tarefas ?? [], minhas ?? [], status ?? {}, posts ?? [], hoje)
  const eventos: Ocorrencia[] = [...ocorrencias(compromissos ?? [], de, ate), ...(google ?? [])]
  const agenda = resumirAgendaHome(eventos, agora, hoje)
  const externos = (clientes ?? []).filter((c) => !c.interno && c.status !== 'encerrado')
  const idsClientes = new Set(externos.map((c) => c.id))
  const resumos = new Map(resumirPor((tarefas ?? []).filter((t) => idsClientes.has(t.clienteId)), (t) => ({ id: t.clienteId, nome: t.clienteNome }), resumo.categoria, hoje).map((l) => [l.id, l]))
  const tarefaPorId = new Map((tarefas ?? []).map((t) => [t.id, t]))
  const clientesHome: ClienteHome[] = externos.map((c) => {
    const linha = resumos.get(c.id)
    const abertas = resumo.abertas.filter((t) => t.clienteId === c.id)
    const pessoas = new Map<string, { nome: string; tarefas: number }>()
    for (const t of abertas) for (const p of t.responsaveis) pessoas.set(p.id, { nome: p.nome, tarefas: (pessoas.get(p.id)?.tarefas ?? 0) + 1 })
    const responsaveis = [...pessoas.values()].sort((a, b) => b.tarefas - a.tarefas)
    return {
      id: c.id, nome: c.nome, cor: c.cor, pausado: c.status === 'pausado',
      abertas: abertas.length, atrasadas: linha?.atrasadas ?? 0,
      aprovacao: resumo.aguardando.filter((p) => tarefaPorId.get(p.tarefaId)?.clienteId === c.id).length,
      responsavel: responsaveis.length ? `${responsaveis[0].nome}${responsaveis.length > 1 ? ` +${responsaveis.length - 1}` : ''}` : abertas.length ? 'Sem responsável' : 'Sem tarefas abertas',
      proxima: abertas.filter((t) => t.prazo && t.prazo >= hoje).map((t) => t.prazo!).sort()[0] ?? null,
      concluidas: linha?.concluidas ?? 0, total: linha?.total ?? 0,
    }
  }).sort((a, b) => b.atrasadas - a.atrasadas || b.aprovacao - a.aprovacao || b.abertas - a.abertas || a.nome.localeCompare(b.nome, 'pt-BR'))
  const ativos = (clientes ?? []).filter((c) => c.status === 'ativo' && !c.interno)

  return <PainelHome
    nome={eu.nome} agora={agora.toISOString()} hoje={hoje} resumo={resumo} agenda={agenda} eventos={eventos}
    clientes={clientesHome} ativos={ativos.length} erros={erros}
    atrasadasOperacao={clientesHome.reduce((s, c) => s + c.atrasadas, 0)}
    semResponsavel={resumo.abertas.filter((t) => idsClientes.has(t.clienteId) && t.responsaveis.length === 0).length}
  >
    <Suspense fallback={<ResumoMesCarregando />}>
      {clientes !== null && <ResumoMes clientes={ativos} mes={mes} hoje={hoje} />}
    </Suspense>
  </PainelHome>
}
