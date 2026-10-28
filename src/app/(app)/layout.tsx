import { cookies } from 'next/headers'
import { Suspense } from 'react'
import { BarraLateral, FaixaAtalhos } from '@/componentes/app/BarraLateral'
import { AtalhosFixados } from '@/componentes/app/AtalhosFixados'
import { CabecalhoTopo } from '@/componentes/app/CabecalhoTopo'
import { PainelIA } from '@/componentes/app/PainelIA'
import { papelPodeUsarIA } from '@/ia/acesso'
import { Presenca } from '@/componentes/time/Presenca'
import { Toaster } from '@/componentes/ui/sonner'
import { cssTema } from '@/dominio/tema'
import { COOKIE_LARGURA_LATERAL, COOKIE_MODO_LATERAL, COOKIE_NAV_FECHADOS, COOKIE_ORDEM_INICIO, COOKIE_TEMA, lerFechados, lerOrdem, lerLarguraLateral, lerModoLateral, lerModoTema } from '@/dominio/tema-lateral'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { listarArvore } from '@/servicos/espacos'
import { contarNaoLidos, listarAvisos } from '@/servicos/avisos'
import { listarCanais, totalNaoLidas } from '@/servicos/chat'
import { temaAtual } from '@/servicos/tema'
import { cronometroAtivo } from '@/servicos/tempo'
import { alertasDoSistema } from '@/servicos/alertas-sistema'
import { listasFavoritas } from '@/servicos/visoes'

// Casca da área interna. Não protege as páginas (cada página chama exigirEquipe); só monta a navegação.
export default async function LayoutApp({ children, painel: painelTarefa }: { children: React.ReactNode; painel: React.ReactNode }) {
  const eu = await exigirEquipe()
  const jar = await cookies()
  const sb = await criarClienteServidor()
  const [navegacao, cronometro, avisos, naoLidos, tema, chatNaoLidas, favoritas, canaisChat, alertas] = await Promise.all([listarArvore(sb), cronometroAtivo(sb, eu.id), listarAvisos(sb), contarNaoLidos(sb), temaAtual(sb), totalNaoLidas(sb), listasFavoritas(sb).catch(() => []), listarCanais(sb).catch(() => []), alertasDoSistema(sb)])
  const painel = { navegacao, canais: canaisChat.filter((c) => !c.nome.startsWith('dm-')).map((c) => ({ id: c.id, nome: c.nome, naoLidas: c.naoLidas, privado: c.privado })), favoritas, papel: eu.papel, nome: eu.nome, cronometro, chatNaoLidas, tema: lerModoTema(jar.get(COOKIE_TEMA)?.value), fechados: lerFechados(jar.get(COOKIE_NAV_FECHADOS)?.value), ordemInicio: lerOrdem(jar.get(COOKIE_ORDEM_INICIO)?.value) }
  // Cabeçalho do topo e, abaixo dele, a faixa de atalhos (1ª barra), a barra dos espaços (2ª barra) e o conteúdo.
  return (
    <div className="app-ui flex min-h-dvh bg-[var(--bg-frame)]" data-tema={painel.tema}>
      {/* Cores escolhidas pelo admin em Configurações → Personalização (valores já validados como #rrggbb). */}
      <style>{cssTema(tema)}</style>
      <div className="flex min-w-0 flex-1 flex-col">
        <CabecalhoTopo painel={painel} avisos={avisos} naoLidos={naoLidos} euId={eu.id} alertas={alertas} />
        <Suspense fallback={null}><AtalhosFixados /></Suspense>
        <div className="flex min-h-0 flex-1 gap-2 pb-2 md:px-2">
          <FaixaAtalhos papel={eu.papel} nome={eu.nome} chatNaoLidas={chatNaoLidas} ordemInicio={painel.ordemInicio} tema={painel.tema} />
          <BarraLateral modoInicial={lerModoLateral(jar.get(COOKIE_MODO_LATERAL)?.value)} larguraInicial={lerLarguraLateral(jar.get(COOKIE_LARGURA_LATERAL)?.value)} {...painel} />
          <main className="min-w-0 flex-1 bg-white md:rounded-[10px] md:border md:border-borda">{children}</main>
        </div>
      </div>
      {painelTarefa}
      {papelPodeUsarIA(eu.papel) && <PainelIA />}
      <Presenca />
      <Toaster position="bottom-right" />
    </div>
  )
}
