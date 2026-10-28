import { cookies } from 'next/headers'
import { BarraLateral, FaixaAtalhos } from '@/componentes/app/BarraLateral'
import { CabecalhoTopo } from '@/componentes/app/CabecalhoTopo'
import { PainelIA } from '@/componentes/app/PainelIA'
import { papelPodeUsarIA } from '@/ia/acesso'
import { Presenca } from '@/componentes/time/Presenca'
import { Toaster } from '@/componentes/ui/sonner'
import { cssTema } from '@/dominio/tema'
import { COOKIE_LARGURA_LATERAL, COOKIE_MODO_LATERAL, COOKIE_NAV_FECHADOS, COOKIE_ORDEM_INICIO, lerFechados, lerOrdem, lerLarguraLateral, lerModoLateral } from '@/dominio/tema-lateral'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { listarArvore } from '@/servicos/espacos'
import { contarNaoLidos, listarAvisos } from '@/servicos/avisos'
import { totalNaoLidas } from '@/servicos/chat'
import { temaAtual } from '@/servicos/tema'
import { cronometroAtivo } from '@/servicos/tempo'

// Casca da área interna. Não protege as páginas (cada página chama exigirEquipe); só monta a navegação.
export default async function LayoutApp({ children, painel: painelTarefa }: { children: React.ReactNode; painel: React.ReactNode }) {
  const eu = await exigirEquipe()
  const jar = await cookies()
  const sb = await criarClienteServidor()
  const [navegacao, cronometro, avisos, naoLidos, tema, chatNaoLidas] = await Promise.all([listarArvore(sb), cronometroAtivo(sb, eu.id), listarAvisos(sb), contarNaoLidos(sb), temaAtual(sb), totalNaoLidas(sb)])
  const painel = { navegacao, papel: eu.papel, cronometro, chatNaoLidas, fechados: lerFechados(jar.get(COOKIE_NAV_FECHADOS)?.value), ordemInicio: lerOrdem(jar.get(COOKIE_ORDEM_INICIO)?.value) }
  // Cabeçalho do topo e, abaixo dele, a faixa de atalhos, a barra dos espaços e o conteúdo.
  return (
    <div className="app-ui flex min-h-dvh bg-fundo">
      {/* Cores escolhidas pelo admin em Configurações → Personalização (valores já validados como #rrggbb). */}
      <style>{cssTema(tema)}</style>
      <div className="flex min-w-0 flex-1 flex-col">
        <CabecalhoTopo painel={painel} avisos={avisos} naoLidos={naoLidos} euId={eu.id} nome={eu.nome} papel={eu.papel} />
        <div className="flex min-h-0 flex-1">
          <FaixaAtalhos papel={eu.papel} chatNaoLidas={chatNaoLidas} ordemInicio={painel.ordemInicio} />
          <BarraLateral modoInicial={lerModoLateral(jar.get(COOKIE_MODO_LATERAL)?.value)} larguraInicial={lerLarguraLateral(jar.get(COOKIE_LARGURA_LATERAL)?.value)} {...painel} />
          <main className="min-w-0 flex-1 bg-white">{children}</main>
        </div>
      </div>
      {painelTarefa}
      {papelPodeUsarIA(eu.papel) && <PainelIA />}
      <Presenca />
      <Toaster position="bottom-right" />
    </div>
  )
}
