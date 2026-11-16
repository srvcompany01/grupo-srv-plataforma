import { toast } from 'sonner'
import type { Resultado } from '@/servicos/acao'

/** Mostra erro sempre; sucesso só quando a ação tem mensagem própria e `mostrarOk` (ou quando traz um botão de ação). */
export function avisar(r: Resultado, mostrarOk = false): boolean {
  if (r?.erro) {
    toast.error(r.erro)
    return false
  }
  if (r?.ok && r.acao) {
    const { href, rotulo } = r.acao
    toast.success(r.ok, { action: { label: rotulo, onClick: () => window.location.assign(href) } })
  } else if (mostrarOk && r?.ok) toast.success(r.ok)
  return true
}
