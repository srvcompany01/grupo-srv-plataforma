import { PenTool } from 'lucide-react'
import { ListaTelas } from '@/componentes/telas/ListaTelas'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { listarTelas } from '@/servicos/telas'

export default async function PaginaQuadros() {
  const eu = await exigirEquipe()
  const sb = await criarClienteServidor()
  const telas = await listarTelas(sb, 'quadro')
  return (
    <div className="min-h-full bg-white">
      <header className="flex items-center gap-2 border-b border-borda px-4 py-3 md:px-5">
        <h1 className="flex items-center gap-2 text-destaque font-bold text-texto"><PenTool className="h-4 w-4" /> Quadros</h1>
      </header>
      <main className="space-y-4 p-4 md:p-5">
        <ListaTelas tipo="quadro" telas={telas} euId={eu.id} />
      </main>
    </div>
  )
}
