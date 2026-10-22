import Link from 'next/link'
import { notFound } from 'next/navigation'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { CATEGORIAS } from '@/componentes/tarefas/categorias'
import { VisaoLista } from '@/componentes/tarefas/VisaoLista'
import { iniciais } from '@/dominio/clientes-galeria'
import { dataDeHoje, lerFiltros } from '@/dominio/filtros'
import { montarArvore, type Categoria } from '@/dominio/tarefas'
import { capasDosClientes, listarCamposCliente, valoresDosClientes } from '@/servicos/clientes-galeria'
import { buscarCliente, usuariosDoCliente } from '@/servicos/clientes-plataforma'
import { statusDasListas } from '@/servicos/listas'
import { listarTarefas } from '@/servicos/tarefas'
import { listarEquipe } from '@/servicos/usuarios'
import { BibliotecaAnuncios } from '@/componentes/BibliotecaAnuncios'
import { FormConvite } from '../../config/usuarios/FormConvite'
import { editarCliente } from '../acoes'
import { FormCliente } from '../FormCliente'
import { CamposCliente } from './CamposCliente'
import { ExcluirCliente } from './ExcluirCliente'
import { SeletorCapa } from './SeletorCapa'

export default async function Cliente({ params }: PageProps<'/clientes/[cliente]'>) {
  const { cliente: id } = await params
  const eu = await exigirEquipe()
  const sb = await criarClienteServidor()
  const cliente = await buscarCliente(sb, id)
  if (!cliente) notFound()
  const admin = eu.papel === 'admin'
  const podeGerir = admin || eu.papel === 'gestor'
  const [campos, valores, capas] = await Promise.all([listarCamposCliente(sb), valoresDosClientes(sb), capasDosClientes(sb)])
  const capa = capas[id]
  const usuarios = admin && !cliente.interno ? await usuariosDoCliente(sb, id) : []

  // Visão por cliente: o trabalho dele em todos os departamentos, uma seção por departamento (lista).
  const hoje = dataDeHoje(new Date())
  const [tarefas, equipe] = await Promise.all([listarTarefas(sb, { todas: true }, { ...lerFiltros({}), clientes: [id] }, hoje), listarEquipe(sb)])
  const statusPorLista = await statusDasListas(sb, [...new Set(tarefas.map((t) => t.listaId))])
  const categoria = (t: { listaId: string; statusId: string }): Categoria => statusPorLista[t.listaId]?.find((s) => s.id === t.statusId)?.categoria ?? 'todo'
  const arvore = montarArvore(tarefas)
  const departamentos = [...new Map(tarefas.map((t) => [t.listaId, t.listaNome])).entries()]
  const ctx = { equipe, hoje, statusPorLista, mostrarLista: false }

  return (
    <div className="page-shell max-w-5xl">
      <Link href="/clientes" className="text-corpo text-texto-2 hover:text-marca">
        ← Clientes
      </Link>
      <h1 className="page-title">{cliente.nome}</h1>
      <section className="space-y-3">
        <div className="relative aspect-[16/5] w-full overflow-hidden rounded-xl border border-borda" style={{ background: cliente.cor }}>
          {capa?.url ? (
            // eslint-disable-next-line @next/next/no-img-element -- origem externa (Unsplash) ou URL assinada do R2
            <img src={capa.url} alt="" width={1200} height={375} className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-[40px] font-bold tracking-rotulo text-white/90">{iniciais(cliente.nome)}</span>
          )}
          {capa?.credito && <span className="absolute bottom-1.5 right-2 rounded bg-black/50 px-1.5 py-0.5 text-legenda text-white/90">{capa.credito}</span>}
        </div>
        {podeGerir && <SeletorCapa clienteId={id} temCapa={!!capa?.url} />}
      </section>
      <BibliotecaAnuncios paginaId={cliente.metaPaginaId} semPagina={podeGerir ? 'Cole o link da Biblioteca de Anúncios do cliente no cadastro abaixo para ver os anúncios ativos dele por aqui e no portal.' : undefined} />
      <section className="space-y-4" aria-label="Trabalho do cliente">
        <h2 className="text-sm font-semibold">Trabalho por departamento</h2>
        {departamentos.length === 0 && <p className="text-corpo text-texto-3">Nenhuma tarefa com a tag deste cliente ainda.</p>}
        {departamentos.map(([listaId, listaNome]) => {
          const raizes = arvore.filter((t) => t.listaId === listaId)
          return (
            <div key={listaId} className="space-y-2">
              <h3 className="flex items-center gap-2 text-corpo font-semibold">
                <Link href={`/listas/${listaId}`} className="hover:text-marca">{listaNome}</Link>
                <span className="rounded-full bg-hover px-2 py-0.5 text-legenda font-normal text-texto-3">{raizes.length}</span>
              </h3>
              <VisaoLista grupos={CATEGORIAS.map((c) => ({ ...c, id: `${listaId}-${c.id}`, tarefas: raizes.filter((t) => categoria(t) === c.id) })).filter((g) => g.tarefas.length)} ctx={ctx} euId={eu.id} />
            </div>
          )
        })}
      </section>
      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Informações da galeria</h2>
        <CamposCliente clienteId={id} campos={campos} valores={valores[id] ?? {}} podeEditar={podeGerir} />
      </section>
      <FormCliente acao={editarCliente.bind(null, id)} cliente={cliente} podeEditar={podeGerir} />
      {admin && !cliente.interno && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Acesso ao portal</h2>
          <div className="rounded-xl border border-borda bg-white">
            {usuarios.length === 0 && <p className="px-3 py-2.5 text-corpo text-texto-3">Nenhum usuário com acesso ao portal.</p>}
            {usuarios.map((u) => (
              <div key={u.id} className={`flex items-center gap-3 border-t border-borda px-3 py-2 text-corpo first:border-t-0 ${u.ativo ? '' : 'opacity-50'}`}>
                <span className="font-medium">{u.nome}</span>
                <span className="text-texto-3">{u.email}</span>
              </div>
            ))}
          </div>
          <FormConvite clientes={[]} espacos={[]} clienteFixo={id} />
        </section>
      )}
      {admin && !cliente.interno && <ExcluirCliente clienteId={id} nome={cliente.nome} />}
    </div>
  )
}
