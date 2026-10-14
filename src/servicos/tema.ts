import { lerTema, TEMA_PADRAO, type Tema } from '@/dominio/tema'
import type { Supabase } from '@/infra/supabase/servidor'

/** Tema salvo pelo admin. Sem a tabela (migration pendente) ou sem registro, usa o padrão sem quebrar a página. */
export async function temaAtual(sb: Supabase): Promise<Tema> {
  const { data, error } = await sb.from('app_settings').select('value').eq('key', 'tema').maybeSingle()
  if (error) {
    console.error('tema: leitura falhou, usando o padrão', error.message)
    return TEMA_PADRAO
  }
  return lerTema(data?.value)
}
