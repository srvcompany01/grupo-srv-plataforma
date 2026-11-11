import { Filter } from 'lucide-react'
import { ListaTelas } from '@/componentes/telas/ListaTelas'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { listarTelas } from '@/servicos/telas'

export default async function PaginaFunis() {
  const eu = await exigirEquipe()
  const sb = await criarClienteServidor()
  const telas = await listarTelas(sb, 'funil')
  return (
    <div>
      <header>
        <h1><Filter /> Funis</h1>
      </header>
      <main>
        <ListaTelas tipo="funil" telas={telas} euId={eu.id} />
      </main>
    </div>
  )
}
