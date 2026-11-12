import { cookies } from 'next/headers'
import { BarraLateral } from '@/componentes/app/BarraLateral'
import { FaixaAtalhos } from '@/componentes/app/NavegacaoGlobal'
import { CabecalhoTopo } from '@/componentes/app/CabecalhoTopo'
import { PainelIA } from '@/componentes/app/PainelIA'
import { papelPodeUsarIA } from '@/ia/acesso'
import { Presenca } from '@/componentes/time/Presenca'
import { Toaster } from '@/componentes/ui/sonner'
import { cssTema } from '@/dominio/tema'
import '@/componentes/app/casca.css'
import { COOKIE_LARGURA_LATERAL, COOKIE_MODO_LATERAL, COOKIE_NAV_FECHADOS, COOKIE_ORDEM_INICIO, COOKIE_TEMA, lerFechados, lerOrdem, lerLarguraLateral, lerModoLateral, lerModoTema } from '@/dominio/tema-lateral'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { listarArvore } from '@/servicos/espacos'
import { contarNaoLidos, listarAvisos } from '@/servicos/avisos'
import { listarCanais, totalNaoLidas } from '@/servicos/chat'
import { temaAtual } from '@/servicos/tema'
import { cronometroAtivo } from '@/servicos/tempo'
import { listasFavoritas } from '@/servicos/visoes'

// Casca da área interna. Não protege as páginas (cada página chama exigirEquipe); só monta a navegação.
export default async function LayoutApp({ children, painel: painelTarefa }: { children: React.ReactNode; painel: React.ReactNode }) {
  const eu = await exigirEquipe()
  const jar = await cookies()
  const sb = await criarClienteServidor()
  const [navegacao, cronometro, avisos, naoLidos, tema, chatNaoLidas, favoritas, canaisChat] = await Promise.all([listarArvore(sb), cronometroAtivo(sb, eu.id), listarAvisos(sb), contarNaoLidos(sb), temaAtual(sb), totalNaoLidas(sb), listasFavoritas(sb).catch(() => []), listarCanais(sb).catch(() => [])])
  const painel = { navegacao, canais: canaisChat.filter((c) => !c.nome.startsWith('dm-')).map((c) => ({ id: c.id, nome: c.nome, naoLidas: c.naoLidas, privado: c.privado })), favoritas, papel: eu.papel, nome: eu.nome, cronometro, chatNaoLidas, tema: lerModoTema(jar.get(COOKIE_TEMA)?.value), fechados: lerFechados(jar.get(COOKIE_NAV_FECHADOS)?.value), ordemInicio: lerOrdem(jar.get(COOKIE_ORDEM_INICIO)?.value) }
  // Cabeçalho do topo e, abaixo dele, a faixa de atalhos (1ª barra), a barra dos espaços (2ª barra) e o conteúdo.
  return (
    <div className="app-ui" data-tema={painel.tema}>
      {/* Cores escolhidas pelo admin em Configurações → Personalização (valores já validados como #rrggbb). */}
      <style>{cssTema(tema)}</style>
      {/* Fonte dos ícones (Material Symbols Rounded, a mesma do protótipo). */}
      {/* eslint-disable-next-line @next/next/google-font-display, @next/next/no-page-custom-font */}
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20,300..500,0..1,0&display=block" />
      <div className="cs-moldura">
        <CabecalhoTopo painel={painel} />
        <div className="cs-corpo">
          {/* Faixa de ícones vermelha + painel lateral (fixável e redimensionável) + conteúdo em cartão branco. */}
          <div className="cs-lateral">
            <FaixaAtalhos {...painel} avisos={avisos} naoLidos={naoLidos} euId={eu.id} />
            <BarraLateral modoInicial={lerModoLateral(jar.get(COOKIE_MODO_LATERAL)?.value)} larguraInicial={lerLarguraLateral(jar.get(COOKIE_LARGURA_LATERAL)?.value)} {...painel} />
          </div>
          <main className="cs-conteudo">{children}</main>
        </div>
      </div>
      {painelTarefa}
      {papelPodeUsarIA(eu.papel) && <PainelIA />}
      <Presenca />
      <Toaster position="bottom-right" />
    </div>
  )
}
