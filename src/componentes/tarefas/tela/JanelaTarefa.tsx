'use client'

import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/componentes/ui/dialog'

/** Janela grande para a rota interceptada da tarefa; fechar volta para a página de origem. */
export function JanelaTarefa({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  return (
    <Dialog open onOpenChange={(aberto) => !aberto && router.back()}>
      <DialogContent
        showCloseButton={false}
        className="fixed inset-0 top-0 left-0 flex h-dvh w-full max-w-none translate-x-0 translate-y-0 gap-0 overflow-hidden rounded-none p-0 sm:max-w-none md:inset-4 md:h-[calc(100dvh-2rem)] md:w-[calc(100vw-2rem)] md:rounded-xl"
      >
        <DialogTitle className="sr-only">Tarefa</DialogTitle>
        <DialogDescription className="sr-only">Detalhes e atividade da tarefa</DialogDescription>
        {children}
      </DialogContent>
    </Dialog>
  )
}
