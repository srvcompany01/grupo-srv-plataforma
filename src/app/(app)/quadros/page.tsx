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
    <div>
      <header>
        <h1><PenTool /> Quadros</h1>
      </header>
      <main>
        <ListaTelas tipo="quadro" telas={telas} euId={eu.id} />
      </main>
    </div>
  )
}
