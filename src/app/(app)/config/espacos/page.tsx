import { exigirAdmin } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { listarEspacosComMembros } from '@/servicos/espacos'
import { listarEquipe } from '@/servicos/usuarios'
import { CartaoEspaco, FormNovoEspaco } from './Espacos'

export default async function Departamentos() {
  await exigirAdmin()
  const sb = await criarClienteServidor()
  const [espacos, equipe] = await Promise.all([listarEspacosComMembros(sb), listarEquipe(sb)])
  const raizes = espacos.filter((e) => !e.paiId)
  return (
    <div className="space-y-4">
      <FormNovoEspaco pais={raizes.map((e) => ({ id: e.id, nome: e.nome }))} />
      {raizes.map((e) => (
        <div key={e.id} className="space-y-2">
          <CartaoEspaco espaco={e} equipe={equipe} />
          <div className="space-y-2 pl-6">
            {espacos
              .filter((f) => f.paiId === e.id)
              .map((f) => (
                <CartaoEspaco key={f.id} espaco={f} equipe={equipe} />
              ))}
          </div>
        </div>
      ))}
    </div>
  )
}
