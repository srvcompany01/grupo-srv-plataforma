'use client'

import { useRouter } from 'next/navigation'
import { Sheet, SheetContent, SheetTitle } from '@/componentes/ui/sheet'

/** Painel à direita para a rota interceptada da tarefa; fechar volta para a página de origem. */
export function PainelLateral({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  return (
    <Sheet open onOpenChange={(aberto) => !aberto && router.back()}>
      <SheetContent side="right" className="w-full overflow-y-auto p-5 sm:max-w-2xl">
        <SheetTitle className="sr-only">Tarefa</SheetTitle>
        {children}
      </SheetContent>
    </Sheet>
  )
}
