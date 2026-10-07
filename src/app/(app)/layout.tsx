import { cookies } from 'next/headers'
import { BarraLateral } from '@/componentes/app/BarraLateral'
import { Toaster } from '@/componentes/ui/sonner'
import { cssTema } from '@/dominio/tema'
import { COOKIE_LARGURA_LATERAL, COOKIE_MODO_LATERAL, lerLarguraLateral, lerModoLateral } from '@/dominio/tema-lateral'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { listarArvore } from '@/servicos/espacos'
import { contarNaoLidos, listarAvisos } from '@/servicos/avisos'
import { temaAtual } from '@/servicos/tema'
import { cronometroAtivo } from '@/servicos/tempo'

// Casca da área interna. Não protege as páginas (cada página chama exigirEquipe); só monta a navegação.
export default async function LayoutApp({ children, painel }: { children: React.ReactNode; painel: React.ReactNode }) {
  const eu = await exigirEquipe()
  const jar = await cookies()
  const sb = await criarClienteServidor()
  const [navegacao, cronometro, avisos, naoLidos, tema] = await Promise.all([listarArvore(sb), cronometroAtivo(sb, eu.id), listarAvisos(sb), contarNaoLidos(sb), temaAtual(sb)])
  return (
    <div className="flex min-h-screen flex-col bg-white md:flex-row">
      {/* Cores escolhidas pelo admin em Configurações → Personalização (valores já validados como #rrggbb). */}
      <style>{cssTema(tema)}</style>
      <BarraLateral modoInicial={lerModoLateral(jar.get(COOKIE_MODO_LATERAL)?.value)} larguraInicial={lerLarguraLateral(jar.get(COOKIE_LARGURA_LATERAL)?.value)} navegacao={navegacao} nome={eu.nome} papel={eu.papel} cronometro={cronometro} avisos={avisos} naoLidos={naoLidos} euId={eu.id} />
      <main className="min-w-0 flex-1 bg-white">{children}</main>
      {painel}
      <Toaster position="bottom-right" />
    </div>
  )
}
