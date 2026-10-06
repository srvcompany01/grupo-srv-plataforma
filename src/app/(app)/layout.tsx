import { BarraLateral } from '@/componentes/app/BarraLateral'
import { Toaster } from '@/componentes/ui/sonner'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { listarArvore } from '@/servicos/espacos'

// Casca da área interna. Não protege as páginas (cada página chama exigirEquipe); só monta a navegação.
export default async function LayoutApp({ children }: LayoutProps<'/'>) {
  const eu = await exigirEquipe()
  const arvore = await listarArvore(await criarClienteServidor())
  return (
    <div className="flex min-h-screen flex-col bg-fundo md:flex-row">
      <BarraLateral arvore={arvore} nome={eu.nome} papel={eu.papel} />
      <main className="min-w-0 flex-1">{children}</main>
      <Toaster position="bottom-right" />
    </div>
  )
}
