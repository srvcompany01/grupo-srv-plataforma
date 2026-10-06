import { toast } from 'sonner'
import type { Resultado } from '@/servicos/acao'

/** Mostra erro sempre; sucesso só quando a ação tem mensagem própria e `mostrarOk`. */
export function avisar(r: Resultado, mostrarOk = false): boolean {
  if (r?.erro) {
    toast.error(r.erro)
    return false
  }
  if (mostrarOk && r?.ok) toast.success(r.ok)
  return true
}
