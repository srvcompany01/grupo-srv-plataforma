import { cookies } from 'next/headers'
import { BarraLateral } from '@/componentes/app/BarraLateral'
import { CabecalhoTopo } from '@/componentes/app/CabecalhoTopo'
import { NavegacaoGlobal } from '@/componentes/app/NavegacaoGlobal'
import { Toaster } from '@/componentes/ui/sonner'
import { cssTema } from '@/dominio/tema'
import { COOKIE_LARGURA_LATERAL, COOKIE_MODO_LATERAL, lerLarguraLateral, lerModoLateral } from '@/dominio/tema-lateral'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { listarClientes } from '@/servicos/clientes-plataforma'
import { listarArvore } from '@/servicos/espacos'
import { contarNaoLidos, listarAvisos } from '@/servicos/avisos'
import { temaAtual } from '@/servicos/tema'
import { cronometroAtivo } from '@/servicos/tempo'

// Casca da área interna. Não protege as páginas (cada página chama exigirEquipe); só monta a navegação.
export default async function LayoutApp({ children, painel: painelTarefa }: { children: React.ReactNode; painel: React.ReactNode }) {
  const eu = await exigirEquipe()
  const jar = await cookies()
  const sb = await criarClienteServidor()
  const [navegacao, clientes, cronometro, avisos, naoLidos, tema] = await Promise.all([listarArvore(sb), listarClientes(sb), cronometroAtivo(sb, eu.id), listarAvisos(sb), contarNaoLidos(sb), temaAtual(sb)])
  const clientesAtivos = clientes.filter((cliente) => cliente.status !== 'encerrado').map((cliente) => ({ id: cliente.id, nome: cliente.nome }))
  const painel = { navegacao, clientes: clientesAtivos, papel: eu.papel, cronometro }
  // Três camadas: faixa global (72px), cabeçalho do topo e, abaixo dele, a barra de espaços + o conteúdo.
  return (
    <div className="flex min-h-dvh bg-fundo">
      {/* Cores escolhidas pelo admin em Configurações → Personalização (valores já validados como #rrggbb). */}
      <style>{cssTema(tema)}</style>
      <NavegacaoGlobal admin={eu.papel === 'admin'} />
      <div className="flex min-w-0 flex-1 flex-col">
        <CabecalhoTopo painel={painel} avisos={avisos} naoLidos={naoLidos} euId={eu.id} nome={eu.nome} papel={eu.papel} />
        <div className="flex min-h-0 flex-1">
          <BarraLateral modoInicial={lerModoLateral(jar.get(COOKIE_MODO_LATERAL)?.value)} larguraInicial={lerLarguraLateral(jar.get(COOKIE_LARGURA_LATERAL)?.value)} {...painel} />
          <main className="min-w-0 flex-1 bg-white">{children}</main>
        </div>
      </div>
      {painelTarefa}
      <Toaster position="bottom-right" />
    </div>
  )
}
