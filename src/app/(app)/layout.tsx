import { BarraLateral } from '@/componentes/app/BarraLateral'
import { Toaster } from '@/componentes/ui/sonner'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { listarArvore } from '@/servicos/espacos'
import { listarClientes } from '@/servicos/clientes-plataforma'
import { contarNaoLidos, listarAvisos } from '@/servicos/avisos'
import { cronometroAtivo } from '@/servicos/tempo'

// Casca da área interna. Não protege as páginas (cada página chama exigirEquipe); só monta a navegação.
export default async function LayoutApp({ children, painel }: { children: React.ReactNode; painel: React.ReactNode }) {
  const eu = await exigirEquipe()
  const sb = await criarClienteServidor()
  const [navegacao, clientes, cronometro, avisos, naoLidos] = await Promise.all([listarArvore(sb), listarClientes(sb), cronometroAtivo(sb, eu.id), listarAvisos(sb), contarNaoLidos(sb)])
  return (
    <div className="flex min-h-screen flex-col bg-white md:flex-row">
      <BarraLateral navegacao={navegacao} clientes={clientes.filter((cliente) => cliente.status !== 'encerrado').map((cliente) => ({ id: cliente.id, nome: cliente.nome }))} nome={eu.nome} papel={eu.papel} cronometro={cronometro} avisos={avisos} naoLidos={naoLidos} euId={eu.id} />
      <main className="min-w-0 flex-1 bg-white">{children}</main>
      {painel}
      <Toaster position="bottom-right" />
    </div>
  )
}
