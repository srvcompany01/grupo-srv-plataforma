import { exigirAdmin } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { listarEspacosComMembros } from '@/servicos/espacos'
import { listarEquipe } from '@/servicos/usuarios'
import { CartaoEspaco } from './Espacos'

// As áreas são fixas (Social & Conteúdo, Tráfego & Performance): aqui só se gerencia quem as coordena.
export default async function Areas() {
  await exigirAdmin()
  const sb = await criarClienteServidor()
  const [espacos, equipe] = await Promise.all([listarEspacosComMembros(sb), listarEquipe(sb)])
  return (
    <div className="space-y-4">
      {espacos.filter((e) => e.slug).map((e) => <CartaoEspaco key={e.id} espaco={e} equipe={equipe} fixo />)}
    </div>
  )
}
