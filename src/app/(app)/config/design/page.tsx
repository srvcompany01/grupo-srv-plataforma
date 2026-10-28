import { exigirAdmin } from '@/infra/supabase/sessao'
import { Demonstracao } from './Demonstracao'

export default async function Design() {
  await exigirAdmin()
  return <Demonstracao />
}
