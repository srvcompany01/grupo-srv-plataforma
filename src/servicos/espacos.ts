import { montarArvoreEspacos, type NoEspaco } from '@/dominio/arvore-espacos'
import type { Supabase } from '@/infra/supabase/servidor'
import { dados } from './resultado'

/** Árvore da barra lateral. A RLS já filtra o que o usuário pode ver. */
export async function listarArvore(sb: Supabase): Promise<NoEspaco[]> {
  const [espacos, pastas, listas] = await Promise.all([
    sb.from('spaces').select('id, name, color, position, parent_id').is('archived_at', null),
    sb.from('folders').select('id, name, space_id, position').is('archived_at', null),
    sb.from('lists').select('id, name, space_id, folder_id, position, reference_month, clients(name)').is('archived_at', null),
  ])
  return montarArvoreEspacos(
    dados(espacos).map((e) => ({ id: e.id, nome: e.name, cor: e.color, posicao: e.position, paiId: e.parent_id })),
    dados(pastas).map((p) => ({ id: p.id, nome: p.name, espacoId: p.space_id, posicao: p.position })),
    dados(listas).map((l) => ({
      id: l.id,
      nome: l.name,
      espacoId: l.space_id,
      pastaId: l.folder_id,
      posicao: l.position,
      clienteNome: l.clients?.name ?? '',
      mes: l.reference_month,
    })),
  )
}
